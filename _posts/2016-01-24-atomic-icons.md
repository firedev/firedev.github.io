---
layout: post
title: "Atomic Icons"
category: posts
tags:
  - CSS
  - react
  - components
  - frontend
image: 'posts/atomic-icons.png'
background_size: 'contain'
---
Once in a while comes a moment when you decide to change an icon set you have
been using. Just a bit of upfront planning goes a long way. Consider a system
that turns icons into independent components.

Before we start I need to explain that actual icon implementation doesn't matter.
It is not important if you are using PNG, SVG, Icon Fonts or whatever there is.

I personally like Font Awesome because it's easy to use. Not without drawbacks
though. While icon fonts just started to be rendered somewhat consistently
across browsers there is some backlash against them. Sometimes they might not
be rendered correctly still and might cause some issues for screen reading
software.

A ready to use vector set that looks okay in all resolutions and can be stacked
is indispensable. But there is another drawback with Font Awesome in
particular. It was built with 14px font size in mind. These days I tend to
not change browser defaults. And some sort of 16px base icon font would not
hurt to get crisp icons.

Having said that, it seems SVG is the way to go at the moment. But enough digression let's get to
business.

## Can we have icons without pain?

I myself tried different approaches before coming to this. And I have endured
migrations from images to icon fonts, then from one icon font to another, then
syntax changes in font awesome. HTML, CSS, SASS, SVG, inline SVG, Icon Fonts,
Custom fonts... You name it.

Each transition did lead me closer to this solution. As I am the only
maintainer of the things I make I distill everything to the simplest and most
effective form.

## Atomic Icons

Atomic composable components that do only one thing allow us to abstract from
the implementation and move forward without worrying about breaking things up.

We can switch implementation (read icon sets) on the fly without headache.

But there is a catch:

**You create one way of displaying icons and stick to it.**

You do not use `@extend` in SASS to inject icons in buttons, you don't add icon
classes to `span` or `a`. Every icon displayed must be passing through your own
implementation.

This claim might sound either trivial or ridiculous depending on your standpoint,
so let me reinforce it with some examples. I don't know if you remember Font Awesome
changing their class naming from `icon-*` to `fa fa-*`? Or had a chance to
find all the places where you have used some `fa-circle` that became `fa-circle-o`?
Or spend couple of days making sure there is no single reference of `png` or
`gif` in the project? You need an implementation you can control.

## History lesson
Before we get to the actual solution let's recap how the mess creeps into
the system in the first place. Imagine an app with icon buttons:

```html
<button><img src="icons/ok.gif"> Save</button>
```

Years pass and it gets obsolete quickly. You start having dynamic buttons so
as a simplest solution you're changing `src` attributes. Then one day you're
deciding that this is enough mess and move stying to CSS:

```css
button.ok {
  background-image: url(icons/ok.gif)
}
```

But then you need to have padding to compensate for the icon size...

```css
button {
  padding-left: 32px;
  background-position: 8px center;
}
```

Oh darn it, we don't have icons for all buttons. Let's have a prefix! And switch to SASS:

```css
@mixin icon($icon) {
  padding-left: 32px;
  background-position: 8px center;
  background-image: url(icons/#{$icon}.gif)
}

.icon-ok {
  @include icon(ok);
}
```
```html
<button class="icon-ok">Save</button>
```

Yey, almost there. Plus now we can reuse the same class for links and stuff.
But headers, icons looks comically tiny in headers? So you add bigger images
and classes for bigger icons and more padding and positioning.

Time flies and now you're forced to do something with this, so you decide to
change it to icon font.  With power of sass that sounds easy. Using Font
Squirrel or IcoMoon your compile your own icon font implementation.

```css
@mixin icon($icon) {
  &:before {
    font-family: 'CustomFont';
  }
}

.icon-ok {
  @include icon(ok);
  content: '\#ok;'
}
```

The team lead likes the effort and decides that we now need to have all icons done this way.

But then your team moves to Slim or React and now you have to insert spaces everywhere icons
starts sticking to text. The CSS grows with more and more intricacies.

You need to use icons separately too right? So let's create another rule for `button.icon-ok` and
`.icon-ok` standalone. And for other icons. And other tags, because links are inline.

So what can we do?

## Icon Component

To combat pains I have developed a system that works pretty well. Instead of
multiplying icon classes we are introducing the Icon component.

It does one thing - displays an icon. Font Awesome Rails gem has a `fa_icon` helper that does that.
But we wrap it in our own view helper, icon:

```
= icon 'remove'
```

In React that would be something like:

```
<Icon icon='remove' />
```

Output:

<i class="fa fa-remove"></i>

This is it. Pure, immutable, `1em` width and height icon. Again, implementation is irrelevant.
It can be anything as long as there is one way to call it.

## Usage in buttons

This simple thing frees our hands immediately. You don't style buttons anymore.

```erb
<button>
  <%= icon 'remove' %>
  Delete
</button>
```
<button><i class="fa fa-remove"></i> Remove</button>

Let's see how can we use is in React component instead of `className: "remove"`:

```
<button>
  <Icon icon='remove' />
  Delete
</button>
```

or

```
<Button icon="remove">
  Delete
</Button>
```

Oh wait, but why they are stuck together:

<button><i class="fa fa-remove"></i>Remove</button>

Exactly, in some libraries, namely React and Slim, the whitespace is trimmed.
So instead of beating around the bush with non-breaking spaces and stuff I found
a simple solution that works. You get a set of three helpers.

* `<Icon>` — icon *atom*. The minimal representation. It can be `<img>`, `<svg>`, `i.fa`
* `<IconBefore>` — icon with right spacing for use in from of the text without spaces.
* `<IconAfter>` — icon with left spacing to be used after text

Here are the corresponding [rails helpers](https://github.com/firedev/basscss-fix/blob/master/app/helpers/icon_helper.rb):

```ruby
module IconHelper
  include FontAwesome::Rails::IconHelper

  def icon(*args)
    fa_icon(*args)
  end

  def icon_before(whatever = nil, params = {})
    params[:class] = "#{params[:class]} pr1"
    icon(whatever, params)
  end

  def icon_after(whatever = nil, params = {})
    params[:class] = "#{params[:class]} pl1"
    icon(whatever, params)
  end
end
```

While in Slim you do it like this:

```slim
button
  = icon_before 'remove'
  | Remove from
  = icon_after 'cloud'
```

I don't see a point for additional verbosity in React component so it can be something like this:

```html
<Button icon="remove" iconAfter="cloud">
  Remove from
</Button>
```

The output should be identical. Note even whitespace:

<button><i class="fa fa-remove pr1"></i>Remove from<i class="fa fa-cloud pl1"></i></button>

What's with `pr1` `pl1` classes? They are providing `padding-left` and `padding-right`. Why not `margin`?
Because that produces an unclickable space if you are using an icon inside a link:

<a href="http://github.com/firedev"><i class="fa fa-github pr1"></i>Github</a>

## Or app is too old for this

If you are in a transitional phase, and have some HTML or Backbone where you
can't use helpers or components, replace current icons implementation with
`<i>` tags that use your own naming scheme in css.

This change alone will untie your hands and you can create icons inventor to
see which ones you're actually using.

Replace whatever you're using at the moment:

```html
<button class="image-ok">Save</button>
<button><img src="icons/ok.gif">Save</button>
<p><span class="icon-warning"><img src="icons/exclamation-mark.gif"/></span> File not found</p>
```

With something like this:

```html
<button><i class="icon-ok icon-before"></i>Save</button>
```

## What's the point?

This approach helps you to get rid of the obscure CSS. Buttons stay buttons and
decoupled from the presentation. No margins or anything. Icons are reusable
and aren't tied to a particular implementation. So you can experiment with the
overall look and feel. And the best part is -- now you can compose:

<a href="http://firedev.com/posts/2015/immutable-css/"><i class="fa fa-css3 pr1"></i>Immutable CSS</a><br>
<a href="http://fontawesome.io/"><i class="fa fa-link pr1"></i>Font Awesome</a>
