#!/bin/bash
default="develop"
message=""
subdirectory="app/kind"
read -p "Enter Local branch [$default]: " local
read -p "Enter commit message :" commit
local=${local:-$default}
commit=${commit:-$message}
echo "Local branch is $local"

cd media/
git status
git add .
git commit -m $commit
git push origin master
cd ../
git status
git add .
git commit -m $commit
git push origin $local
$SHELL
