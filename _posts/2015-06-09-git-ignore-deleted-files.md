---
layout: post
title:  "Git: Ignore deleted files"
category: posts
tags:
  - git
image: logos/git.png
background_size: contain
---
Sometimes working with other people you with you didn't have some of the files
in repository because they are getting in the way of your settings. `.ruby-version`
for instance.

You check out the repository and what the...
{% highlight sh %}
$ git clone ...
...
rbenv: version '2.1.5' is not installed
{% endhighlight %}

Okay you delete the pesky `.ruby-version` but now it is there for every commit:
{% highlight sh %}
$ rm .ruby-version
$ git status
On branch master
Your branch is up-to-date with 'origin/master'.
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        deleted:    .ruby-version
{% endhighlight %}

It's impossible to ignore it by adding to `.gitignore` but fortunately in git
there is an option for everything.

{% highlight sh %}
$ git update-index --assume-unchanged .ruby-version
$ git status
On branch master
Your branch is up-to-date with 'origin/master'.
nothing to commit, working directory clean
{% endhighlight %}

Done! Phew, at least this wasn't too much typing, was it? Another option is to truncate the file:

{% highlight sh %}
$ cat >> ~/.gitignore
.ruby-version
^C
rbenv: version '2.1.5' is not installed
$ cat > .ruby-version
^C
$ git status
On branch master
Your branch is up-to-date with 'origin/master'.
nothing to commit, working directory clean
{% endhighlight %}

And as always be careful with git, don't mess things up.
