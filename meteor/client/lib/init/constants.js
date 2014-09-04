var path = require('path');

getHomePath = function () {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

getBinDir = function () {
  if (process.env.NODE_ENV === 'development') {
    return path.join(path.join(process.env.PWD, '..'), 'resources');
  } else {
    if (Meteor.isClient) {
      return path.join(process.cwd(), 'resources');
    } else {
      return path.join(process.cwd(), '../../../resources');
    }
  }
};

KITE_PATH = path.join(getHomePath(), 'Kitematic');
KITE_TAR_PATH = path.join(KITE_PATH, '.tar');
KITE_IMAGES_PATH = path.join(KITE_PATH, '.images');

DOCKER_HOST = '192.168.60.103';

COMMON_WEB_PORTS = [
  80,
  8000,
  8080,
  3000,
  5000,
  2368,
  1337
];
