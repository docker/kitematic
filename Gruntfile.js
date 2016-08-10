var fs = require('fs');
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
  var OSX_APPNAME = BASENAME + ' (Beta)';
  var WINDOWS_APPNAME = BASENAME + ' (Alpha)';
  var LINUX_APPNAME = BASENAME + ' (Alpha)';
  var OSX_OUT = './dist';
  var OSX_OUT_X64 = OSX_OUT + '/' + OSX_APPNAME + '-darwin-x64';
  var OSX_FILENAME = OSX_OUT_X64 + '/' + OSX_APPNAME + '.app';
  var LINUX_FILENAME = OSX_OUT + '/' + BASENAME + '_' + packagejson.version + '_amd64.deb';


  var IS_WINDOWS = process.platform === 'win32';
  var IS_LINUX = process.platform === 'linux';

  var IS_I386 = process.arch === 'ia32';
  var IS_X64 = process.arch === 'x64';

  var IS_DEB = fs.existsSync('/etc/lsb-release') || fs.existsSync('/etc/debian_version');
  var IS_RPM = fs.existsSync('/etc/redhat-release');

  var linuxpackage = null;
  // linux package detection
  if (IS_DEB && IS_X64) {
    linuxpackage = 'electron-installer-debian:linux64';
  } else if (IS_DEB && IS_I386) {
    linuxpackage = 'electron-installer-debian:linux32';
    LINUX_FILENAME = OSX_OUT + '/' + BASENAME + '_' + packagejson.version + '_i386.deb';
  } else if (IS_RPM && IS_X64) {
    linuxpackage = 'electron-installer-redhat:linux64';
    LINUX_FILENAME = OSX_OUT + '/' + BASENAME + '_' + packagejson.version + '_x86_64.rpm';
  } else if (IS_RPM && IS_I386) {
    linuxpackage = 'electron-installer-redhat:linux32';
    LINUX_FILENAME = OSX_OUT + '/' + BASENAME + '_' + packagejson.version + '_x86.rpm';
  }

  grunt.initConfig({
    IDENTITY: 'Developer ID Application: Docker Inc',
    OSX_FILENAME: OSX_FILENAME,
    OSX_FILENAME_ESCAPED: OSX_FILENAME.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)'),
    LINUX_FILENAME: LINUX_FILENAME,

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
          name: OSX_APPNAME,
          dir: 'build/',
          out: 'dist',
          version: packagejson['electron-version'],
          platform: 'darwin',
          arch: 'x64',
          asar: true,
          'app-version': packagejson.version
        }
      },
      linux: {
        options: {
          name: LINUX_APPNAME,
          dir: 'build/',
          out: 'dist',
          version: packagejson['electron-version'],
          platform: 'linux',
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
            'ProductName': WINDOWS_APPNAME,
            'FileDescription': WINDOWS_APPNAME,
            'InternalName': BASENAME + '.exe',
            'OriginalFilename': BASENAME + '.exe',
            'LegalCopyright': 'Copyright 2015-2016 Docker Inc. All rights reserved.'
          }
        }
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
          src: Object.keys(packagejson.dependencies).map(function (dep) {
            return dep + '/**/*';
          }),
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
          dest: 'build/'
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
          failOnError: false
        },
        command: [
          'codesign --deep -v -f -s "<%= IDENTITY %>" <%= OSX_FILENAME_ESCAPED %>/Contents/Frameworks/*',
          'codesign -v -f -s "<%= IDENTITY %>" <%= OSX_FILENAME_ESCAPED %>',
          'codesign -vvv --display <%= OSX_FILENAME_ESCAPED %>',
          'codesign -v --verify <%= OSX_FILENAME_ESCAPED %>'
        ].join(' && ')
      },
      zip: {
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= OSX_FILENAME_ESCAPED %> release/' + BASENAME + '-Mac.zip'
      },
      linux_npm: {
        command: 'cd build && npm install --production'
      },
      linux_zip: {
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= LINUX_FILENAME %> release/' + BASENAME + '-Ubuntu.zip'
      }
    },

    clean: {
      release: ['build/', 'dist/']
    },

    compress: {
      windows: {
        options: {
          archive: './release/' + BASENAME + '-Windows.zip',
          mode: 'zip'
        },
        files: [{
          expand: true,
          dot: true,
          cwd: './dist/Kitematic-win32-x64',
          src: '**/*'
        }]
      }
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
    },
    'electron-packager': {
      build: {
        options: {
          platform: process.platform,
          arch: process.arch,
          dir: './build',
          out: './dist/',
          name: 'Kitematic',
          ignore: 'bower.json',
          version: packagejson['electron-version'], // set version of electron
          overwrite: true
        }
      },
      osxlnx: {
        options: {
          platform: 'linux',
          arch: 'x64',
          dir: './build',
          out: './dist/',
          name: 'Kitematic',
          ignore: 'bower.json',
          version: packagejson['electron-version'], // set version of electron
          overwrite: true
        }
      }
    },
    'electron-installer-debian': {
      options: {
        name: BASENAME.toLowerCase(), // spaces and brackets cause linting errors
        productName: LINUX_APPNAME.toLowerCase(),
        productDescription: 'Run containers through a simple, yet powerful graphical user interface.',
        maintainer: 'Ben French <frenchben@docker.com>',
        section: 'devel',
        priority: 'optional',
        icon: './util/kitematic.png',
        lintianOverrides: [
          'changelog-file-missing-in-native-package',
          'executable-not-elf-or-script',
          'extra-license-file',
          'non-standard-dir-perm',
          'non-standard-file-perm',
          'non-standard-executable-perm',
          'script-not-executable',
          'shlib-with-executable-bit',
          'binary-without-manpage',
          'debian-changelog-file-missing',
          'unusual-interpreter',
          'wrong-path-for-interpreter',
          'backup-file-in-package',
          'package-contains-vcs-control-file',
          'embedded-javascript-library',
          'embedded-library',
          'arch-dependent-file-in-usr-share'
        ],
        categories: [
          'Utility'
        ],
        rename: function (dest, src) {
          return LINUX_FILENAME;
        }
      },
      linux64: {
        options: {
          arch: 'amd64'
        },
        src: './dist/Kitematic-linux-x64/',
        dest: './dist/'
      },
      linux32: {
        options: {
          arch: 'i386'
        },
        src: './dist/Kitematic-linux-ia32/',
        dest: './dist/'
      }
    },
    'electron-installer-redhat': {
      options: {
        productName: LINUX_APPNAME,
        productDescription: 'Run containers through a simple, yet powerful graphical user interface.',
        priority: 'optional',
        icon: './util/kitematic.png',
        categories: [
          'Utilities'
        ],
        rename: function (dest, src) {
          return LINUX_FILENAME;
        }
      },
      linux64: {
        options: {
          arch: 'x86_64'
        },
        src: './dist/Kitematic-linux-x64/',
        dest: './dist/'
      },
      linux32: {
        options: {
          arch: 'x86'
        },
        src: './dist/Kitematic-linux-ia32/',
        dest: './dist/'
      }
    }
  });

  // Load the plugins for linux packaging
  grunt.loadNpmTasks('grunt-electron-packager');
  grunt.loadNpmTasks('grunt-electron-installer-debian');
  grunt.loadNpmTasks('grunt-electron-installer-redhat');

  grunt.registerTask('default', ['newer:babel', 'less', 'newer:copy:dev', 'shell:electron', 'watchChokidar']);

  if (!IS_WINDOWS && !IS_LINUX) {
    grunt.registerTask('release', ['clean:release', 'babel', 'less', 'copy:dev', 'electron', 'copy:osx', 'shell:sign', 'shell:zip', 'copy:windows', 'rcedit:exes', 'compress', 'shell:linux_npm', 'electron-packager:osxlnx', 'electron-installer-debian:linux64', 'shell:linux_zip']);
  }else if (IS_LINUX) {
    if (linuxpackage) {
      grunt.registerTask('release', ['clean:release', 'babel', 'less', 'copy:dev', 'shell:linux_npm', 'electron-packager:build', linuxpackage]);
    }else {
      grunt.log.errorlns('Your Linux distribution is not yet supported - arch:' + process.arch + ' platform:' + process.platform);
    }
  }else {
    grunt.registerTask('release', ['clean:release', 'babel', 'less', 'copy:dev', 'electron:windows', 'copy:windows', 'rcedit:exes', 'compress']);
  }

  process.on('SIGINT', function () {
    grunt.task.run(['shell:electron:kill']);
    process.exit(1);
  });
};
