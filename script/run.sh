#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE=$DIR/..

export ROOT_URL=https://localhost:3000
export DOCKER_HOST=http://192.168.59.103
export DOCKER_PORT=2375

cd $BASE/meteor
exec 3< <(meteor --settings $BASE/meteor/settings_dev.json)
sed '/App running at/q' <&3 ; cat <&3 &
NODE_ENV=development $BASE/cache/atom-shell/Atom.app/Contents/MacOS/Atom $BASE
