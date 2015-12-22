---
layout: post
title: "Immutable CSS"
category: posts
tags:
  - css
  - react
  - components
image: 'posts/monolith.jpg'
---
This is extracted from the Github issue I have created to convince my team mates.

## What is Immutable CSS?

It's a set of tiny classes that don't change. You have a set of predefined
small classes that you reuse everywhere. They are mostly one-liners with clear
semantics. And you don't write new CSS until it's absolutely needed.

## Example
It's easy to remember: `m` — margin, `p` — padding.

```
<div class="menu mb1 p1">
  <img src="logo.svg"/>
</div>
```

```
.mb1 { margin-bottom: xx  } - adds bottom spacing
.p1 { padding: xx } - adds padding
```

There are more utility classes like these and HTML tags are pre-styled so you
can just use them as is.

## Sales pitch

The claim is that 90% of css you don't have to write at all. And instead of
having tons of files and selectors one can add a bit more verbose-ish class
names that are explicitly readable when you open the code.

After that styling the transparent menu is trivial:

```css
.top-menu { background-color: #xxx }
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

Sure. Let's take a random CSS Module from webpack pull:

```css
.type {
  width: 70%;
  composes: m-input-container from './../../../../form/input-container.css'
}

.type__select {
  composes: m-input from './../../../../form/input.css'
}
```

Looks like it should work for this kind of HTML.
```slim
.type
   select.type__select
```
So you see this in your code, then you open the module then you follow the `../../..` chain to find out that `input-container` is something like 'margin-bottom: 10px` and before you know it — your codebase is full of that. In addition to the scss mess already in place. It's just a different form of SASS `extend`. With inheritance, specificity and the like. Just a different file format.

Compare to the following piece of CSS:

```css

```
Wait, what? No CSS? Yes. You see the basic HTML tags like `<select>` don't need to
carry any classes. You just pre-style them once. How many variation of `<select>` or `<input>` you need anyway?

For `.type` that seems to be a some form of container I just put `.container`
in HTML. `width: 70%` seems to me as `.col-8` given 12-column grid.

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

I made a full circle before adopting this technique exclusively. Spending years
writing CSS, SCSS and now SASS while using Bootstrap, Foundation, various grid
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
.menu                   | Sets Colors, nothing else. The only class that needs to be defined in CSS
  .container            | Sets max-width for the inner container
    .sm-show.left.mr2   | Show on small screens and upwards, float left, double spacing to the right
      img src=logo

   .dropdown            | Dropdown wrapper, on hover show .dropdown-hidden
      .btn Purchasing   | Button-like look (transparent). Add hover effect that is font-color dependent
      .dropdown-hidden  | Container for Submenu
        a.btn           | Submenu itself
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

`<button>` html tag or `.button` class on the other hand is fully-blown button
with colored background (it is actually `.btn.btn-primary`).

## What if we don't like or want to change something?

This is the best part, each module is like 10-20 lines long. Look at the filesizes in the following section.
You can easily replace or recreate parts you don't like. It's all built from CSS modules by the way.

## Questions?

Since I have adopted this approach I almost stopped writing css and it's really
easy to work with the projects now when I don't have to edit multiple files.
Another side effect is when you open the view you can *read* what it is going
to *look* like. Kind of like in the Matrix movie.

For example the whole CSS for my [wife's website](http://molokphuket.com) is

I'd love to show more examples, production code or answer questions. Here are some links to digest meanwhile:

* [Gravitons](http://jxnblk.com/gravitons) — A base set of simple utilities to start with
* [BASSCSS](http://basscss.com) — The actual library I am suggestion to use
* [BASSCSS-FIX](http://github.com/firedev/basscss-fix) — Some things I wasn't content with
* [ReBASS](http://jxnblk.com/rebass) — BASSCSS-based React componets (`Row`, `Column`, `Button` etc)
* [Tachyons](http://tachyons.io) — Another tiny library with similar ideas
* [Solid](http://solid.buzzfeed.com) — Buzzfeed implementation
* [Styling React Components in
* JavaScript](https://www.youtube.com/watch?v=0aBv8dsZs84) — Embedding disabled
by request. The fun part starts in the second half of the video.

This approach really shines with templating engines that use terse indented syntax so if
you want to try it and like Slim:

* [Boilerplate](http://github.com/firedev/boilerplate) — I made this Slim/SASS/BASS boilerplate to quickly show some of the ideas to my team. Usage is simple:

```
npm install
grunt
```
