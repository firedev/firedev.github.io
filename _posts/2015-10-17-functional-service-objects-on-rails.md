---
layout: post
title:  "Functional Service Objects on Rails"
category: posts
tags:
  - ruby
  - rails
  - refactoring
image: 'posts/electrical_plumbing_service.jpg'
background_size: cover
---

After watching an excellent talk "Blending Functional and OO Programming in
Ruby" given by Piotr Solnica on Full Stack Fest 2015. I have tried different ways
of organizing my service objects and here is what I came up with.

## Background

The idea is to switch from Object Oriented mentality and stateful objects to more
functional way of doing things when only data is passed through your system.

I am working on this motivational portal. Let's use a concept from the
project for the sake of example. The models involved in this example are
`User`, `Motivation`, `Shop` and `Role`.

`Motivation` is some data that defines `Shop` to which `User` has access to in a
given month and his `Role` in regards to that. Each month a `User` can
be assigned to different `Shops` and different `Roles`. Say, an employee this
month and shop manager the next month. I call such managers "chief" since
manager was already taken.

## Stuff everything into model

For current month we need to get the list of shops user can manage. And to do that
we have to use multiple tables. The most obvious solution is to stuff everything
into User model:

```ruby
class User < ActiveRecord::Base
  def chief_shops_for_month(month)
    shops.merge(
      motivations.for_month(month).where(role_id: Role.chief)
    ).uniq
  end
end
```

Invocation is simple:

```ruby
shops = user.chief_shops_for_month(month)
```

Hmm that starts quite harmless. But let's measure the complexity with flog:

```
    10.0: flog total
    10.0: flog/method average

    10.0: User#chief_shops_for_month       -:2
```

### Flog

I use [flog](http://ruby.sadi.st/Flog.html) to check complexity of my classes
and strive to keep the average under 5:

```
$ flog app
  1278.9: flog total
     5.0: flog/method average

    29.7: User#none
    23.7: TrHelper#tr                      app/helpers/tr_helper.rb:2
    21.0: Role#none
    ...
```

## Service class

This is subjecting by I think 10 is too much. We can break it down in two parts like this:

```ruby
class User
  def chief_shops_for_month(month)
    shops.merge(chief_motivation_for_month(month).uniq
  end

  private

  def chief_motivation_for_month(month)
    motivations.for_month(month).where(role_id: Role.chief)
  end
end
```

But this is ridiculous. It adds a private method on `User` that is calling god know what.
I don't like the 'Thin Controllers, Fat Models' concept. As a one-man operation I build and
support, and I don't have man-power to deal with 10 feet long models. My motto
is:

> Thin Everythin'!

I build service objects in a simple way. One public method `call` with occasional
parameters passed from controller (i.e. variables). Let's extract the query to a
what my typical service object would look like:

```
class User
  class ChiefShopsForMonth
    attr_reader :user
    attr_reader :month

    def initialize(user)
      @user = user
    end

    def call(month)
      @month = month
      user.shops.merge(motivations_this_month_user_was_chief).uniq
    end

    private

    def motivations_this_month_user_was_chief
      user.motivations.for_month(month).where(role_id: Role.chief)
    end
  end
end
```

Let's keep the `User` API unchanged so this is a true refactoring:

```ruby
class User
  def chief_shops_for_month(month)
    User::ChiefShopsForMonth.new(self).call
  end
end
```
Let's see what flog has to say about that:

```
   18.5: flog total
     4.6: flog/method average

     7.8: User::ChiefShopsForMonth#motivations_this_month_user_was_chief -:17
     6.7: User::ChiefShopsForMonth#call    -:10
```

Okay this is a little bit better. But now let's try the functional-ish way.

### The talk

This is the talk [Piotr Solica](http://solnic.eu) gave at Full-stack fest in 2015
that got me thinking about a better way of doing things.

<iframe width="560" height="315" src="https://www.youtube.com/embed/rMxurF4oqsc" frameborder="0" allowfullscreen></iframe><br/>

If you don't have time to watch it, the gist of it - don't store state. Just
pass everything to `call` method instead. That sounded interesting. Rolled up my
sleeves and here we go.

## Refactoring Service object

Let's try with full head-on solution first. I would like to throw everything in the mix:

* Dependency injection
* Command-query separation
* Keyword arguments (Smalltalk-style)
* Intention-revealing method names

### CQS/CQRS Command-Query Responsibility Segregation

This is a simple principle that can be boiled down to this:

> Don't modify and request data in the same method call

Or it can be put in another way, return `self` until the very last moment. That allows
chaining and storing the intermediate results and other interesting things. The
best examples in the wild I think are Rails scopes and JavaScript. Rails Scopes
can be chained up to the last moment where you can load the relation into array
by calling `to_a` on it. JavaScript is basically built on returning `this`.
If you have ever used a JavaScript library like jQuery you know the power.

```ruby
class User
  class ChiefShopsForMonth

    def initialize(role = Role, motivation = Motivation)
      @role = role
      @motivation = motivation
    end

    def call(user:, month:)
      @user = user
      @role = role
      self
    end

    def shops
      all_user_shops.merge(chief_this_month).uniq
    end

    private

    attr_reader :user
    attr_reader :month
    attr_reader :role
    attr_reader :motivation

    def all_user_shops
      user.shops
    end

    def chief_this_month
      motivation.for_month(month).where(role_id: role.chief)
    end
  end
end
```

While getting here it became obvious to me that I didn't have to use
`user.motivation` as `merge` is taking care of this. And I think by relying on
`Motivation` class directly I can make it more intention-revealing, even if it
adds another dependency.

New structure gains certain tidiness in the upper part. Now `initialize` only does
dependency-injection for the whole object, `call` sets up the parameters and returns
`self` for chaining. You don't have to return `self`, but it gives such nice
flexibility so I don't see a point of not doing it. And finally you can get the
list of shops for the given month by calling `.shops`.

```ruby
class User
  def chief_shops_for_month(month)
    User::ChiefShopsForMonth.new.call(user, month).shops
  end
end
```

Things get hairy however after the `private` mark. The state is now here in the
and there are four attributes instead of two. Flog is not very happy about this either.
Average complexity per method is somewhat lower, but the total is even higher.

```
   26.0: flog total
     4.3: flog/method average

     7.6: User::ChiefShopsForMonth#chief_this_month -:30
     5.0: User::ChiefShopsForMonth#shops   -:15
     5.0: User::ChiefShopsForMonth#none
```

## Let's make it stateless

One thing I would like to discuss first. As Sandi Metz says:

> You can break the rules if you have a good reason or your pair lets you.

Something along these lines at least.

So I claim that I don't need to inject dependenices for other Activerecord classes
since they are not going to change. Thus I can get rid of `initialize`. Of course
in more complex screnario this is not the best way to go, but this is a simple
query object so for the sake of refactoring experiment I think this will pass.

I think the rule of thumb here is similar to what Piotr is suggesting:

> Initialize with Service Objects you are depending on

Since I am not changing anything here apart from the inner
state of the object and I am getting rid of the state, I don't need a separate
method, thus my object shrink back it's API to the `call` method. Which is actually
an improvement. Since now I can pass everything I need in one method call.

```
class User
  class ChiefShopsForMonth

    def call(user:, month:)
      all_user_shops(user).merge(chief_this_month(month)).uniq
    end

    private

    def all_user_shops(user)
      user.shops
    end

    def chief_this_month(month)
      Motivation.for_month(month).where(role_id: Role.chief)
    end
  end
end
```

As you can see state is not stored anywhere, okay the dependencies are not injected
which is a questionable practice, but again I claim in this case this could pass.

The invocation is almost the same as with the previous example, the only difference
is that we don't have to query for shops as this is a Query Object so it only returns
result straight away. And API is effectively shrunk to a single class.

```ruby
class User
  def chief_shops_for_month(month)
    User::ChiefShopsForMonth.new.call(user: self, month: month)
  end
end
```

Yes you have to call `new`, but only to instantiate an object. Or you can still
inject dependencies for testing. As a side effect we can pass a hash as
parameter. Piotr suggests to use value object, but right now I think it is
overkill. And look at this:

```
    10.4: flog total
     2.6: flog/method average

     5.0: User::ChiefShopsForMonth#call    -:4
     3.4: User::ChiefShopsForMonth#chief_this_month -:14
```

The whole class is almost as simple as the original single method in `User`. It
encapsulates everything it needs and has intention-revealing name and simplest API.

## Conclusion

These are just some ideas on how to approach refactoring of fat models and fat
controllers. Please let me know if you think I could improve anything.
