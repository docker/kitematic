#!/bin/bash
set -e # Auto exit on error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh
source $DIR/versions.sh

BASE=$DIR/..
pushd $BASE

mkdir -p resources/cache

pushd resources/cache

if [ ! -f $BASE_IMAGE_VERSION_FILE ]; then
  cecho "-----> Downloading Kitematic base images..." $purple
  curl -L --progress-bar -o $BASE_IMAGE_VERSION_FILE https://s3.amazonaws.com/kite-installer/$BASE_IMAGE_VERSION_FILE
fi

if [ ! -f $BOOT2DOCKER_CLI_VERSION_FILE ]; then
  cecho "-----> Downloading Boot2docker CLI..." $purple
  curl -L -o $BOOT2DOCKER_CLI_VERSION_FILE https://github.com/boot2docker/boot2docker-cli/releases/download/v${BOOT2DOCKER_CLI_VERSION}/boot2docker-v${BOOT2DOCKER_CLI_VERSION}-darwin-amd64
fi

if [ ! -f kite-node-webkit.tar.gz ]; then
  cecho "-----> Downloading node-webkit..." $purple
  curl -L -o kite-node-webkit.tar.gz https://s3.amazonaws.com/kite-installer/kite-node-webkit.tar.gz
  tar -zxf kite-node-webkit.tar.gz -C ..
fi

if [ ! -f mongodb-osx-x86_64-2.6.3.tgz ]; then
  cecho "-----> Downloading mongodb..." $purple
  curl -L -o mongodb-osx-x86_64-2.6.3.tgz http://downloads.mongodb.org/osx/mongodb-osx-x86_64-2.6.3.tgz
  tar -zxvf mongodb-osx-x86_64-2.6.3.tgz
  cp mongodb-osx-x86_64-2.6.3/bin/mongod ..
  cp mongodb-osx-x86_64-2.6.3/GNU-AGPL-3.0 ../MONGOD_LICENSE.txt
fi

if [ ! -f "node-v0.11.13-darwin-x64.tar.gz" ]; then
  cecho "-----> Downloading Nodejs distribution..." $purple
  curl -L -o node-v0.11.13-darwin-x64.tar.gz http://nodejs.org/dist/v0.11.13/node-v0.11.13-darwin-x64.tar.gz
  mkdir -p node
  tar -xzf node-v0.11.13-darwin-x64.tar.gz --strip-components 1 -C node
fi

popd

pushd resources

if [ ! -f $VIRTUALBOX_FILE ]; then
  cecho "-----> Downloading virtualbox installer..." $purple
  curl -L --progress-bar -o $VIRTUALBOX_FILE https://s3.amazonaws.com/kite-installer/$VIRTUALBOX_FILE
fi

if [ ! -f $COCOASUDO_FILE ]; then
  cecho "-----> Downloading Cocoasudo binary..." $purple
  curl -L -o $COCOASUDO_FILE https://github.com/performantdesign/cocoasudo/blob/master/build/Release/cocoasudo
  chmod +x $COCOASUDO_FILE
fi


cecho "-----> Creating binary files from cache" $blue

if [ ! -f $BASE_IMAGE_FILE ]; then
  cp cache/$BASE_IMAGE_VERSION_FILE $BASE_IMAGE_FILE
fi

if [ ! -f $BOOT2DOCKER_CLI_FILE ]; then
  cp cache/$BOOT2DOCKER_CLI_VERSION_FILE $BOOT2DOCKER_CLI_FILE
  chmod +x $BOOT2DOCKER_CLI_FILE
fi

popd

popd
