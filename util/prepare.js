require.requireActual('babel/polyfill');
require.requireActual('source-map-support').install({
  retrieveSourceMap: function(filename) {
    if (filename.indexOf('node_modules') === -1) {
      try {
        return {
          map: require.requireActual('fs').readFileSync('/tmp/' + require('crypto').createHash('md5').update(filename).digest('hex') + '.map', 'utf8')
        };
      } catch (err) {
        return undefined;
      }
    }
  }
});
