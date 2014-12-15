#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ATOM_SHELL_VERSION=0.19.1
ATOM_SHELL_FILE=atom-shell-v$ATOM_SHELL_VERSION-darwin-x64.zip
BASE=$DIR/..

source $DIR/colors.sh
cd $BASE

mkdir -p cache
cd cache

if [ ! -f $ATOM_SHELL_FILE ]; then
  cecho "-----> Downloading Atom Shell..." $purple
  curl -L -o $ATOM_SHELL_FILE https://github.com/atom/atom-shell/releases/download/v$ATOM_SHELL_VERSION/$ATOM_SHELL_FILE
  mkdir -p atom-shell
  unzip -d atom-shell $ATOM_SHELL_FILE
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

cd $BASE

NODE="$BASE/cache/node/bin/node"
BOOT2DOCKER_CLI_VERSION=$($NODE -pe "JSON.parse(process.argv[1])['boot2docker-version']" "$(cat package.json)")
BOOT2DOCKER_CLI_VERSION_FILE=boot2docker-$BOOT2DOCKER_CLI_VERSION

cd resources

if [ ! -f $BOOT2DOCKER_CLI_VERSION_FILE ]; then
  cecho "-----> Downloading Boot2docker CLI..." $purple
  rm -rf boot2docker-*
  curl -L -o $BOOT2DOCKER_CLI_VERSION_FILE https://github.com/boot2docker/boot2docker-cli/releases/download/v${BOOT2DOCKER_CLI_VERSION}/boot2docker-v${BOOT2DOCKER_CLI_VERSION}-darwin-amd64
fi

chmod +x $BOOT2DOCKER_CLI_VERSION_FILE

cd $BASE

# Build NPM modules
NPM="$BASE/cache/node/bin/npm"
export npm_config_disturl=https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist
export npm_config_target=$ATOM_SHELL_VERSION
export npm_config_arch=ia64
HOME=~/.atom-shell-gyp $NPM install

