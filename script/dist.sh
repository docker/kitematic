#!/bin/bash
set -e # Auto exit on error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
NPM="$BASE/cache/node/bin/npm"

pushd $BASE/meteor

$BASE/script/setup.sh
rm -rf ../bundle

cecho "-----> Building bundle from Meteor app, this may take a few minutes..." $blue
meteor bundle --directory ../bundle

cd ../bundle

cecho "-----> Installing bundle npm packages." $blue
pushd programs/server
$NPM install
popd

cecho "Bundle created." $green

popd

pushd $BASE

rm -rf dist/osx/Kitematic.app
rm -rf dist/osx/Kitematic.zip
mkdir -p dist/osx/

cecho "-----> Creating Kitematic.app..." $blue
find cache/atom-shell -name "debug\.log" -print0 | xargs -0 rm -rf
cp -R cache/atom-shell/Atom.app dist/osx/
mv dist/osx/Atom.app dist/osx/Kitematic.app
mkdir -p dist/osx/Kitematic.app/Contents/Resources/app

cecho "-----> Copying meteor bundle into Kitematic.app..." $blue
cp -R bundle dist/osx/Kitematic.app/Contents/Resources/app/

cecho "-----> Copying node-webkit app into Kitematic.app..." $blue
cp index.js dist/osx/Kitematic.app/Contents/Resources/app/
cp package.json dist/osx/Kitematic.app/Contents/Resources/app/
cp -R node_modules dist/osx/Kitematic.app/Contents/Resources/app/

cecho "-----> Copying binary files to Kitematic.app" $blue
mkdir -p dist/osx/Kitematic.app/Contents/Resources/app/resources
cp -v resources/* dist/osx/Kitematic.app/Contents/Resources/app/resources/ || :

chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/$BOOT2DOCKER_CLI_FILE
chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/$COCOASUDO_FILE
chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/install
chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/terminal
chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/unison
chmod +x dist/osx/Kitematic.app/Contents/Resources/app/resources/node

if [ -f $DIR/sign.sh ]; then
  cecho "-----> Signing app file...." $blue
  $DIR/sign.sh $BASE/dist/osx/Kitematic.app
fi

pushd dist/osx
  cecho "-----> Creating disributable zip file...." $blue
  ditto -c -k --sequesterRsrc --keepParent Kitematic.app Kitematic.zip
popd

VERSION=$(node -pe 'JSON.parse(process.argv[1]).version' "$(cat package.json)")
cecho "Updating Info.plist version to $VERSION"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 0.3.0" $BASE/dist/osx/Kitematic.app/Contents/Info.plist

cecho "Done." $green
cecho "Kitematic app available at dist/osx/Kitematic.app" $green
cecho "Kitematic zip distribution available at dist/osx/Kitematic.zip" $green

popd
