var React = require('react');
var docker = require('./Docker');
var router = require('./router');
var boot2docker = require('./boot2docker');
var ContainerStore = require('./ContainerStore');
var SetupStore = require('./ContainerStore');

if (process.env.NODE_ENV === 'development') {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'http://localhost:35729/livereload.js';
  var head = document.getElementsByTagName('head')[0];
  head.appendChild(script);
}

if (!window.location.hash.length || window.location.hash === '#/') {
  SetupStore.run(function () {
    boot2docker.ip(function (err, ip) {
      if (err) { console.log(err); }
      docker.setHost(ip);
      router.transitionTo('containers');
      ContainerStore.init(function (err) {
        if (err) { console.log(err); }
        router.run(function (Handler) {
          React.render(<Handler/>, document.body);
        });
      });
    });
  });
} else {
  boot2docker.ip(function (err, ip) {
    if (err) { console.log(err); }
    docker.setHost(ip);
    ContainerStore.init(function (err) {
      if (err) { console.log(err); }
      router.run(function (Handler) {
        React.render(<Handler/>, document.body);
      });
    });
  });
}
