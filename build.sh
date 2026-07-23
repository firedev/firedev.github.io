#!/bin/zsh
set -e

BRIDGETOWN_ENV=production mise exec -- bin/bridgetown deploy
touch output/.nojekyll
