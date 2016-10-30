---
layout: post
title: "Immutable CSS"
category: posts
tags:
  - CSS
  - react
  - components
  - immutable
  - frontend
image: 'posts/monolith.jpg'
---
This is extracted from the Github issue created to discuss the approach with my
team. Please bear with me if I refer to something that wasn't mentioned in the text.

## What is Immutable CSS?

It's a set of tiny classes that don't change. You have a set of predefined
small classes that you reuse everywhere. They are mostly one-liners with clear
semantics. And you don't write new CSS until it's absolutely needed.

Lets pretend that we need to build a menu that changes background for each client.
Consider the following example. The semantics is easy to remember: `m` —
margin, `p` — padding.

```
<div class="menu mb1 p1">
  <img src="logo.svg"/>
</div>
```

```
.mb1 { margin-bottom: x } - adds bottom spacing
.p1 { padding: x } - adds padding
```

`1` in class name means 'single spacing'. And you don't use pixels or any
magic numbers. The spacing is based on the font size.

There are more utility classes like these and HTML tags are pre-styled so you
can just use them as is.

## Sales pitch

The claim is that 90% of CSS you don't have to write at all. And instead of
having tons of files and selectors one can add a bit more verbose-ish class
names that are explicitly readable when you open the code.

After that styling the transparent menu is trivial:

```css
.menu { background-color: #xxx }
```

## But CSS Modules...?

Everybody seem to have high hopes for CSS modules. Let's clear this up. I am
not opposed to idea and they are great. However I would argue that CSS modules
is a file organization concept mostly. As everything is compiled into a big
pile of CSS in the browser.

You're not defining colors and fonts in each module, so they are not *that*
independent. You have some *base CSS* anyway.

So in the case above the Menu CSS Module would contain a single line -
`background-color`. Everything else is build using immutable css classes from
the BASE.

## Show me!

Sure. Let's take a random CSS Module from one of the pulls:

```css
.type {
  width: 70%;
  composes: m-input-container from './../../../../form/input-container.css'
}

.type__select {
  composes: m-input from './../../../../form/input.css'
}
```

Looks like it should power this kind of HTML:

```slim
.type
   select.type__select
```

So you see this in your code, and to get the idea of what is going on you open
the module, then you follow the `../../..` chain to find out that `input-container`
is something like `margin-bottom: 10px` and before you know it — your whole codebase
looks like this.

In addition to the scss mess already in place. It's just a different form of
SASS `extend`. With inheritance, specificity and the like. Just a different
file format.

Compare to the following piece of CSS:

```css

```
Wait, what? No CSS? Yes. You see the basic HTML tags like `<select>` don't need to
carry any classes. You just pre-style them once. How many variation of
`<select>` or `<input>` you need anyway?

For `.type` that seems to be a some form of container I just put `.container`
in HTML. `width: 70%` is a magic number. It seems to me that it can be replaced
with `.col-8` given 12-column grid.

So in HTML it will be something like:

```slim
.container
  .col-8
    select
```
And no CSS.

## So it that another CSS framework?

Nope, just a library. As they say - you call the library, framework calls you.
In fact it's a set of css modules: `whitespace`, `grid`, `forms`, etc. A dozen
one-liners each that can be reused everywhere.

I made a full circle before adopting this technique exclusively. After working
with CSS, SCSS and now SASS while using Bootstrap, Foundation, various grid
systems, Neat, Bourbon and what else there is.

## But how can we use it, we already using Whatever?

The approach I preach to have a library of atomic, immutable small classes that
can be combined for layout purposes. And top it off with smart reset for HTML
elements. So all inputs, buttons and whatnot looks fine as is.

You only describe some specific behaviour in CSS you write. The basic styling
and positioning is done with the base classes.

## Do we have to change something?

Start with adding small one-liners. Here are for example three one-line clases
for the menu. When you decide you need more you can continue.

Here is what the HTML could look like (Slim/Jade)

```slim
.menu                     | Sets Colors, nothing else. The only class that needs to be defined in CSS
  .container              | Sets max-width for the inner container
    .sm-show.left.mr2     | Show on small screens and upwards, float left, double spacing to the right
      img src="logo.png"

   .dropdown              | Dropdown wrapper, on hover show .dropdown-hidden
      .btn Purchasing     | Button-like look (transparent). Add hover effect that is font-color dependent
      .dropdown-hidden    | Container for Submenu
        a.btn             | Submenu itself
        a.btn
```

So the only CSS one has to write to hydrate the menu with some dynamic style (module or not):

```css
.menu {
  background-color: #xxx
  color: #xxx
}
```

If you don't need anything dynamic, just replace `.menu` with `.bg-blue.white`.
And that removes CSS completely.

`.btn` class applies transparent button look by default. It inherits font and
hover color from text so it works with any kind of stuff.

`<button>` HTML tag or `.button` class on the other hand is pre-styled as a
fully-blown button with colored background (it is actually inherited from
`.btn.btn-primary`).

## What if we don't like it?

This is the best part, each module is like 10-20 lines long. Look at the
filesizes in the following section.  You can easily replace or recreate parts
you don't like. It's all built from CSS modules by the way.

## Questions?

Since I have adopted this approach I almost stopped writing css and it's really
easy to work with the projects now when I don't have to edit multiple files.
Another side effect is when you open the view you can *read* what it is going
to *look* like. Kind of like in the Matrix movie.

For example the whole CSS for my [wife's website](http://molokophuket.com) is
less then **10Kb** in size. And people think this is Bootstrap.

I'd love to show more examples, production code or answer questions. Here are
some links to digest meanwhile:

* [Gravitons](http://jxnblk.com/gravitons) — A base set of simple utilities to start with
* [BASSCSS](http://basscss.com) — The actual library I am suggestion to use
* [BASSCSS-FIX](http://github.com/firedev/basscss-fix) — Some things I wasn't content with
* [ReBASS](http://jxnblk.com/rebass) — BASSCSS-based React componets (`Row`, `Column`, `Button` etc)
* [Tachyons](http://tachyons.io) — Another tiny library with similar ideas
* [Solid](http://solid.buzzfeed.com) — Buzzfeed implementation
* [Styling React Components in JavaScript](https://www.youtube.com/watch?v=0aBv8dsZs84) — Embedding is disabled but the fun part starts in the second half of the video.

## Boilerplate

This approach really shines with templating engines that use terse indented syntax. So if
you are still on the fence but willing to try it and like Slim I made
boilerplate to demo some of the ideas.

* [Slim/SASS/BASS Boilerplate](http://github.com/firedev/boilerplate)

Usage is simple. You just have to have `npm`, `bower`, and `grunt` installed:

```
npm install
bower install
grunt
```

Here's what you can achieve in 10 minutes time:

* [Page Mockup](http://firedev.com/boilerplate/) — Try resizing the window
* [Source](https://github.com/firedev/boilerplate/blob/example/slim/index.slim) — Typed it up live
