var packagejson = require('./package.json');
var electron = require('electron');

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  var target = grunt.option('target') || 'development';
  var env = process.env;
  env.NODE_PATH = '..:' + env.NODE_PATH;
  env.NODE_ENV = target;

  var BASENAME = 'Kitematic';
  var OSX_OUT = './dist';
  var OSX_OUT_X64 = OSX_OUT + '/' + BASENAME + '-darwin-x64';
  var OSX_FILENAME = OSX_OUT_X64 + '/' + BASENAME + '.app';
  var LINUX_FILENAME = OSX_OUT + '/' + BASENAME + '_' + packagejson.version + '_amd64.deb';
  var VERSION_FILENAME = BASENAME + '-' + packagejson.version;

  grunt.initConfig({
    IDENTITY: 'Developer ID Application: Docker Inc',
    OSX_FILENAME,
    OSX_FILENAME_ESCAPED: OSX_FILENAME.replace(/ /g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)'),
    LINUX_FILENAME,
    VERSION_FILENAME,

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
          icon: 'util/kitematic.ico',
        }
      },
      osx: {
        options: {
          name: BASENAME,
          dir: 'build/',
          out: 'dist',
          version: packagejson['electron-version'],
          platform: 'darwin',
          arch: 'x64',
          asar: true,
          'app-version': packagejson.version,
          icon: 'util/kitematic.icns',
        },
      },
      linux: {
        options: {
          name: BASENAME,
          dir: 'build/',
          out: 'dist',
          version: packagejson['electron-version'],
          platform: 'linux',
          arch: 'x64',
          asar: true,
          'app-bundle-id': 'com.kitematic.kitematic',
          'app-version': packagejson.version,
          icon: 'util/kitematic.png',
        }
      }
    },

    rcedit: {
      exes: {
        files: [{
          expand: true,
          cwd: 'dist/' + BASENAME + '-win32-x64',
          src: [BASENAME + '.exe'],
        }],
        options: {
          icon: 'util/kitematic.ico',
          'file-version': packagejson.version,
          'product-version': packagejson.version,
          'version-string': {
            'CompanyName': 'Docker',
            'ProductVersion': packagejson.version,
            'ProductName': BASENAME,
            'FileDescription': BASENAME,
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
          src: 'util/kitematic.icns',
          dest: 'build/icon.icns',
        }, {
          src: 'util/kitematic.ico',
          dest: 'build/icon.ico',
        }, {
          src: 'util/kitematic.png',
          dest: 'build/icon.png',
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
        }],
        options: {
          mode: true,
        },
      },
    },

    // styles
    less: {
      options: {
        sourceMapFileInline: true,
        javascriptEnabled: true,
      },
      dist: {
        files: {
          'build/main.css': 'styles/main.less'
        }
      }
    },

    // javascript
    babel: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['**/*.js'],
          dest: 'build/',
        }],
      },
    },

    shell: {
      electron: {
        command: electron + ' ' + 'build',
        options: {
          async: true,
          execOptions: {
            env: env,
          },
        },
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
        command: 'ditto -c -k --sequesterRsrc --keepParent <%= OSX_FILENAME_ESCAPED %> release/' + VERSION_FILENAME + '-Mac.zip'
      },
      linux_npm: {
        command: 'cd build && npm install --production'
      },
    },

    clean: {
      release: ['build/', 'dist/']
    },

    compress: {
      windows: {
        options: {
          archive: './release/' + VERSION_FILENAME + '-Windows.zip',
          mode: 'zip',
        },
        files: [{
          expand: true,
          dot: true,
          cwd: './dist/Kitematic-win32-x64',
          src: '**/*',
        }],
      },
      osx: {
        options: {
          archive: './release/' + VERSION_FILENAME + '-Mac.zip',
          mode: 'zip',
        },
        files: [{
          expand: true,
          dot: true,
          cwd: './dist/Kitematic-darwin-x64',
          src: '**/*',
        }],
      },
      debian: {
        options: {
          archive: './release/' + VERSION_FILENAME + '-Ubuntu.zip',
          mode: 'zip',
        },
        files: [{
          expand: true,
          dot: true,
          cwd: './dist',
          src: '*.deb',
        }],
      },
    },

    // livereload
    watch: {
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
          icon: './util/kitematic.png',
          version: packagejson['electron-version'], // set version of electron
          overwrite: true,
        }
      },
      osxlnx: {
        options: {
          platform: 'linux',
          arch: 'x64',
          dir: './build',
          out: './dist/',
          name: 'Kitematic',
          version: packagejson['electron-version'], // set version of electron
          overwrite: true,
        }
      },
    },
    'electron-installer-debian': {
      options: {
        name: BASENAME.toLowerCase(), // spaces and brackets cause linting errors
        productName: BASENAME.toLowerCase(),
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
      },
      linux64: {
        options: {
          arch: 'amd64'
        },
        src: './dist/Kitematic-linux-x64/',
        dest: './dist/',
        rename: function (dest, src) {
          return OSX_OUT + '/' + VERSION_FILENAME + '_amd64.deb';
        },
      },
      linux32: {
        options: {
          arch: 'i386'
        },
        src: './dist/Kitematic-linux-ia32/',
        dest: './dist/',
        rename: function (dest, src) {
          return OSX_OUT + '/' + VERSION_FILENAME + '_i386.deb';
        },
      }
    },
    'electron-installer-redhat': {
      options: {
        productName: BASENAME,
        productDescription: 'Run containers through a simple, yet powerful graphical user interface.',
        priority: 'optional',
        icon: './util/kitematic.png',
        categories: [
          'Utilities',
        ],
      },
      linux64: {
        options: {
          arch: 'x86_64',
        },
        src: './dist/Kitematic-linux-x64/',
        dest: './dist/',
        rename: function (dest, src) {
          return OSX_OUT + '/' + VERSION_FILENAME + '_amd64.rpm';
        },
      },
      linux32: {
        options: {
          arch: 'x86',
        },
        src: './dist/Kitematic-linux-ia32/',
        dest: './dist/',
        rename: function (dest, src) {
          return OSX_OUT + '/' + VERSION_FILENAME + '_i386.rpm';
        },
      },
    },
  });

  // Load the plugins for linux packaging
  grunt.loadNpmTasks('grunt-electron-packager');
  grunt.loadNpmTasks('grunt-electron-installer-debian');
  grunt.loadNpmTasks('grunt-electron-installer-redhat');

  grunt.registerTask('build', ['newer:babel', 'less', 'newer:copy:dev']);
  grunt.registerTask('default', ['build', 'shell:electron', 'watch']);

  grunt.registerTask('release:linux', [
    'clean:release', 'build', 'shell:linux_npm',
    'electron:linux', 'electron-packager:build',
  ]);

  grunt.registerTask('release:debian:x32', ['release:linux', 'electron-installer-debian:linux32', 'compress:debian']);
  grunt.registerTask('release:debian:x64', ['release:linux', 'electron-installer-debian:linux64', 'compress:debian']);

  grunt.registerTask('release:redhat:x32', ['release:linux', 'electron-installer-redhat:linux32']);
  grunt.registerTask('release:redhat:x64', ['release:linux', 'electron-installer-redhat:linux64']);

  grunt.registerTask('release:mac', [
    'clean:release', 'build', 'shell:linux_npm',
    'electron:osx', 'copy:osx', 'shell:sign', 'shell:zip',
  ]);

  grunt.registerTask('release:windows', [
    'clean:release',
    'build', 'shell:linux_npm',
    'electron:windows',
    'copy:windows', 'rcedit:exes', 'compress:windows',
  ]);

  process.on('SIGINT', function () {
    grunt.task.run(['shell:electron:kill']);
    process.exit(1);
  });
};
