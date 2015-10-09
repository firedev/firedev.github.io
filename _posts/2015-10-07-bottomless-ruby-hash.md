---
layout: post
title:  "Bottomless Ruby Hash"
category: posts
tags:
  - ruby
image: 'posts/bottomless_pit.jpg'
background_size: cover
---
The other day somebody asked if there is a way to blindly assign nested values
to Ruby Hash without creating each key. Turns out there is, and it has an
interesting side-effect. Welcome Bottomless Hash.

Let's try assigning throughout a key in plain old Ruby first.

```ruby
params = {}
params[:world][:russia] = :moscow
=> NoMethodError: undefined method `[]=' for nil:NilClass
```

Okay, it doesn't work like this. Fortunately Hashes in Ruby can be initialized
with a default value. First thing to try seems quite obvious. Let's put an
empty hash as a default value.

```ruby
params = Hash.new({})
params[:world][:russia] = :moscow

params[:world]
=> {:russia=>:moscow}
```

Seems legit. But let's dig a little deeper.

```ruby
params[:world][:thailand]=:bangkok

params
=> {}
```

Why is it empty? Let's add more stuff to it.

```
params[:underworld]=:hell

params
=> {:underworld=>:hell}
```

What is going on? Some wicked magic? Not quite. First the `:world` key was initialized
with the same empty Hash that we put as a default value. It is easy to access still,
since the same Hash is returned when the key is empty. However now all our cities
are available in both worlds.

```ruby
params[:world][:thailand]
=> :bangkok

params[:underworlds][:russia]
=> :moscow
```

Okay, we got to fix it. To initialize new hash for values we need to pass a block.
Block accepts two variables - the `hash` itself and the `key` it was accessed with.
Lets just inject new empty hash as a value for the key.

```ruby
params = Hash.new do |hash, key|
  hash[key] = Hash.new
end

params[:world][:thailand]=:phuket

params
=> {:world=>{:thailand=>:phuket}}
```

Amazing. Okay but what if we need to add another level?

```
params[:asia][:thailand][:bangkok] = :chao_praya
=> NoMethodError: undefined method `[]=' for nil:NilClass
```

Oh no, not again. What can we do? Let's add another layer! So the nested Hash
could in turn create more hashes:

```ruby
params = Hash.new do |hash0, key0|
  hash0[key0] = Hash.new do |hash1, key1|
    hash1[key1] = Hash.new
  end
end

params[:asia][:thailand][:moscow] = :moscow_river
```
It works! But what if the hash goes deeper?

```
params[:asia][:thailand][:bangkok][:river] = :chao_praya
```

Okay, Let's throw some functional programming in the mix and fix
this once and for all. What we need is a kind of procedure that would return a new
hash with the same procedure hidden inside waiting for an empty key to come in.

What would the procedure look like? Quite familiar in fact. We just need to
pack it with `&` symbol-to-proc pretzel to shove into Hash initializer.

```ruby
procedure = lambda do |hash, key|
  hash[key] = Hash.new(procedure)
end

params = Hash.new(&procedure)
params[:russia][:moscow] = :moscow_river
params
=> {:russia=>{:moscow=>:moscow_river}}
```

Okay, that part is solved, now lets tie it a little tighter so we don't need to
create lambda beforehand. Ruby Hash sports `default_proc` method that can
be used to access the block hash was initialized with. Thank makes it super sweet,
thanks for pointing me on that, Pavel.

```
params = Hash.new { |h, k| h[k] = Hash.new(&h.default_proc) }

params[:world][:thailand][:bangkok][:bangna]
params
=> {:world=>{:thailand=>{:bangkok=>{:bangna=>{}}}}}
```

This is sweet, but what is the practical point of bottomless hash? Interesting
side-effect is that it never fails you when reading values.

```
params[:i][:dont][:know]
=> {}
```

And the beauty of this is that you can merge any hash with it to produce
a bottomless version. So you can blindly access the keys.

```ruby
unknown = { key: :value }
bottomless = params.merge other

bottomless[:missing][:value]
=> {}
```

No matter how long the chain is, bottomless hash won't raise an error. Okay, it returns
and empty hash instead of `nil`, which is truthy. But this can be checked with
`empty?` even in plain ruby.

As it was mentioned in comments we can encapsulated the behaviour into a Class that would
return an empty Bottomless hash or convert a given hash into a bottomless version:

I could not make it to work with `&.default_proc` so I am using somewhat less
terse syntax here.

```ruby
class BottomlessHash < Hash
  def initialize
    super &-> h, k { h[k] = self.class.new }
  end
end

BottomlessHash.new[:missing][:key]
=> {}

hash = { existing: { key: :ok } }
bottomless = BottomlessHash.new hash
bottomless[:existing][:key]
=> :ok
puts bottomless[:missing][:key]
=> {}
```

Hope this might get useful for data processing or when dealing with unknown
nested structures from the outside world.
