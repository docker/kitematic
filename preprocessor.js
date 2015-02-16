var ReactTools = require('react-tools');

module.exports = {
  process: function(src, filename) {
    if (filename.indexOf('node_modules') === -1) {
      var res = ReactTools.transform(require('babel').transform(src).code);
      if (filename.indexOf('-test') !== -1) {
        res = 'require(\'babel/polyfill\');' + res;
      }
      return res;
    }
    return src;
  }
};
