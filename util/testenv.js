var mock = (function() {
  var store = {};
    return {
          getItem: function(key) {
          return store[key];
      },
      setItem: function(key, value) {
          store[key] = value.toString();
      },
      clear: function() {
          store = {};
      }
  };
})();
Object.defineProperty(window, 'localStorage', { value: mock });
