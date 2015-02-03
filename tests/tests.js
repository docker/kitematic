window.jasmineRequire = require('./jasmine-2.1.3/jasmine');
require('./jasmine-2.1.3/jasmine-html');
require('./jasmine-2.1.3/boot');
var consoleReporter = require('./jasmine-2.1.3/console');
var app = require('remote').require('app');

jasmine.getEnv().addReporter(new consoleReporter.ConsoleReporter()({
    showColors: true,
    timer: new jasmine.Timer(),
    print: function() {
      process.stdout.write.apply(process.stdout, arguments);
    },
    onComplete: function () {
      app.quit();
    }
  }));

var fs = require('fs');
var tests = fs.readdirSync('./tests').filter(function (f) {
  return f.indexOf('-' + process.env.TEST_TYPE) !== -1;
});

tests.forEach(function (t) {
  require('./' + t);
});
