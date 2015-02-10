var ReactTools = require('react-tools');

module.exports = {
  process: function(src, filename) {
    if (filename.indexOf('node_modules') === -1) {
      var res = ReactTools.transform(require('6to5').transform(src).code);
      if (filename.indexOf('-test') !== -1) {
        res = 'require(\'6to5/polyfill\');' + res;
      }
      return res;
    }
    return src;
  }
};
