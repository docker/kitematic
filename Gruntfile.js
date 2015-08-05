var path = require('path');
var execFile = require('child_process').execFile;
var packagejson = require('./package.json');
var electron = require('electron-prebuilt');

var WINDOWS_DOCKER_MACHINE_URL = 'https://github.com/docker/machine/releases/download/v' + packagejson['docker-machine-version'] + '/docker-machine_windows-amd64.exe';
var DARWIN_DOCKER_MACHINE_URL = 'https://github.com/docker/machine/releases/download/v' + packagejson['docker-machine-version'] + '/docker-machine_darwin-amd64';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  var target = grunt.option('target') || 'development';
  var beta = grunt.option('beta') || false;
  var alpha = grunt.option('alpha') || false;
  var env = process.env;
  env.NODE_PATH = '..:' + env.NODE_PATH;
  env.NODE_ENV = target;

  var certificateFile = grunt.option('certificateFile');

  var version = function (str) {
    var match = str.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  };

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
          'app-bundle-id': 'com.kitematic.kitematic',
          'app-version': packagejson.version
        }
      }
    },

    prompt: {
      'create-windows-installer': {
        options: {
          questions: [
            {
              config: 'certificatePassword',
              type: 'password',
              message: 'Certificate Password: '
            }
          ]
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
            'CompanyName': 'Docker',
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
      setupIcon: 'util/setup.ico',
      iconUrl: 'https://raw.githubusercontent.com/kitematic/kitematic/master/util/kitematic.ico',
      description: APPNAME,
      title: APPNAME,
      exe: BASENAME + '.exe',
      version: packagejson.version,
      signWithParams: '/f ' + certificateFile + ' /p <%= certificatePassword %> /tr http://timestamp.comodoca.com/rfc3161'
    },

    // docker binaries
    'download-binary': {
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
          src: ['docker*', 'ssh.exe', 'OPENSSH_LICENSE', 'msys-*'],
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
          src: ['docker*', 'macsudo', 'terminal'],
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
        dest: 'installer/' + BASENAME + 'Setup-' + packagejson.version + '-Windows-Alpha.exe'
      }
    },

    // download binaries
    curl: {
      'docker-machine': {
        src: process.platform === 'win32' ? WINDOWS_DOCKER_MACHINE_URL : DARWIN_DOCKER_MACHINE_URL,
        dest: process.platform === 'win32' ? path.join('resources', 'docker-machine.exe') : path.join('resources', 'docker-machine')
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

    plistbuddy: {
      addBundleURLTypes: {
        method: 'Add',
        entry: 'CFBundleURLTypes',
        type: 'array',
        src: '<%= OSX_FILENAME %>/Contents/Info.plist'
      },
      addBundleURLTypesDict: {
        method: 'Add',
        entry: 'CFBundleURLTypes:0',
        type: 'dict',
        src: '<%= OSX_FILENAME %>/Contents/Info.plist'
      },
      addBundleURLTypesDictName: {
        method: 'Add',
        entry: 'CFBundleURLTypes:0:CFBundleURLName',
        type: 'string',
        value: 'Docker App Protocol',
        src: '<%= OSX_FILENAME %>/Contents/Info.plist'
      },
      addBundleURLTypesDictSchemes: {
        method: 'Add',
        entry: 'CFBundleURLTypes:0:CFBundleURLSchemes',
        type: 'array',
        src: '<%= OSX_FILENAME %>/Contents/Info.plist'
      },
      addBundleURLTypesDictSchemesDocker: {
        method: 'Add',
        entry: 'CFBundleURLTypes:0:CFBundleURLSchemes:0',
        type: 'string',
        value: 'docker',
        src: '<%= OSX_FILENAME %>/Contents/Info.plist'
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
          'codesign -v --verify <%= OSX_FILENAME_ESCAPED %>'
        ].join(' && '),
      },
      zip: {
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= OSX_FILENAME_ESCAPED %> <%= OSX_OUT %>/' + BASENAME + '-' + packagejson.version + '-Mac.zip',
      }
    },

    clean: {
      release: ['build/', 'dist/', 'installer/'],
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

  grunt.registerTask('default', ['download-binary', 'newer:babel', 'less', 'newer:copy:dev', 'shell:electron', 'watchChokidar']);

  if (process.platform === 'win32') {
    grunt.registerTask('release', ['clean:release', 'download-binary', 'babel', 'less', 'copy:dev', 'electron:windows', 'copy:windows', 'rcedit:exes', 'prompt:create-windows-installer', 'create-windows-installer', 'rename:installer']);
  } else {
    grunt.registerTask('release', ['clean:release', 'download-binary', 'babel', 'less', 'copy:dev', 'electron:osx', 'copy:osx', 'plistbuddy', 'shell:sign', 'shell:zip']);
  }

  process.on('SIGINT', function () {
    grunt.task.run(['shell:electron:kill']);
    process.exit(1);
  });
};
