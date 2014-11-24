#!/bin/bash
set -e # Auto exit on error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
NPM="$BASE/cache/node/bin/npm"
NODE="$BASE/cache/node/bin/node"
VERSION=$($NODE -pe 'JSON.parse(process.argv[1]).version' "$(cat package.json)")

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

rm -rf ./dist/osx
mkdir -p ./dist/osx/

DIST_APP=Kitematic.app

cecho "-----> Creating $DIST_APP..." $blue
find cache/atom-shell -name "debug\.log" -print0 | xargs -0 rm -rf
cp -R cache/atom-shell/Atom.app dist/osx/
mv dist/osx/Atom.app dist/osx/$DIST_APP
mkdir -p dist/osx/$DIST_APP/Contents/Resources/app

cecho "-----> Copying meteor bundle into $DIST_APP..." $blue
mv bundle dist/osx/$DIST_APP/Contents/Resources/app/

cecho "-----> Copying node-webkit app into $DIST_APP..." $blue
cp index.js dist/osx/$DIST_APP/Contents/Resources/app/
cp package.json dist/osx/$DIST_APP/Contents/Resources/app/
cp -R node_modules dist/osx/$DIST_APP/Contents/Resources/app/

cecho "-----> Copying binary files to $DIST_APP" $blue
mkdir -p dist/osx/$DIST_APP/Contents/Resources/app/resources
cp -v resources/* dist/osx/$DIST_APP/Contents/Resources/app/resources/ || :

cecho "-----> Copying icon to $DIST_APP" $blue
cp kitematic.icns dist/osx/$DIST_APP/Contents/Resources/atom.icns

chmod +x dist/osx/$DIST_APP/Contents/Resources/app/resources/terminal
chmod +x dist/osx/$DIST_APP/Contents/Resources/app/resources/node

chmod -R u+w dist/osx/$DIST_APP/Contents/Resources/app/bundle

cecho "-----> Updating Info.plist version to $VERSION" $blue
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION" $BASE/dist/osx/$DIST_APP/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Kitematic" $BASE/dist/osx/$DIST_APP/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleName Kitematic" $BASE/dist/osx/$DIST_APP/Contents/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.kitematic.kitematic" $BASE/dist/osx/$DIST_APP/Contents/Info.plist

if [ -f $DIR/sign.sh ]; then
  cecho "-----> Signing app file...." $blue
  $DIR/sign.sh $BASE/dist/osx/$DIST_APP
fi

pushd dist/osx
  cecho "-----> Creating disributable zip file...." $blue
  ditto -c -k --sequesterRsrc --keepParent $DIST_APP Kitematic-$VERSION.zip
popd

cecho "Done." $green
cecho "Kitematic app available at dist/osx/$DIST_APP" $green
cecho "Kitematic zip distribution available at dist/osx/Kitematic.zip" $green

popd
