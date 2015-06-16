---
layout: post
title:  "Refactoring with map, pluck and select in Ruby on Rails"
category: posts
tags:
  - Rails
  - Refactoring
image: 'logos/rails.svg'
background_size: contain
---
If you need to get something out of the database, consider using `pluck` to avoid
creating instances you don't need.

I am working with an old code base at the moment and do a lot of refactoring.
That provides me with something to think about every day.

In this particular code base I see a lot of transformation of database objects
in Ruby, but is that effective?
Let's check and see if we can improve anything.

## Experiment

Before venturing off let's create a simple test bench to measure performance:

{% highlight ruby %}
def m(&block)
  Benchmark.ms do
    100.times { yield }
  end
end
{% endhighlight %}

And compare `pluck` with `map` on this particular piece of code:

{% highlight ruby %}
m { stock_movement.positions.pluck(:product_id) }
=> 265.032
m { stock_movement.positions.map(&:product_id) }
=> 220.282
{% endhighlight %}

We see almost no difference, so what's the point? But performance depends on other factors.

{% highlight ruby %}
stock_movement.positions.count
=> 1
{% endhighlight %}

Let's try it with something more substantial:
{% highlight ruby %}
stock_movement.positions.count
=> 400
m { stock_movement.positions.map(&:product_id) }
=> 5647.272

m { stock_movement.positions.pluck(:product_id) }
=> 349.746
{% endhighlight %}

Now, we're talking, but in fact we're not.
This code is used once in the controller, and it might be that there is no
actual performance benefit especially when using small amount of data:

{% highlight ruby %}
m { @stock_movement_positions.pluck(:product_id); }
=> 2367.685
m { @stock_movement_positions.map(&:product_id); }
=> 367.844
{% endhighlight %}

You have to be especially careful inside of the loops. This is not a rule of the thumb
but when dealing with database I would conside using `pluck`. Or `select`.

`select` is a different beast. Affected by Rails Magic it can act differently
things depending on its position in `ActiveRecord` chain. Plus there are different
flavors of `select` in `ActiveRecord::Association::CollectionProxy`, `ActiveRecord::QueryMethods` etc.

Anyway, what you need to know that it might return instanciated object with paritally filled fields. Or a sub-query, but that's another topic.

## A better example
So, armed with this knowlegde, let's find a better specimen.

Here is a good candidate for improvement I stumbled upon in a few places.
It returns an array of first letters in names in collection to build and alphabetic
lister later.

{% highlight ruby %}
StockProduct.select('LEFT(name, 1) as letter').group(:name).all.map(&:letter).uniq.sort
{% endhighlight %}

What immediately grabs attention is how database output that ends at `.all` being treated in Ruby.
Let's look at `select` first:
{% highlight ruby %}
StockProduct.select('LEFT(name, 1) as letter').to_sql
=> "SELECT LEFT(name, 1) as letter FROM `stock_products` "
{% endhighlight %}

The query does not look particulary mean or anything, again, especially if your
database is not that big. Unfortunately for us `select` instantiates a bunch of
half-filled (or half-empty) objects:

{% highlight ruby %}
=> [#<StockProduct >, #<StockProduct >, #<StockProduct >, ...
{% endhighlight %}

This is unacceptable, lets rewrite this using `pluck` instead of `select`, `DISTINCT` instead of `uniq` and throw away the rest:

{% highlight ruby %}
StockProduct.pluck('DISTINCT LEFT(name, 1)')
{% endhighlight %}

Another thing to keep in mind when using `pluck` - it returns the array and
breaks the `ActiveRecord` query method chain. And if you need to use the values
in a subsequent query you might be actually needing `select` as it would
construct a subquery to use. But in our case we don't need anything else so that's fine.

Let's compare:
{% highlight ruby %}
m { StockProduct.pluck('DISTINCT LEFT(name, 1)') }
=> 926.424
m { StockProduct.select('LEFT(name, 1) as letter').group(:name).all.map(&:letter).uniq.sort }
=> 28469.013
{% endhighlight %}

Finally, something good comes out of this refactoring. Moving the code to concern:

{% highlight ruby %}
# app/models/concerns/search/first_letter.rb
class Search
  module FirstLetter
    extend ActiveSupport::Concern
    included do
      scope :by_letter, -> (letter) { where('name LIKE ?', "#{letter}%") }
    end

    module ClassMethods
      def first_letters
        pluck('DISTINCT LEFT(name, 1)')
      end
    end
  end
end
{% endhighlight %}

## Hey, what about sorting?
Okay, you got me. Yes that is a good question. But let's think about it first.
As I output the results in alphabetical order and numbers separated from letters
that means I have a knowledge of that.

And this knowledge is kept in the view layer. I am simply intersecting arrays like this:

{% highlight ruby %}
# views/letters/_letters.html.slim
(?0..?9).to_a & first_letters
(?A..?Z).to_a & first_letters
{% endhighlight %}

This simple construct gives me intersection ordered by alphabet and in numerical order if there are any.

One thing less to worry about. That frees up some brain capacity what is in my
book ultimately is the point of refactoring.
