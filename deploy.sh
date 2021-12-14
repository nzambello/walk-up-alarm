#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
mv dist docs
cd docs

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git branch -m main
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
# git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git main

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:nzambello/walk-up-alarm.git main:gh-pages

cd -
