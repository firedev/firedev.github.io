---
layout: post
title:  "Lazy image creation with Carrierwave"
category: posts
tags:
  - Rails
  - Carrierwave
image: 'logos/rails.svg'
background_size: contain
---

I don't know about you but I kind of grown to like Carrierwave. Yes, there are
other uploaders on the block but that's not the point. Everybody I know are using
it wrong.

If you are storing images on your own server I bet you are always concerned about
versions. Let's say for an average web site you need at least three versions:

* Featured: Big cropped wide screen image for heading
* Default: Smaller image for gallery
* Thumb: Thumbnail for the list

These are just for the sake of the example but there could be more. And  for
each image you need only a subset of versions. Only one image per article is
displayed as a featured image, not every image goes to gallery etc.
But you create them all anyway, because that's how it is.

## Stop

You're doing it wrong. While versions creation is indeed the
Carrierwave's responsibility, the decision on which version to create should
not be made when image is uploaded. And certainly you don't need to create all
versions at the same time or check if the file exists.

Come to think of it, you don't know upfront what version you might need so you
create all possible versions or create some inventive schemes with conditional
versioning thanks to Carrierwave abilities.

But in fact there is a better way. Lazily create only the versions that are
actually being used just-in-time when the request comes.

## Hammer time

Okay let's roll our sleeves. The idea is to create the route matching
the image path. If the asset is missing the request falls through to Rails and
image is created. Next time the request comes to this url, nginx takes care of
serving the static asset.

To start off let's delay the versions creation until the moment we actually need
them. Let's add the `now` modifier to uploader and make sure no versions are
created until we say so:

```ruby
# app/uploaders/image_uploader.rb

  version :default, if: :now? do
    ...
  end

  version :featured, if: :now? do
    ...
  end

  version :thumb, if: :now? do
    ...
  end

  def now
    @now = true
    self
  end

  protected

  def now?(_)
    @now
  end
```

In the `Image` class we are going to add a method that actually creates a version.
All it does - sets `@now` to `true` and then calls `recreate_versions!` for a
given `version`. Lazy, not crazy, we don't want to create anything
uncontrollably.

```ruby
# app/models/image.rb

  def create_version(process)
    file.now.recreate_versions!(process)
  end
```

I am using almost the out of the box uploader with the small addition.
Here is an inflector that breaks long id strings so you don't end up with too
many images in one folder.

```ruby
# lib/inflector.rb

module Inflector
  def self.call(id)
    path = ''
    name = id.to_s.dup
    (name.size - 2).times { path += name.slice!(0) + '/' }
    path += id.to_s
  end
end
```

```ruby
# spec/lib/inflector_spec.rb

require 'spec_helper'

describe Inflector do

  def inflect(id)
    Inflector.call id
  end

  specify do
    expect(inflect 1).to eq('1')
    expect(inflect 10).to eq('10')
    expect(inflect 100).to eq('1/100')
    expect(inflect 1_000).to eq('1/0/1000')
    expect(inflect 10_000).to eq('1/0/0/10000')
    expect(inflect 100_000).to eq('1/0/0/0/100000')
  end

end
```

Here is the `store_dir` from `image_uploader.rb`:

```ruby
# app/uploaders/image_uploader.rb

  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{Inflector.call model.id}"
  end
```

Let's write a routing test to make sure requests are landing right at our
`MissingController`. Missing like "image is missing". And test a couple of routes
with and without inflected paths just to be sure:

```ruby
# spec/routing/missing_spec.rb

require 'rails_helper'

describe 'Routes', type: :routing do
  describe 'Missing Image' do
    specify do
      expect(
        get '/uploads/image/40/thumb_5f5e5c3b-a665-494c-9c21-be82d49f6451.jpg'
      ).to route_to(
        controller: 'missing',
        action: 'show',
        klass: 'image',
        id: '40',
        version: 'thumb',
        file: '5f5e5c3b-a665-494c-9c21-be82d49f6451',
        format: 'jpg'
      )
    end
  end

  specify do
    expect(
      get '/uploads/image/1/0/1003/featured_c3ad3865-93f0-4032-a6fe-5c2ada381456.JPG'
    ).to route_to(
      controller: 'missing',
      action: 'show',
      klass: 'image',
      inflection: '1/0',
      id: '1003',
      version: 'featured',
      file: 'c3ad3865-93f0-4032-a6fe-5c2ada381456',
      format: 'JPG'
    )
  end
end
```

Okay now it's time to make a route. Fortunately we can use constraints to make
matters easier for everybody. Rails doesn't have to think how to parse it and
here is what I came up with:

```ruby
# config/routes.rb

# /uploads/block/image/1/default_7fd5acc8-5c06-4dcc-955e-f4fc5f76be01.jpg
get 'uploads/:klass/(*inflection)/:id/(:version)_(:file)',
    to: 'missing#show',
    constraints: {
        klass: /\D*/,   # anything but numbers
        id: /\d*/       # numbers only
    }
```

And the `MissingController` itself:

```ruby
# app/controllers/missing_controller.rb

class MissingController < ApplicationController
  def show
    redirect_to env['PATH_INFO'] if create_version
  end

  private

  def create_version
    image.create_version(version)
  end

  def image
    params[:klass].camelize.constantize.find(params[:id])
  end

  def version
    params[:version].to_sym
  end
end
```

All it does - creates a version according to `params` and once image is created
the same url is being requested again. But this time the created image will be
served by nginx on top of the Rails app.

## Nginx

If you have any special settings for static files in `uploads` folder you might
want to amend your nginx config for the given site like so:

```
; /etc/nginx/sites-available/site

location ^~ /uploads/ {
    ...
    try_files $uri @backend;
}

location @backend {
      proxy_pass ...
}
```

## Broken Images

Say you have some broken images that can't be recreated and causing errors. Let's
get rid of them automatically. Via some augmentation of our `MissingController`
we can do that now.

I would suggest to add some default "broken" image to
`/assets/images/layout/missing_image.png`
so you can see any sign that the image is deleted. Then we are changing the `show` method:

```ruby
# app/controller/missing_controller.rb

class MissingController < ApplicationController

  EXCEPTIONS = [
    Errno::ENOENT, # Original Image not found
    CarrierWave::ProcessingError # Image is broken
  ]

  def show
    redirect_to env['PATH_INFO'] if create_version
  rescue *EXCEPTIONS
    image.destroy
    redirect_to self.class.helpers.asset_url('layout/missing_image.png')
  end

  private

  def create_version
    image.create_version(version)
  end

  def image
    params[:klass].camelize.constantize.find(params[:id])
  end

  def version
    params[:version].to_sym
  end
end
```

Now you have fast upload, delayed image creation and the nice part is that you
can delete the whole `uploads` folder. Versions will be re-created.
You can change formats on-the-fly when design changes. Broken files will be
automatically deleted as well. In other words -- you don't need to worry about images.

This is pretty much the complete implementation taken out of one of the projects I
am working on. Please let me know if that helped you. Thanks.
