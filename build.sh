jekyll build
cd _site
git add .
git commit -m "$(date)"
git push
cd ..
