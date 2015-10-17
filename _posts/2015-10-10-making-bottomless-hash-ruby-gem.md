---
layout: post
title:  "Making Bottomless Hash Ruby Gem"
category: posts
tags:
  - ruby
  - gem
image: 'posts/bottomless_pit_gravity_falls.jpg'
background_size: cover
---

After making [Bottomless Hash](http://firedev.com/2015/bottomless-ruby-hash)
last time and writing tests the next logical step is to make a Gem out of it.

## Preparation

First things first. Let's see if the name is not taken.

```
$ gem search bottomless_hash

*** REMOTE GEMS ***

```

Looks good, now generate a template and an empty git repo to have less typing.
We'll use RSpec, since I already have tests written.

```sh
$ bundle help gem                                                                                                                                                            127 ↵
Usage:
  bundle gem GEM [OPTIONS]

Options:
  -b, [--bin], [--no-bin]            # Generate a binary for your library.
      [--coc], [--no-coc]            # Generate a code of conduct file. Set a default with `bundle config gem.coc true`.
  -e, [--edit=EDITOR]                # Open generated gemspec in the specified editor (defaults to $EDITOR or $BUNDLER_EDITOR)
      [--ext], [--no-ext]            # Generate the boilerplate for C extension code
      [--mit], [--no-mit]            # Generate an MIT license file. Set a default with `bundle config gem.mit true`.
  -t, [--test=rspec]                 # Generate a test directory for your library, either rspec or minitest. Set a default with `bundle config gem.test rspec`.
      [--no-color], [--no-no-color]  # Disable colorization in output
  -r, [--retry=NUM]                  # Specify the number of times you wish to attempt network commands
  -V, [--verbose], [--no-verbose]    # Enable verbose output mode

```

Create a Ruby Gem skeleton with RSpec as a test runner.

```
$ bundle gem bottomless_hash -t=rspec
Creating gem 'bottomless_hash'...
Do you want to include a code of conduct in gems you generate?
Codes of conduct can increase contributions to your project by contributors who prefer collaborative, safe spaces. You can read more about the code of conduct at contributor-covenant.org. Having a code of conduct means agreeing to the responsibility of enforcing it, so be sure that you are prepared to do that. For suggestions about how to enforce codes of conduct, see bit.ly/coc-enforcement. y/(n): y
Code of conduct enabled in config
Do you want to license your code permissively under the MIT license?
This means that any other developer or company will be legally allowed to use your code for free as long as they admit you created it. You can read more about the MIT license at choosealicense.com/licenses/mit. y/(n): y
MIT License enabled in config
      create  bottomless_hash/Gemfile
      create  bottomless_hash/.gitignore
      create  bottomless_hash/lib/bottomless_hash.rb
      create  bottomless_hash/lib/bottomless_hash/version.rb
      create  bottomless_hash/bottomless_hash.gemspec
      create  bottomless_hash/Rakefile
      create  bottomless_hash/README.md
      create  bottomless_hash/bin/console
      create  bottomless_hash/bin/setup
      create  bottomless_hash/CODE_OF_CONDUCT.md
      create  bottomless_hash/LICENSE.txt
      create  bottomless_hash/.travis.yml
      create  bottomless_hash/.rspec
      create  bottomless_hash/spec/spec_helper.rb
      create  bottomless_hash/spec/bottomless_hash_spec.rb
Initializing git repo in gems/bottomless_hash
```

I have included all this licences and codes of conduct as some people are
very sensitive to this and will email you asking if they can change your
code if you won't include any of these.

Okay it is quite a handful so I'll publish it on GitHub.

```sh
$ git remote add origin git@github.com:firedev/bottomless_hash.git
$ git push -u origin master
Counting objects: 21, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (18/18), done.
Writing objects: 100% (21/21), 4.75 KiB | 0 bytes/s, done.
Total 21 (delta 0), reused 0 (delta 0)
To git@github.com:firedev/bottomless_hash.git
 * [new branch]      master -> master
 Branch master set up to track remote branch master from origin.
```

Great now let's get to business.

## Filling up the blanks

There is a bunch of files but for now we just need to fill up
`bottomless_hash.gemspec`.

```ruby
# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'bottomless_hash/version'

Gem::Specification.new do |spec|
  spec.name          = "bottomless_hash"
  spec.version       = BottomlessHash::VERSION
  spec.authors       = ["Nick Ostrovsky"]
  spec.email         = ["nick@firedev.com"]

  spec.summary       = %q{Ruby Hash modified to accept keys blindly}
  spec.description   = %q{Is there a way to blindly assign nested values to a
                          Ruby hash without creating each key’s hash separately? Yes, but it’s more
                          involved than you’d think.}
  spec.homepage      = "https://github.com/firedev/bottomless_hash"
  spec.license       = "MIT"

  # Prevent pushing this gem to RubyGems.org by setting 'allowed_push_host', or
  # delete this section to allow pushing this gem to any host.
  # if spec.respond_to?(:metadata)
  #   spec.metadata['allowed_push_host'] = "TODO: Set to 'http://mygemserver.com'"
  # else
  #   raise "RubyGems 2.0 or newer is required to protect against public gem pushes."
  # end

  spec.files         = `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.10"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_development_dependency "rspec"
end
```

That'll do it. I just commented out the part about not letting this gem to be
pushed to public repos. RSpec development dependency is already injected so I
guess we are good to go.

## Add the meat, not the heat

Now let us add the actual files. If you take a look Ruby gems are following the
simple structure.

```
lib/gem_name.rb
lib/gem_name/
lib/gem_name/version.rb
```

The file in lib is required by default, `version.rb` is a single constant,
everything else is up to you.

The common way of structuring stuff is to put everything in the `lib/gem_name`
and require from `lib/gem_name.rb` that makes everything a bit tidier. But we have
nothing to hide so let's put everything from the
[GitHub gist](https://gist.github.com/firedev/9de91e245f70c2e963e4)
into `lib/bottomless_hash.rb`

```ruby
# lib/bottomless_hash.rb

require "bottomless_hash/version"

class BottomlessHash < Hash
  def initialize
    super &-> h, k { h[k] = self.class.new }
  end

  def self.from_hash(hash)
    new.merge(hash)
  end
end

class Hash
  def bottomless
    BottomlessHash.from_hash(self)
  end
end
```

And don't forget specs.

```ruby
# spec/bottomless_hash
require 'spec_helper'

describe BottomlessHash do
  it 'has a version number' do
    expect(BottomlessHash::VERSION).not_to be nil
  end

  it 'does not raise on missing key' do
    expect do
      subject[:missing][:key]
    end.to_not raise_error
  end

  it 'returns an empty value on missing key' do
    expect(subject[:missing][:key]).to be_empty
  end

  it 'stores and returns keys' do
    subject[:existing][:key] = :value
    expect(subject[:existing][:key]).to eq :value
  end

  describe '#from_hash' do
    let (:hash) do
      { existing: { key: { value: :hello } } }
    end

    subject do
      described_class.from_hash(hash)
    end

    it 'returns old hash values' do
      expect(subject[:existing][:key][:value]).to eq :hello
    end

    it 'provides a bottomless version' do
      expect(subject[:missing][:key]).to be_empty
    end

    it 'stores and returns new values' do
      subject[:existing][:key] = :value
      expect(subject[:existing][:key]).to eq :value
    end

    it 'converts nested hashes as well' do
      expect do
        subject[:existing][:key][:missing]
      end.to_not raise_error
    end
  end
end
```

Now lets run it. You will see some errors, stemming from the fact that
`version.rb` thinks `BottomlessHash` is a module. We could wrap everything up
in the module, but I don't have any good ideas for naming. So let's just patch
the things up quickly.

```ruby
# lib/bottomless_hash/version.rb

class BottomlessHash < Hash
  VERSION = "0.1.0"
end
```

A little bit ugly but okay.

```sh
$ bundle
$ rspec

BottomlessHash
  has a version number
  does not raise on missing key
  returns an empty value on missing key
  stores and returns keys
  #from_hash
    returns old hash values
    provides a bottomless version
    stores and returns new values
    converts nested hashes as well

Finished in 0.00668 seconds (files took 0.12033 seconds to load)
8 examples, 0 failures
```

Okay that part went fine. Commit and push to Github. It might
be a bit too verbose for the purpose of this post, but by
documenting everything so I can use it later.

Let's add another test to make sure Ruby `Hash` class gets patched as well.
This time we would have to require `BottomlessHash` as `spec_helper` would
not be able to infer it's name from the spec file.

```ruby
# spec/hash_spec.rb

require_relative '../lib/bottomless_hash'

describe Hash do
  subject do
    {
      existing: {
        key: :hello
      }
    }.bottomless
  end
  it 'is a BottomlessHash now' do
    expect(subject).to be_a BottomlessHash
  end

  it 'returns values for existing keys' do
    expect(subject[:existing][:key]).to eq :hello
  end

  it 'bottomlessly stores values' do
    subject[:new][:value] = :omg
    expect(subject[:new][:value]).to eq :omg
  end

  it 'does not raise error on missing keys' do
    expect do
      subject[:missing][:key]
    end.to_not raise_error
  end
end
```

Another pass and we're good to go.

```sh
$ rspec spec/hash_spec.rb

Hash
  is a BottomlessHash now
  returns values for existing keys
  bottomlessly stores values
  does not raise error on missing keys

Finished in 0.00285 seconds (files took 0.09323 seconds to load)
4 examples, 0 failures
```

Now let's add some docs and publish.

## Publishing

After getting an account on [RubyGems](http://rubygems.org) it is simple.

First you have to build a gem.

```sh
$ gem build bottomless_hash.gemspec                                                                                                    1 ↵
WARNING:  open-ended dependency on rspec (>= 0, development) is not recommended
  if rspec is semantically versioned, use:
    add_development_dependency 'rspec', '~> 0'
WARNING:  See http://guides.rubygems.org/specification-reference/ for help
  Successfully built RubyGem
  Name: bottomless_hash
  Version: 0.1.0
  File: bottomless_hash-0.1.0.gem
```

Okay it worked but I'd like to get rid of the warning, so I change the line in
`.gemspec` as suggested.

```diff
$ git diff
diff --git a/bottomless_hash.gemspec b/bottomless_hash.gemspec
index b0a7bb7..817054f 100644
--- a/bottomless_hash.gemspec
+++ b/bottomless_hash.gemspec
@@ -31,5 +31,5 @@ Gem::Specification.new do |spec|

   spec.add_development_dependency "bundler", "~> 1.10"
   spec.add_development_dependency "rake", "~> 10.0"
-  spec.add_development_dependency "rspec"
+  spec.add_development_dependency "rspec", "~> 0"
 end
```
```sh
$ gem build bottomless_hash.gemspec
  Successfully built RubyGem
  Name: bottomless_hash
  Version: 0.1.0
  File: bottomless_hash-0.1.0.gem
```

Now the gem is built without warnings. And we can push it to RubyGems.

```sh
$ gem push bottomless_hash-0.1.0.gem
Enter your RubyGems.org credentials.
Don't have an account yet? Create one at https://rubygems.org/sign_up
   Email:   nick@firedev.com
Password:

Signed in.

Pushing gem to https://rubygems.org...
Successfully registered gem: bottomless_hash (0.1.0)
```

This is it. The gem is published and you can use it right away:

```sh
$ gem search bottomless_hash

*** REMOTE GEMS ***

bottomless_hash (0.1.0)
```

### Links
<i class="fa fa-file-o"></i> [Bottomless Ruby Hash](http://firedev.com/posts/2015/bottomless-ruby-hash)<br>
<i class="fa fa-file-o"></i> [Making Bottomless Ruby Hash Gem](http://firedev.com/posts/2015/making-bottomless-ruby-hash-gem)<br>
<i class="fa fa-github"></i> Github [firedev/bottomless_hash](https://github.com/firedev/bottomless_hash)<br>
<i class="fa fa-github"></i> Gist [bottomless_hash.rb](https://gist.github.com/firedev/9de91e245f70c2e963e4)<br>
