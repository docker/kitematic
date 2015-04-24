var babel = require('babel');
var fs = require('fs');
var crypto = require('crypto');

module.exports = {
  process: function(src, filename) {
    if (filename.indexOf('node_modules') !== -1) {
      return src;
    }
    var compiled = babel.transform(src, {filename: filename, sourceMap: true});
    fs.writeFileSync('/tmp/' + crypto.createHash('md5').update(filename).digest('hex') + '.map', JSON.stringify(compiled.map));
    return compiled.code;
  }
};
