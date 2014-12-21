ATOM_SHELL_VERSION=$(node -pe "JSON.parse(process.argv[1])['atom-shell-version']" "$(cat package.json)")

export npm_config_disturl=https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist
export npm_config_target=$ATOM_SHELL_VERSION
export npm_config_arch=ia64

HOME=~/.atom-shell-gyp npm install --production
