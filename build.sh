#!/bin/zsh
set -e

BRIDGETOWN_ENV=production mise exec -- bundle exec rake deploy
touch output/.nojekyll
