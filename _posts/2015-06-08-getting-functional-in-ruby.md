---
layout: post
title: "Getting functional in Ruby"
category: posts
tags:
  - ruby
  - functional
image: posts/colors.png
---

Lately I am working on an old code base and that means working with the old CSS.
One of the techniques to use when refactoring CSS is to replace colors with variables.
But first you need to find and catalogue all the colors in the project.

## Extracting colors from a project

Let's find all colors used in a project. Regular expression I came up with finds
a pound sign `#` followed by 3 or 6 numbers or letters in the range from `a` to `f`
and stops at the word boundary.

I am using [The Silver Searcher](https://github.com/ggreer/the_silver_searcher).
The output is too human-readable so let's throw in some options to dumb it down:

```sh
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
```

Thats a quite a list of options but I like `ag`. Now let's pipe the output
through `sort --uniq -f` to remove the duplicates ignoring the case and count the lines with `wc -l`:

```sh
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" | sort --uniq | wc -l
229
```

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

```ruby
%w(a b c).map(&:upcase)
=> ["A", "B", "C"]
```

Pretzel `&` here converts `:upcase` to a Proc and serves as a syntax sugar.
The 'unpacked' version would look like this:

```ruby
%w(a b c).map{ |str| str.upcase }
```

But I don't want to chain my lambdas in the ugly way, too bad there is no short syntax
for lambdas in Ruby. Or is it? Turns out there is. Given the `upper` lambda:

```ruby
upper = ->(a) { a.upcase }
```

Even after replacing `call` with `.()` it still doesn't look nice:

```ruby
%w(a b c).map{ |str| upper.(str) }
```

But there is a special syntax for lambdas that makes it all sweet:

```ruby
%w(a b c).map(& upper)
=> ["A", "B", "C"]
```

Now that's better, and to me that was the only part missing.
Let's store filtered `ag` output to the ruby file and start messing around:

```ruby
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" | sort --uniq -f > colors.rb
```

Another less-known feature in Ruby is that you can treat the rest of file as data
if you add `__END__` to your program. Here is an excerpt from the Ruby Docs:

```ruby
DATA is a File that contains the data section of the executed file.
To create a data section use __END__
```

We can simply use the reset of the executable file as a `DATA` enumerator. Cool, eh?
```ruby
# colors.rb
puts DATA.count

__END__
#000
#008000
#00A347
```

##Let's get to business

For this project I will use [Paleta](https://github.com/jordanstephens/paleta) gem.
We have the colors loaded into the `DATA` enumerator. The only thing that's left is to
create some lambdas accoding to the plan.

### 1. Convert colors to full hex
To do that we are going to feed the color to Paleta and get hex value back. The only thing we need to add
is `chomp` to get rid of the newlines in strings:

```ruby
require 'paleta'
to_full_hex = ->(color) { Paleta::Color.new(:hex, color).hex }

puts DATA
  .map(&:chomp)
  .map(& to_full_hex)
```

### 2. Make the list unique
Simply add `.uniq` and finally we can see the real number of unique colors in the project.
```ruby
puts DATA
  .map(&:chomp)
  .map(& to_full_hex)
  .uniq
  .count

$ ruby colors.rb
221
```

What?! Okay, damn it, only a few colors were not unique. White and black I guess.

### 3. Order by hue
That might sound tricky but Paleta comes to the rescue.
Paleta provides a `.hue` method that we could use to sort colors. But since they are
strings we need to convert them back to objects.

That sounds fishy because it is. Let's use this opportunity and refactor the code slightly.
We remove `.hex` from the `to_full_hex` method and rename it. This refactoring
gives us even more freedom:

```ruby
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
```

### 4. Print the palette so we can see what is going on
Now let's devise a human-viewable palette so we could judge the colors.
Make some nice-looking colored `<div>`s or something.

```ruby
to_div = ->(str) {
  "<div style='width: 5em; height: 3em; display: inline-block; background: #{str}'>
  #{str}
  </div>"
}
```

And pipe it to a new file, because at the moment of writing this Paleta generated some
warning about Rmagic.

```ruby
File.open('colors.html', 'w') do |file|
  file.puts DATA
  .map(&:chomp)
  .map(& to_paleta)
  .sort_by(&:hue)
  .map(&:hex)
  .uniq
  .map(& to_div)
end
```

## Command-line reader
Okay that is nice but let's improve it a bit. First of all lets get rid of the static DATA
so we could use it right from the command line. That allows us to get right of `sort`.
Simply change `DATA` to `ARGF` and remove the `__END__` part.

Then lets open the resulting file right away.

```ruby
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

```

Now you can pipe the output from `ag` and even sample a single css file if needed. Don't forget to `chmod +x colors.rb`

Here is the [final version](https://gist.github.com/firedev/1b3e03afd9c7fca93207)
you can use for processing your files or projects:

```sh
$ ag -io --nonumber --nofilename "#([\da-f]{3}|[\da-f]{6})\b" [path] | ./colors.rb
```

It makes sense to sort palettes by hue or lightness or saturation, this is simply
a matter of changing a method name in `.map(&:hue)`. Maybe some command-line switches
would be appropriate here as well but this was enough for my needs and I just
wanted to document the approach.
