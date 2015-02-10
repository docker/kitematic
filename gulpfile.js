var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var downloadatomshell = require('gulp-download-atom-shell');
var fs = require('fs');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var react = require('gulp-react');
var to5 = require('gulp-6to5');
var runSequence = require('run-sequence');
var shell = require('gulp-shell');
var sourcemaps = require('gulp-sourcemaps');
var packagejson = require('./package.json');

var dependencies = Object.keys(packagejson.dependencies);
var isBeta = process.argv.indexOf('--beta') !== -1;
var options = {
  dev: process.argv.indexOf('release') === -1 && process.argv.indexOf('test') === -1,
  test: process.argv.indexOf('test') !== -1,
  integration: process.argv.indexOf('--integration') !== -1,
  beta: isBeta,
  filename: isBeta ? 'Kitematic (Beta).app' : 'Kitematic.app',
  name: isBeta ? 'Kitematic (Beta)' : 'Kitematic',
  icon: isBeta ? 'kitematic-beta.icns' : 'kitematic.icns'
};

gulp.task('js', function () {
  return gulp.src('src/**/*.js')
    .pipe(plumber(function(error) {
      gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
      this.emit('end');
    }))
    .pipe(gulpif(options.dev || options.test, sourcemaps.init()))
    .pipe(react())
    .pipe(to5({blacklist: ['regenerator']}))
    .pipe(gulpif(options.dev || options.test, sourcemaps.write('.')))
    .pipe(gulp.dest((options.dev || options.test) ? './build' : './dist/osx/' + options.filename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, livereload()));
});

gulp.task('images', function() {
  return gulp.src('images/*')
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.filename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, livereload()));
});

gulp.task('styles', function () {
  return gulp.src('styles/main.less')
    .pipe(plumber(function(error) {
      gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
      // emit the end event, to properly end the task
      this.emit('end');
    }))
    .pipe(gulpif(options.dev, sourcemaps.init()))
    .pipe(less())
    .pipe(gulpif(options.dev, sourcemaps.write()))
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.filename + '/Contents/Resources/app/build'))
    .pipe(gulpif(!options.dev, cssmin()))
    .pipe(concat('main.css'))
    .pipe(gulpif(options.dev, livereload()));
});

gulp.task('download', function (cb) {
  downloadatomshell({
    version: packagejson['atom-shell-version'],
    outputDir: 'cache'
  }, cb);
});

gulp.task('copy', function () {
  gulp.src('index.html')
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.filename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, livereload()));

  gulp.src('fonts/**')
    .pipe(gulp.dest(options.dev ? './build' : './dist/osx/' + options.filename + '/Contents/Resources/app/build'))
    .pipe(gulpif(options.dev, livereload()));
});

gulp.task('dist', function () {
  var stream = gulp.src('').pipe(shell([
    'rm -Rf ./dist',
    'mkdir -p ./dist/osx',
    'cp -R ./cache/Atom.app ./dist/osx/<%= filename %>',
    'mv ./dist/osx/<%= filename %>/Contents/MacOS/Atom ./dist/osx/<%= filename %>/Contents/MacOS/<%= name %>',
    'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app',
    'mkdir -p ./dist/osx/<%= filename %>/Contents/Resources/app/node_modules',
    'cp -R browser dist/osx/<%= filename %>/Contents/Resources/app',
    'cp package.json dist/osx/<%= filename %>/Contents/Resources/app/',
    'cp settings.json dist/osx/<%= filename %>/Contents/Resources/app/',
    'mkdir -p dist/osx/<%= filename %>/Contents/Resources/app/resources',
    'cp -v resources/* dist/osx/<%= filename %>/Contents/Resources/app/resources/ || :',
    'cp <%= icon %> dist/osx/<%= filename %>/Contents/Resources/atom.icns',
    '/usr/libexec/PlistBuddy -c "Set :CFBundleVersion <%= version %>" dist/osx/<%= filename %>/Contents/Info.plist',
    '/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist',
    '/usr/libexec/PlistBuddy -c "Set :CFBundleName <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist',
    '/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier <%= bundle %>" dist/osx/<%= filename %>/Contents/Info.plist',
    '/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable <%= name %>" dist/osx/<%= filename %>/Contents/Info.plist'
    ], {
      templateData: {
        filename: options.filename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)'),
        name: options.name.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)'),
        version: packagejson.version,
        bundle: 'com.kitematic.app',
        icon: options.icon
      }
  }));

  dependencies.forEach(function (d) {
    stream = stream.pipe(shell([
      'cp -R node_modules/' + d + ' dist/osx/<%= filename %>/Contents/Resources/app/node_modules/'
    ], {
      templateData: {
        filename: options.filename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)')
      }
    }));
  });

  return stream;
});

gulp.task('sign', function () {
  try {
    var signing_identity = fs.readFileSync('./identity', 'utf8').trim();
    return gulp.src('').pipe(shell([
      'codesign --deep --force --verbose --sign "' + signing_identity + '" ' + options.filename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)')
    ], {
      cwd: './dist/osx/'
    }));
  } catch (error) {
    gutil.log(gutil.colors.red('Error: ' + error.message));
  }
});

gulp.task('zip', function () {
  return gulp.src('').pipe(shell([
    'ditto -c -k --sequesterRsrc --keepParent ' +  options.filename.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)') + ' ' +  options.name.replace(' ', '\\ ').replace('(','\\(').replace(')','\\)') + '-' + packagejson.version + '.zip'
  ], {
    cwd: './dist/osx/'
  }));
});

gulp.task('release', function () {
  runSequence('download', 'dist', ['copy', 'images', 'js', 'styles'], 'sign', 'zip');
});

gulp.task('default', ['download', 'copy', 'js', 'images', 'styles'], function () {
  gulp.watch('src/**/*.js', ['js']);
  gulp.watch('index.html', ['copy']);
  gulp.watch('styles/**/*.less', ['styles']);
  gulp.watch('images/**', ['images']);

  livereload.listen();

  var env = process.env;
  env.NODE_ENV = 'development';
  gulp.src('').pipe(shell(['./cache/Atom.app/Contents/MacOS/Atom .'], {
    env: env
  }));
});
