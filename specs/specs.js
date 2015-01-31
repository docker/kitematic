window.jasmineRequire = require('./jasmine-2.1.3/jasmine');
require('./jasmine-2.1.3/jasmine-html');
require('./jasmine-2.1.3/boot');

var Reporter = require('jasmine-terminal-reporter');
var reporter = new Reporter();
jasmine.getEnv().addReporter(reporter);

var fs = require('fs');
var tests = fs.readdirSync('./specs').filter(function (f) {
  return f.indexOf('-spec') !== -1;
});

tests.forEach(function (t) {
  require('./' + t);
});
