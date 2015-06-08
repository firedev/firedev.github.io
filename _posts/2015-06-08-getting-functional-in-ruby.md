---
layout: post
title:  "Getting functional in Ruby"
category: posts
tags:
  - ruby
image: posts/colors.png
---

Lately I am working on an old code base. That also means working with the old CSS.
One of the techniques to use when refactoring CSS is to replace colors with variables.
But first you need to find and catalogue all the colors in the project.

## Extracting colors from a project

So lets find all colors used in a project. Regular expression I came up with finds
a pound sign `#` followed by 3 or 6 numbers or letters in the range from `a` to `f`
and stops at the word boundary.

I am using [The Silver Searcher](https://github.com/ggreer/the_silver_searcher).
The output is too human-readable so let's throw in some options to dumb it down:


{% highlight sh %}
-i --ignore-case
  Match case-insensitively

-o --only-matching
  Print only the matching part of the lines

--nonumbers
  No line numbers

--nofilename
  No file names

--nocolor
  No color

--nobreak
  No linebreaks between results in different files
{% endhighlight %}

Thats a bit of a list actually but `ag` is fast and easy to use. Let's pipe the output
through `sort --uniq -f` to remove the duplicates ignoring the case and count the lines with `wc -l`:

{% highlight sh %}
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" | sort --uniq | wc -l
229
{% endhighlight %}

Wow that's a large number. The problem is, right now `#fff` and `#ffffff`
are treated as different colors. But I guess this is something we can fix in Ruby.

Here is what we are going to do:

### With the given list of colors
1. Convert colors to full hex
2. Make the list unique
3. Order by hue
4. Print the palette so we can see what is going on

## Functional Background

After getting some inspiration from
[Ruby Midwest 2013 Functional Principles for OO Development](https://www.youtube.com/watch?v=tq5SQ4W3gRI)
talk by Jessica Kerr I have decided to go all functional here.

`Enumerable#map` is the single most important method here. Just keep things mappable and you're fine.
If you are not sure about it, wrap your arguments in `Array()`, use asterisk `*` or `.to_a` method.
Just make sure you have Enumerator on input.

Most Ruby developers know about the pretzel symbol-to-proc operator that converts a
given symbol into a proc that calls the same method on the given object.

{% highlight ruby %}
%w(a b c).map(&:upcase)
=> ["A", "B", "C"]
{% endhighlight %}

Pretzel `&` here simply converts `:upcase` to a Proc so it's basically a syntax sugar.
The 'unpacked' version would look like this:

{% highlight ruby %}
%w(a b c).map{ |str| str.upcase }
{% endhighlight %}

But I don't want to chain my lambdas in the ugly way, too bad there is no short syntax
for lambdas in Ruby. Or is it? Turns out there is. So, given the `upper` lambda:

{% highlight ruby %}
upper = ->(a) { a.upcase }
{% endhighlight %}

Even after replacing `call` with `.()` it still doesn't look nice:

{% highlight ruby %}
%w(a b c).map{ |str| upper.(str) }
{% endhighlight %}

But there is a special syntax for lambdas that makes it all sweet:

{% highlight ruby %}
%w(a b c).map(& upper)
=> ["A", "B", "C"]
{% endhighlight %}

Now that's better, and to me that was the only part missing.
So let's store filtered `ag` output to the ruby file and start messing around:

{% highlight ruby %}
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" | sort --uniq -f > colors.rb
{% endhighlight %}

Another less-known feature in Ruby is that you can treat the rest of file as data
if you add `__END__` to your program. Here is an excerpt from the Ruby Docs:

{% highlight ruby %}
DATA is a File that contains the data section of the executed file.
To create a data section use __END__
{% endhighlight %}

So we can simply use the reset of the executable file as a `DATA` enumerator. Cool, eh?
{% highlight ruby %}
# colors.rb
puts DATA.count

__END__
#000
#008000
#00A347
{% endhighlight %}

##Let's get to business

For this project I will use [Paleta](https://github.com/jordanstephens/paleta) gem.
We have the colors loaded into the `DATA` enumerator. The only thing that's left is to
create some lambdas accoding to the plan.

### 1. Convert colors to full hex
That is easy, feed the color to Paleta and back in full hex. The only thing we need to add
is `chomp` to get rid of the newlines in strings:

{% highlight ruby %}
require 'paleta'
to_full_hex = ->(color) { Paleta::Color.new(:hex, color).hex }

puts DATA
  .map(&:chomp)
  .map(& to_full_hex)
{% endhighlight %}

### 2. Make the list unique
Simply add `.uniq` and finally we can see the real number of unique colors in the project.
{% highlight ruby %}
puts DATA
  .map(&:chomp)
  .map(& to_full_hex)
  .uniq
  .count

$ ruby colors.rb
221
{% endhighlight %}

What?! Okay, damn it, only a few colors were not unique. White and black I guess.

### 3. Order by hue
That might sound tricky but Paleta comes to the rescue.
Paleta provides a `.hue` method that we could use to sort colors. But since they are
strings we need to convert them back to objects.

That sounds fishy because it is. Let's use this opportunity and refactor the code slightly.
We remove `.hex` from the `to_full_hex` method and rename it. This simple refactoring
gives us even more freedom:

{% highlight ruby %}
require 'paleta'

to_paleta = ->(color) { Paleta::Color.new(:hex, color) }

puts DATA
  .map(&:chomp)
  .map(& to_paleta)
  .sort_by(&:hue)
  .map(&:hex)
  .uniq
  .count

  __END__
  #000
  #008000
  ...
{% endhighlight %}

### 4. Print the palette so we can see what is going on
Now let's devise a human-viewable palette so we could judge the colors.
Make some nice-looking colored `<div>`s or something.

{% highlight ruby %}
to_div = ->(str) {
  "<div style='width: 5em; height: 3em; display: inline-block; background: #{str}'>
  #{str}
  </div>"
}
{% endhighlight %}

And pipe it to a new file, because at the moment of writing this Paleta generated some
warning about Rmagic.

{% highlight ruby %}
File.open('colors.html', 'w') do |file|
  file.puts DATA
  .map(&:chomp)
  .map(& to_paleta)
  .sort_by(&:hue)
  .map(&:hex)
  .uniq
  .map(& to_div)
end
{% endhighlight %}

## Command-line reader
Okay that is nice but let's improve it a bit. First of all lets get rid of the static DATA
so we could use it right from the command line. That also will allow us to get right of `sort`.
Simply change `DATA` to `ARGF` and remove the `__END__` part.

Then lets open the resulting file right away.

{% highlight ruby %}
#!/usr/bin/env ruby

require 'paleta'

to_paleta = ->(color) { Paleta::Color.new(:hex, color) }
to_div = ->(str) {
  "<div style='font-family: sans-serif; width: 5em; height: 3em; border-radius 0.25em;
               line-height: 3em; display: inline-block; margin: 0.25em; text-align: center
               background: ##{str}'>
  ##{str}
  </div>"
}

File.open('colors.html', 'w') do |file|
  file.puts(
    ARGF
      .map(&:chomp)
      .map(& to_paleta)
      .sort_by(&:hue)
      .map(&:hex)
      .uniq
      .map(& to_div)
  )
end

`open colors.html`

{% endhighlight %}

Now you can pipe the output from `ag` and even sample a single css file if needed. Don't forget to `chmod +x colors.rb`

Here is the [final version](https://gist.github.com/firedev/1b3e03afd9c7fca93207)
you can use for processing your files or projects:

{% highlight sh %}
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" [path] | ./colors.rb
{% endhighlight %}

It makes sense to sort palettes by hue or lightness or saturation, this is simply
a matter of changing a method name in `.map(&:hue)`.

This was enough for my needs and I just wanted to document the approach.
