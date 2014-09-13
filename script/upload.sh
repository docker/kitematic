#!/bin/bash
set -e # Auto exit on error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
NODE="$BASE/cache/node/bin/node"
VERSION=$($NODE -pe 'JSON.parse(process.argv[1]).version' "$(cat package.json)")

if [ ! command -v s3cmd >/dev/null 2>&1 ]; then
  cecho "-----> Installing s3cmd (homebrew required)..." $blue
  brew install s3cmd
fi

if [ ! -f $BASE/dist/osx/Kitematic-$VERSION.zip ]; then
  cecho "-----> dist/osx/Kitematic-$VERSION.zip not found. Try running dist.sh first..." $red
  exit 1;
fi

s3cmd put dist/osx/Kitematic-$VERSION.zip s3://kite-installer/Kitematic-$VERSION.zip
