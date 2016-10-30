---
layout: post
title:  "nanogrid: Fluid responsive CSS grid with gutters"
category: posts
tags:
  - CSS
  - frontend
image: nanogrid.png
---
Inspired by [Ungrid](https://github.com/chrisnager/ungrid/) and [BASSCSS](https://github.com/basscss/basscss/)
I have decided to build on top of their shoulders. Welcome the nanogrid.

### Ungrid
Ungrid is a nifty grid that packs everything in less than a hundred bytes by
using `display: table` trick:
{% highlight css %}
@media (min-width: 30em) {
    .row { width: 100%; display: table; table-layout: fixed; }
    .col { display: table-cell; }
}
{% endhighlight %}
And it's quite powerful [see the demo](https://github.com/chrisnager/ungrid/) plus
using `display: table` is a nifty trick that solves issues with
[Flexbox](http://caniuse.com/#flexbox).
Actually it seems the browsers are getting up to speed with Flexible Box Layout.
Even if it's time to jump on the F-train, this is a cool experiment.

### BASSCSS
Another sweet concept that offers a bunch of immutable css styles that allow you to
work by writing everything in HTML. Check [the examples](http://www.basscss.com/).
It offer a grid of it's own and the opportunity to combine the best of both worlds
is too good to pass up.

### nanogrid
Let's use SASS for this, as I am most comfortable with it. And add some variables to the mix:

{% highlight sass %}
$nanogrid-breakpoint: 30em !default
@media (min-width: $nanogrid-breakpoint)
  .row
    width: 100%
    display: table
    table-layout: fixed
  .col
    display: table-cell
{% endhighlight %}

Throw in grid classes from BASSCSS
[grid module](https://github.com/basscss/grid/blob/master/lib/grid.css).
Using sass `@for` we can calculate all the values upfront.
{% highlight sass %}
.col
  float: left
  box-sizing: border-box

.col-right
  float: right
  box-sizing: border-box

@for $i from 1 through 12
  .col-#{$i}
    width: #{$i/12 * 100%}
  .row .col-#{$i}
    float: none
{% endhighlight %}

Okay time to add some gutters. The tricky part here is that you can't simply use
negative margins as they don't work well on `display: table`. Element only moves to the left.
We could solve it by using some container element as Chris Nager did [here](https://codepen.io/chrisnager/pen/arKBu)  But that is not very fun so as I know for fact that all my users are using Chrome I can
once again resort to the power of calc.

Let's also fix the counter effect of floats introduced by BASSCSS grid and add a gutter variable.

{% highlight sass %}
$nanogrid-gutter: 1rem

.row
  display: table
  table-layout: fixed
  width: calc(100% + #{$nanogrid-gutter})
  margin: 0 #{-$nanogrid-gutter/2}

  .col
    float: none
    display: table-cell
    padding: 0 #{$nanogrid-gutter/2}
{% endhighlight %}

This introduces the negative margin on the right so it's best to be aware of it.

## Good parts

What's the point of it? It is small, flexible, the columns are arranged automatically.
All columns are having equal height and you don't need clearfix and you can center content vertically.

There are some nuances though as the negative margin should be negated on the right
if you are using the grid as the top element on the page. Either with an `overflow: hidden`
container or `body` padding.

I have set up a homepage for it [{%icon fa-github %} firedev/nanogrid](http://firedev.github.io/nanogrid) so have a look.
