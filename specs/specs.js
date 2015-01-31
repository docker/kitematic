window.jasmineRequire = require('./jasmine-2.1.3/jasmine');
require('./jasmine-2.1.3/jasmine-html');
require('./jasmine-2.1.3/boot');
var consoleReporter = require('./jasmine-2.1.3/console');

jasmine.getEnv().addReporter(new consoleReporter.ConsoleReporter()({
    showColors: true,
    timer: new jasmine.Timer(),
    print: function() {
      console.log(arguments);
      process.stdout.write.apply(process.stdout, arguments);
    }
  }));

var fs = require('fs');
var tests = fs.readdirSync('./specs').filter(function (f) {
  return f.indexOf('-spec') !== -1;
});

tests.forEach(function (t) {
  require('./' + t);
});
