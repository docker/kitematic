#!/bin/bash
set -e # Auto exit on error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/colors.sh

BASE=$DIR/..
pushd $BASE

mkdir -p cache

pushd cache

BOOT2DOCKER_CLI_VERSION=1.3.0
BOOT2DOCKER_CLI_VERSION_FILE=boot2docker-$BOOT2DOCKER_CLI_VERSION
BOOT2DOCKER_CLI_FILE=boot2docker

ATOM_SHELL_VERSION=0.16.2
ATOM_SHELL_FILE=atom-shell-v$ATOM_SHELL_VERSION-darwin-x64.zip

if [ ! -f $ATOM_SHELL_FILE ]; then
  cecho "-----> Downloading Atom Shell..." $purple
  curl -L -o $ATOM_SHELL_FILE https://github.com/atom/atom-shell/releases/download/v$ATOM_SHELL_VERSION/$ATOM_SHELL_FILE
  mkdir -p atom-shell
  unzip -d atom-shell $ATOM_SHELL_FILE
fi

if [ ! -f kite-node-webkit.tar.gz ]; then
  cecho "-----> Downloading node-webkit..." $purple
  curl -L -o kite-node-webkit.tar.gz https://s3.amazonaws.com/kite-installer/kite-node-webkit.tar.gz
  tar -zxf kite-node-webkit.tar.gz -C .
fi

if [ ! -f mongodb-osx-x86_64-2.6.3.tgz ]; then
  cecho "-----> Downloading mongodb..." $purple
  curl -L -o mongodb-osx-x86_64-2.6.3.tgz http://downloads.mongodb.org/osx/mongodb-osx-x86_64-2.6.3.tgz
  tar -zxvf mongodb-osx-x86_64-2.6.3.tgz
  cp mongodb-osx-x86_64-2.6.3/bin/mongod $BASE/resources
  cp mongodb-osx-x86_64-2.6.3/GNU-AGPL-3.0 $BASE/resources/MONGOD_LICENSE.txt
fi

if [ ! -f "node-v0.10.29-darwin-x64.tar.gz" ]; then
  cecho "-----> Downloading Nodejs distribution..." $purple
  curl -L -o node-v0.10.29-darwin-x64.tar.gz http://nodejs.org/dist/v0.10.29/node-v0.10.29-darwin-x64.tar.gz
  mkdir -p node
  tar -xzf node-v0.10.29-darwin-x64.tar.gz --strip-components 1 -C node
  cp node/bin/node $BASE/resources/node
  cp node/LICENSE $BASE/resources/NODE_LICENSE.txt
fi

popd

pushd resources

if [ ! -f $BOOT2DOCKER_CLI_VERSION_FILE ]; then
  cecho "-----> Downloading Boot2docker CLI..." $purple
  curl -L -o $BOOT2DOCKER_CLI_VERSION_FILE https://github.com/boot2docker/boot2docker-cli/releases/download/v${BOOT2DOCKER_CLI_VERSION}/boot2docker-v${BOOT2DOCKER_CLI_VERSION}-darwin-amd64
fi

chmod +x $BOOT2DOCKER_CLI_VERSION_FILE

popd

NPM="$BASE/cache/node/bin/npm"

export npm_config_disturl=https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist
export npm_config_target=0.16.2
export npm_config_arch=ia32
HOME=~/.atom-shell-gyp $NPM install

popd
