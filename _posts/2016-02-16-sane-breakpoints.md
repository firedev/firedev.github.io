---
layout: post
title: "Sane Breakpoints"
category: posts
tags:
  - CSS
  - breakpoints
  - frontend
image: 'posts/break-point.jpg'
custom_css: |
  table { margin-bottom: 1rem }
  table img { width: 3rem; height 3rem; }
  table td { vertical-align: middle; }

---

I see different approaches to breakpoints and responsive design.
Most of the time they are over-complicated and only making things worse.
So here's mine suggestion for device breakpoints that are in touch
with reality.

_And if my day keeps goin' this way I just might... break somethin' tonight_

## Responsive design

Let's recap how to we design for different devices. You define some breakpoints -
conditions where your site changes. Then you describe what changes once
conditions are met. Conditions can be pretty broad, like for example `@media print`
that allows you to apply additional styling for printing pages. Or `min-width: 1000px`
that allows you to target only bigger screens.

Sounds easy, right? However the problem with CSS is that it give one too much
flexibility without enforcing any structure. That causes CSS bloat and leads to
unmaintainable stylesheets down the line.

## Strict CSS

A saner approach is to let some constraints in.

1. Add `<meta content="width=device-width, initial-scale=1" name="viewport" />` to your HTML
2. Define breakpoints for your website and stick to them
3. Use only `min-width` so you are going from smaller to bigger screens

That is pretty much it. There are some tricky parts, though.

Use 1:1 viewport, this is important if you don't want to pulling your hair out later.
This way you will always work with something you're looking at, not a scaled version of
your website.

I guess everybody is using SASS or PostCSS or something that allows you do define
CSS variables, so I won't be stopping on defining variables and go straight
to the next point. Just don't go overboard, you ain't going to need it.

CSS allows you to use `min-width`, `max-width` or both, plus some additional modifiers
like `orientation: portrait` and god knows what else. However there are good parts and
there are bad parts. Some things you don't have to use if you don't want to
spend the rest of your live debugging the cascade.

All your styles should look like this:

```scss
// Hides element on screens bigger than $small breakpoint
.sm-hide {
  @media (min-width: $small) {
    display: none;
  }
}
```
## Devices

But we can't use only `min-width`! We want out site to look best on mobile devices
We have to use `orientation: portrait` and `landscape`! Maybe not. Think what
is exactly you are trying to achieve?

Let's ask our project manager for some specs. Some realistically formulated
requirements could be:

* Page should take up full width on a smaller screen
* Display sidebar on a larger screen, collapse it on a smaller screen

Now we're talking. Note that it doesn't mention **landscape** or **portrait**.
Just introducing a general idea of **smaller** and **larger** screens.

Let's take a look at some common internet-consuming devices. And see where we can
draw a line between **smaller** and **larger**.
Don't worry if looks a bit Apple-biased, the results are universally applicable.

|                                             | | CSS Width | |
|---------------------------------------------|-------------------------|--------|------------|
| ![](/images/devices/iphone-vertical.svg)    | **iPhone** Portrait     | 320px  | 20rem      |
| ![](/images/devices/iphone6-vertical.svg)   | **iPhone 6** Portrait   | 375px  | 23.4375rem |
| ![](/images/devices/iphonep-vertical.svg)   | **iPhone 6+** Portrait   | 414px  | 25.875rem  |
| ![](/images/devices/iphone-horizontal.svg)  | **iPhone** Landscape   | 568px  | 35.5rem    |
| ![](/images/devices/iphone6-horizontal.svg) | **iPhone 6** Landscape | 667px  | 41.6875rem |
| ![](/images/devices/iphonep-horizontal.svg) | **iPhone 6+** Landscape | 736px  | 46rem      |
| ![](/images/devices/ipad-vertical.svg)      | **iPad** Portrait       | 768px  | 48rem      |
| ![](/images/devices/ipad-horizontal.svg)    | **iPad** Landscape     | 1024px | 64rem      |
| ![](/images/devices/ipadpro-vertical.svg)   | **iPad Pro** Portrait   | 1024px | 64rem      |
| ![](/images/devices/macbookpro.svg)         | **Macbook Pro** 13"     | 1280px | 80rem      |
| ![](/images/devices/ipadpro-horizontal.svg) | **iPad Pro** Landscape | 1366px | 85.375rem  |
| ![](/images/devices/macbookpro.svg)         | **PC Notebook** | 1366px | 85.375rem  |

## Middle ground

When people think about breakpoints they often imagining them as some
magical bullet that can detect if you are using an iPad.

**I am referring only to `@media (min-width: $variable)` well-behaved
breakpoints as this are the only ones you should use.**

Think of a breakpoint as a fence. Like a fence it has two sides, everything
that is smaller than the specified width and everything that is equal or larger
than the specified width.

In other words you can think of it as a equals or larger than equation:

```
.menu { folded }
@media (screen width >= x) {
  .menu { unfolded }
}
```

That makes me think that in most cases you could do with a single breakpoint.
Or at the very least we can start with it.  Let's call it `$medium`. Everything
on the left will be considered a **smaller** screen and everything on the right
is a **larger** screen.

Why not name them `$desktop`/`$tablet`/`$mobile`/`$whatever`? Isn't this
*semantic*? I hear this question a lot. The reasoning usually is that it's hard
to remember what is `$middle` or `$large`. First of all the semantics here is
meaningless. One can rotate an iPad, they can release a new device tomorrow,
and you will have to rename all your classes and whatnot. Besides, each
breakpoint is only a fence.

So I propose to claim a line between vertical and horizontal iPad orientation
as a `$medium` breakpoint. A perfect place to start moving further. By default
and until we are being viewed from the devices that is larger than `$medium`,
and that includes: mobile phones, tablets in portrait, half of the screen -- we
display content, say, in a single column.

Once our media query is triggered, for everything that is bigger than
`$medium`: that is for example an iPad in horizontal mode, computer screens,
TV -- we display multiple columns or un-collapse the menu.

## Other breakpoints

Let's separate the devices on a smaller side of the `$medium` so we can target
portrait and landscape modes separately. This way when somebody is looking at
your website on his phone he sees the initial styling.

Once he rotates the phone - he makes a first jump over the `$small` breakpoint
fence. Everything that is styled with `min-width: $small` kicks in.

This is what one would see the on an iPad in portrait orientation. But our
users want to see more. So they rotate the iPad (or get an iPad pro) and that
moves them over the `$medium` breakpoint.

The last one, `$large` covers everything bigger than an iPad in Landscape. That
is the computer screen and the iPad Pro.

## Final results

Pixel sizes are provided only for reference. You should stick to rem-based
sizes. Calculations are based on the default 16px body font size. I don't
recommend using pixels. Stick to rem as this is not relative and equals body
font size. With `rem` you can increase font size when needed and the layout
will adapt. For example, if you need to show something on an HD TV across the
room.

|                 | $small    |                  | $medium   |                   | $large     |                    |
|-----------------|-----------|------------------|-----------|-------------------|------------|--------------------|
| Phones Portrait | **35rem** | Phones Landscape | **55rem** | iPad Landscape    | **65rem**  | iPad Pro Landscape |
|                 | **560px** | iPad Portrait    | **880px** | iPad Pro Portrait | **1040px** | Notebook / Desktop |

I have chosen these after some consideration, but nothing is written in stone,
you can change them as you see fit for your project. Them menu might be not
fitting in only this much or something breaks.

Anyway here are the breakpoints in SCSS format, I tried to round them up a little bit:

```scss
//       $small                  $medium                 $large
// Portrait | Landscape   Portrait | Landscape   Portrait | Landscape
// Phone    | Phone       iPad     | iPad        iPad Pro | iPad Pro

$small: 35rem; // 560px
$medium: 55rem; // 880px
$large: 65rem; // 1040px
```

I believe this approach will bring more good than those obscure pixel-based breakpoints
found in CSS Frameworks everywhere. Start small, use an
[Immutable CSS](http://firedev.com/posts/2015/immutable-css/) library and have fun.
