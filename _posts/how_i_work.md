
group :development, :staging do
  gem 'bullet'
  gem 'meta_request'
  gem 'rails-footnotes'
  gem 'rack-mini-profiler'
  gem 'stackprof'
end

group :development do
  gem 'erd', require: false
  gem 'turbulence'
  gem 'traceroute'
  gem 'quiet_assets'
  gem 'immigrant'
  gem 'marginalia'
end

## Bullet
```ruby
unless Rails.env.production?
  if defined?(Bullet)
    Bullet.enable = true
    Bullet.add_footer = true
  end
end
```

#Marginalia
```ruby
Marginalia::Comment.components = [:line]
```
