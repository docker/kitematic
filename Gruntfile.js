var path = require('path');
var execFile = require('child_process').execFile;
var packagejson = require('./package.json');
var electron = require('electron-prebuilt');

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

  var BASENAME = 'Kitematic';
  var APPNAME = BASENAME;

  if (alpha) {
    APPNAME += ' (Alpha)';
  } else if (beta) {
    APPNAME += ' (Beta)';
  }

  var OSX_OUT = './dist';
  var OSX_OUT_X64 = OSX_OUT + '/' + APPNAME + '-darwin-x64';
  var OSX_FILENAME = OSX_OUT_X64 + '/' + APPNAME + '.app';

  grunt.initConfig({
    IDENTITY: 'Developer ID Application: Docker Inc',
    APPNAME: APPNAME,
    APPNAME_ESCAPED: APPNAME.replace(/ /g, '\\ ').replace(/\(/g,'\\(').replace(/\)/g,'\\)'),
    OSX_OUT: OSX_OUT,
    OSX_OUT_ESCAPED: OSX_OUT.replace(/ /g, '\\ ').replace(/\(/g,'\\(').replace(/\)/g,'\\)'),
    OSX_OUT_X64: OSX_OUT_X64,
    OSX_FILENAME: OSX_FILENAME,
    OSX_FILENAME_ESCAPED: OSX_FILENAME.replace(/ /g, '\\ ').replace(/\(/g,'\\(').replace(/\)/g,'\\)'),

    // electron
    electron: {
      windows: {
        options: {
          name: BASENAME,
          dir: 'build/',
          out: 'dist',
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
          out: 'dist',
          version: packagejson['electron-version'],
          platform: 'darwin',
          arch: 'x64',
          asar: true,
          'app-bundle-id': 'com.kitematic.kitematic',
          'app-version': packagejson.version
        }
      }
    },

    rcedit: {
      exes: {
        files: [{
          expand: true,
          cwd: 'dist/' + BASENAME + '-win32-x64',
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
      config: {
        appDirectory: path.join(__dirname, 'dist/' + BASENAME + '-win32-x64'),
        outputDirectory: path.join(__dirname, 'dist'),
        authors: 'Docker Inc.',
        loadingGif: 'util/loading.gif',
        setupIcon: 'util/setup.ico',
        iconUrl: 'https://raw.githubusercontent.com/kitematic/kitematic/master/util/kitematic.ico',
        description: APPNAME,
        title: APPNAME,
        exe: BASENAME + '.exe',
        version: packagejson.version
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
          src: ['ssh.exe', 'OPENSSH_LICENSE', 'msys-*'],
          dest: 'dist/' + BASENAME + '-win32-x64/resources/resources'
        }],
        options: {
          mode: true
        }
      },
      osx: {
        files: [{
          expand: true,
          cwd: 'resources',
          src: ['terminal'],
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
        src: 'dist/Setup.exe',
        dest: 'dist/' + BASENAME + 'Setup-' + packagejson.version + '-Windows-Alpha.exe'
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
        blacklist: 'regenerator',
        stage: 1,
        optional: ['asyncToGenerator']
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
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= OSX_FILENAME_ESCAPED %> dist/' + BASENAME + '-' + packagejson.version + '-Mac.zip',
      }
    },

    clean: {
      release: ['build/', 'dist/'],
    },

    compress: {
      windows: {
        options: {
	        archive: './dist/' +  BASENAME + '-' + packagejson.version + '-Windows-Alpha.zip',
          mode: 'zip'
        },
        files: [{
          expand: true,
          dot: true,
          cwd: './dist/Kitematic-win32-x64',
          src: '**/*'
        }]
	    },
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

  grunt.registerTask('default', ['newer:babel', 'less', 'newer:copy:dev', 'shell:electron', 'watchChokidar']);

  if (process.platform === 'win32') {
    grunt.registerTask('release', ['clean:release', 'babel', 'less', 'copy:dev', 'electron:windows', 'copy:windows', 'rcedit:exes', 'compress']);
  } else {
    grunt.registerTask('release', ['clean:release', 'babel', 'less', 'copy:dev', 'electron:osx', 'copy:osx', 'shell:sign', 'shell:zip']);
  }

  process.on('SIGINT', function () {
    grunt.task.run(['shell:electron:kill']);
    process.exit(1);
  });
};
