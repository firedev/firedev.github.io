---
layout: post
title:  "Hello, Jekyll!"
date:   2015-06-06 14:50:02
category: posts
tags:
  - jekyll
  - liquid
---
After unsuccessful attempts at blogging relying on 3rd party platforms like
Posterous, Tumblr, Droplr and whatnot here is my new stab at delivering ideas
to the world. Fully autonomous this time. Surprisingly there are not that many
options available for blogging...

Why not Wordpress? I never really liked it, between these options and plugins
there seem to be little left to the actual content creation.
So this weekend I have decided to finally get back to blogging.

I don't have much time having two kinds and being a freelancer. I don't want to
mess with bloated Wordpress themes, plugins and exploits. Making my own blog on
Ruby on Rails sounds tempting but I better concentrate on other things in life.

Also forcing markdown on users in projects lately I wanted to write in markdown.
And the options that came to mind were Jekyll which I wanted to try for a long
time and Middleman. However Jekyll had less options and less of everything so it
sounded like a nice fit for a weekend project. And here it is.

## Partials in Jekyll
One of the tricky part was rendering of posts. In rails I would throw in a partial.
Since there are no partials in Jekyll I had to use includes.

This is what I have in my `posts` and `index` pages:

{% highlight liquid %}
{% raw %}
{% for post in site.posts %}
  {% include _post.html post=post %}
{% endfor %}
{% endraw %}
{% endhighlight %}

And the actual `_post.html` include uses `include.post` variable:
{% highlight liquid %}
{% raw %}
<h2>
    <a href="{{ include.post.url }}">{{ include.post.title }}</a>
</h2>
<p>{{ include.post.excerpt }}<p>
{% endraw %}
{% endhighlight %}

This is something I would do in Rails. Everything seems pretty sweet so far.
The only issue is that I have to write HTML again which seems as a step back
after years of using Slim.

Hosting the new static site at
[firedev.github.io](http://firedev.github.io), courtesy of Github.
Finally I can sleep at nights knowing that
[whatever](http://www.theverge.com/2013/4/30/4281780/posterous-is-shutting-down-tomorrow-here-are-the-best-alternatives)
[crazy](http://www.engadget.com/2014/01/03/droplr-rapid-file-sharing-service-goes-pay-only)
[idea](http://www.businessinsider.com/medium-budget-cuts-and-restructuring-2015-6)
the companies
I've trusted my content to are going to get it won't affect me.
