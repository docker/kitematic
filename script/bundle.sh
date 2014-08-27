#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
pushd $BASE/meteor

if ! type "mrt" > /dev/null 2>&1; then
  cecho "meteorite not found, install using npm install meteorite -g" $red
  exit 1
fi

if ! type "demeteorizer" > /dev/null 2>&1; then
  cecho "Demeteorizer not found, install using npm install demeteorizer -g" $red
  exit 1
fi

rm -rf ../bundle

cecho "-----> Building bundle from Meteor app, this may take a few minutes..." $blue
demeteorizer -o ../bundle

cd ../bundle

awk '!/fibers/' package.json > temp && mv temp package.json
awk '!/node-aes-gcm/' package.json > temp && mv temp package.json
awk '!/kexec/' package.json > temp && mv temp package.json
awk '!/heapdump/' package.json > temp && mv temp package.json
awk '!/bcrypt/' package.json > temp && mv temp package.json

NPM="$BASE/resources/cache/node/bin/npm"
NODE="$BASE/resources/cache/node/bin/node"

cecho "-----> Installing bundle npm packages." $blue
$NPM install

cecho "-----> Installing custom npm packages." $blue
$NPM install fibers@git+https://github.com/usekite/node-fibers.git --save
$NPM install node-aes-gcm@git+https://github.com/usekite/node-aes-gcm.git --save
$NPM install kexec@git+https://github.com/usekite/node-kexec.git --save
$NPM install heapdump@git+https://github.com/usekite/node-heapdump.git --save
$NPM install bcrypt@0.8.0 --save

cecho "-----> Removing unnecessary node_modules" $blue
rm -rf ./programs/ctl/node_modules

cecho "-----> Fixing Fibers for node-webkit" $blue
$NPM install nw-gyp -g
FIBERS_ARCH=$($NODE -p -e 'process.platform + "-" + process.arch + "-v8-" + /[0-9]+\.[0-9]+/.exec(process.versions.v8)[0]')
cd ./node_modules/fibers
$BASE/resources/cache/node/bin/nw-gyp rebuild --target=0.10.2 --arch=x64
mkdir -p ./bin/$FIBERS_ARCH
cp ./build/Release/fibers.node ./bin/$FIBERS_ARCH/fibers.node

cecho "Bundle created." $green

popd
