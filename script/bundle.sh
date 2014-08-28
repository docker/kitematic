#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
pushd $BASE/meteor

$BASE/script/setup.sh

NPM="$BASE/cache/node/bin/npm"

if ! type "mrt" > /dev/null 2>&1; then
  cecho "meteorite not found, install using npm install meteorite -g" $red
  exit 1
fi

rm -rf ../bundle

$NPM install demeteorizer -g

cecho "-----> Building bundle from Meteor app, this may take a few minutes..." $blue
$BASE/cache/node/bin/demeteorizer -o ../bundle

cd ../bundle

cecho "-----> Installing bundle npm packages." $blue
$NPM install

cecho "-----> Removing unnecessary node_modules" $blue
rm -rf ./programs/ctl/node_modules

cecho "Bundle created." $green

popd
