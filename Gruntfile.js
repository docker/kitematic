var path = require('path');
var fs = require('fs');
var execFile = require('child_process').execFile;
var packagejson = require('./package.json');
var electron = require('electron-prebuilt');

var WINDOWS_DOCKER_URL = 'https://get.docker.com/builds/Windows/x86_64/docker-' + packagejson['docker-version'] + '.exe';
var DARWIN_DOCKER_URL = 'https://get.docker.com/builds/Darwin/x86_64/docker-' + packagejson['docker-version'];
var WINDOWS_DOCKER_MACHINE_URL = 'https://github.com/docker/machine/releases/download/v' + packagejson['docker-machine-version'] + '/docker-machine_windows-amd64.exe';
var DARWIN_DOCKER_MACHINE_URL = 'https://github.com/docker/machine/releases/download/v' + packagejson['docker-machine-version'] + '/docker-machine_darwin-amd64';
var DARWIN_COMPOSE_URL = 'https://github.com/docker/compose/releases/download/' + packagejson['docker-compose-version'] + '/docker-compose-Darwin-x86_64';
var BOOT2DOCKER_ISO_URL = 'https://github.com/boot2docker/boot2docker/releases/download/v' + packagejson['docker-version'] + '/boot2docker.iso';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  var target = grunt.option('target') || 'development';
  var beta = grunt.option('beta') || false;
  var alpha = grunt.option('alpha') || false;
  var env = process.env;
  env.NODE_PATH = '..:' + env.NODE_PATH;
  env.NODE_ENV = target;

  var certificateFile = grunt.option('certificateFile');
  var certificatePassword = grunt.option('certificatePassword');

  var version = function (str) {
    var match = str.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  };

  grunt.registerTask('download-boot2docker-iso', 'Downloads provided boot2docker version', function () {
    var version = grunt.config('version');
    try {
      var data = fs.readFileSync(path);
      var match = data.match(/Boot2Docker-v(\d+\.\d+\.\d+)/);
      if (match && match[1] !== version) {
        grunt.task.run('curl:boot2docker-iso');
      }
    } catch (err) {
      grunt.task.run('curl:boot2docker-iso');
    }
  });

  grunt.registerMultiTask('download-binary', 'Downloads binary unless version up to date', function () {
    var target = grunt.task.current.target;
    var done = this.async();
    var config = grunt.config('download-binary')[target];
    execFile(config.binary, ['--version'], function (err, stdout) {
      var currentVersion = version(stdout);
      if (!currentVersion || currentVersion !== version(config.version)) {
        grunt.task.run('curl:' + target);
        grunt.task.run('chmod');
      }
      done();
    });
  });

  var BASENAME = 'Kitematic';
  var APPNAME = BASENAME;

  if (alpha) {
    APPNAME += ' (Alpha)';
  } else if (beta) {
    APPNAME += ' (Beta)';
  }

  var OSX_OUT = './dist/osx';
  var OSX_FILENAME = OSX_OUT + '/' + APPNAME + '.app';

  grunt.initConfig({
    IDENTITY: 'Developer ID Application: Docker Inc',
    APPNAME: APPNAME,
    OSX_OUT: OSX_OUT,
    OSX_FILENAME: OSX_FILENAME,
    OSX_FILENAME_ESCAPED: OSX_FILENAME.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)'),

    // electron
    electron: {
      windows: {
        options: {
          name: BASENAME,
          dir: 'build/',
          out: 'dist/',
          version: packagejson['electron-version'],
          platform: 'win32',
          arch: 'x64',
          asar: true,
          icon: 'util/kitematic.ico'
        }
      },
      osx: {
        options: {
          name: APPNAME,
          dir: 'build/',
          out: '<%= OSX_OUT %>',
          version: packagejson['electron-version'],
          platform: 'darwin',
          arch: 'x64',
          asar: true,
          'app-bundle-id': 'com.kitematic.kitematic'
        }
      }
    },

    rcedit: {
      exes: {
        files: [{
          expand: true,
          cwd: 'dist/' + BASENAME + '-win32',
          src: [BASENAME + '.exe']
        }],
        options: {
          icon: 'util/kitematic.ico',
          'file-version': packagejson.version,
          'product-version': packagejson.version,
          'version-string': {
            'CompanyName': 'Docker Inc',
            'ProductVersion': packagejson.version,
            'ProductName': APPNAME,
            'FileDescription': APPNAME,
            'InternalName': BASENAME + '.exe',
            'OriginalFilename': BASENAME + '.exe',
            'LegalCopyright': 'Copyright 2015 Docker Inc. All rights reserved.'
          }
        }
      }
    },

    'create-windows-installer': {
      appDirectory: 'dist/' + BASENAME + '-win32/',
      authors: 'Docker Inc.',
      loadingGif: 'util/loading.gif',
      setupIcon: 'util/kitematic.ico',
      description: APPNAME,
      title: APPNAME,
      exe: BASENAME + '.exe',
      version: packagejson.version,
      signWithParams: '/f ' + certificateFile + ' /p ' + certificatePassword + ' /tr http://timestamp.comodoca.com/rfc3161'
    },

    // docker binaries
    'download-binary': {
      docker: {
        version: packagejson['docker-version'],
        binary: path.join('resources', 'docker'),
        download: 'curl:docker'
      },
      'docker-machine': {
        version: packagejson['docker-machine-version'],
        binary: path.join('resources', 'docker-machine'),
        download: 'curl:docker-machine'
      }
    },

    // images
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: '.',
          src: ['package.json', 'settings.json', 'index.html'],
          dest: 'build/'
        }, {
          expand: true,
          cwd: 'images/',
          src: ['**/*'],
          dest: 'build/'
        }, {
          expand: true,
          cwd: 'fonts/',
          src: ['**/*'],
          dest: 'build/'
        }, {
          cwd: 'node_modules/',
          src: Object.keys(packagejson.dependencies).map(function (dep) { return dep + '/**/*';}),
          dest: 'build/node_modules/',
          expand: true
        }]
      },
      windows: {
        files: [{
          expand: true,
          cwd: 'resources',
          src: ['docker*', 'boot2docker.iso', 'ssh.exe', 'OPENSSH_LICENSE', 'msys-*'],
          dest: 'dist/' + BASENAME + '-win32/resources/resources/'
        }],
        options: {
          mode: true
        }
      },
      osx: {
        files: [{
          expand: true,
          cwd: 'resources',
          src: ['docker*', 'boot2docker.iso', 'macsudo', 'terminal'],
          dest: '<%= OSX_FILENAME %>/Contents/Resources/resources/'
        }, {
          src: 'util/kitematic.icns',
          dest: '<%= OSX_FILENAME %>/Contents/Resources/atom.icns'
        }],
        options: {
          mode: true
        }
      }
    },

    rename: {
      installer: {
        src: 'installer/Setup.exe',
        dest: 'installer/' + BASENAME + 'Setup-' + packagejson.version + '.exe'
      }
    },

    // download binaries
    curl: {
      docker: {
        src: process.platform === 'win32' ? WINDOWS_DOCKER_URL : DARWIN_DOCKER_URL,
        dest: process.platform === 'win32' ? path.join('resources', 'docker.exe') : path.join('resources', 'docker')
      },
      'docker-machine': {
        src: process.platform === 'win32' ? WINDOWS_DOCKER_MACHINE_URL : DARWIN_DOCKER_MACHINE_URL,
        dest: process.platform === 'win32' ? path.join('resources', 'docker-machine.exe') : path.join('resources', 'docker-machine')
      },
      'docker-compose': {
        src: DARWIN_COMPOSE_URL,
        dest: 'resources/docker-compose'
      },
      'boot2docker-iso': {
        src: BOOT2DOCKER_ISO_URL,
        dest: path.join('resources', 'boot2docker.iso')
      }
    },

    chmod: {
      binaries: {
        options: {
          mode: '755'
        },
        src: ['resources/docker*']
      }
    },

    // styles
    less: {
      options: {
        sourceMapFileInline: true
      },
      dist: {
        files: {
          'build/main.css': 'styles/main.less'
        }
      }
    },

    // javascript
    babel: {
      options: {
        sourceMap: 'inline',
        blacklist: 'regenerator'
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['**/*.js'],
          dest: 'build/',
        }]
      }
    },

    shell: {
      electron: {
        command: electron + ' ' + 'build',
        options: {
          async: true,
          execOptions: {
            env: env
          }
        }
      },
      sign: {
        options: {
          failOnError: false,
        },
        command: [
          'codesign --deep -v -f -s "<%= IDENTITY %>" <%= OSX_FILENAME_ESCAPED %>/Contents/Frameworks/*',
          'codesign -v -f -s "<%= IDENTITY %>" <%= OSX_FILENAME_ESCAPED %>',
          'codesign -vvv --display <%= OSX_FILENAME_ESCAPED %>',
          'codesign -v --verify <%= OSX_FILENAME_ESCAPED %>',
        ].join(' && '),
      },
      zip: {
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= OSX_FILENAME_ESCAPED %> <%= OSX_OUT %>/' + BASENAME + '-' + packagejson.version + '.zip',
      }
    },

    clean: {
      release: ['build/', 'dist/', 'installer/'],
      isos: ['resources/boot2docker*']
    },

    // livereload
    watchChokidar: {
      options: {
        spawn: true
      },
      livereload: {
        options: {livereload: true},
        files: ['build/**/*']
      },
      js: {
        files: ['src/**/*.js'],
        tasks: ['newer:babel']
      },
      less: {
        files: ['styles/**/*.less'],
        tasks: ['less']
      },
      copy: {
        files: ['images/*', 'index.html', 'fonts/*'],
        tasks: ['newer:copy:dev']
      }
    }
  });
  grunt.registerTask('default', ['download-binary', 'download-boot2docker-iso', 'newer:babel', 'less', 'newer:copy:dev', 'shell:electron', 'watchChokidar']);

  if (process.platform === 'win32') {
    grunt.registerTask('release', ['clean', 'download-binary', 'download-boot2docker-iso', 'babel', 'less', 'copy:dev', 'electron:windows', 'copy:windows', 'rcedit:exes', 'create-windows-installer', 'rename:installer']);
  } else {
    grunt.registerTask('release', ['clean', 'download-binary', 'download-boot2docker-iso', 'babel', 'less', 'copy:dev', 'electron:osx', 'copy:osx', 'shell:sign', 'shell:zip']);
  }

  process.on('SIGINT', function () {
    grunt.task.run(['shell:electron:kill']);
    process.exit(1);
  });
};
