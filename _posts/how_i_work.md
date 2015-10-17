
group :development, :staging do
  gem 'bullet'
  gem 'meta_request'
  gem 'rails-footnotes'
end

group :development do
  gem 'erd', require: false
  gem 'turbulence'
  gem 'traceroute'
  gem 'quiet_assets'
  gem 'immigrant'
end
