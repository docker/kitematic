var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Convert = require('ansi-to-html');
var docker = require('./Docker');

var _convert = new Convert();
var _logs = {};
var _streams = {};

var LogStore = assign(Object.create(EventEmitter.prototype), {
  SERVER_LOGS_EVENT: 'server_logs_event',
  _escapeHTML: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  fetchLogs: function (name) {
    if (!name || !docker.client()) {
      return;
    }
    var index = 0;
    var self = this;
    docker.client().getContainer(name).logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    }, function (err, stream) {
      if (_streams[name]) {
        return;
      }
      _streams[name] = stream;
      if (err) {
        return;
      }
      _logs[name] = _logs[name] || [];
      stream.setEncoding('utf8');
      var timeout;
      stream.on('data', function (buf) {
        // Every other message is a header
        if (index % 2 === 1) {
          //var time = buf.substr(0,buf.indexOf(' '));
          var msg = buf.substr(buf.indexOf(' ')+1);
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          timeout = setTimeout(function () {
            timeout = null;
            self.emit(self.SERVER_LOGS_EVENT, name);
          }, 100);
          _logs[name].push(_convert.toHtml(self._escapeHTML(msg)));
        }
        index += 1;
      });
      stream.on('end', function () {
        delete _streams[name];
      });
    });
  },
  logs: function (name) {
    if (!_streams[name]) {
      this.fetchLogs(name);
    }
    return _logs[name] || [];
  },
  rename: function (name, newName) {
    if (_logs[name]) {
      _logs[newName] = _logs[name];
    }
  }
});

module.exports = LogStore;
