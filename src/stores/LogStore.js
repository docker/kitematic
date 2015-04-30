var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var Convert = require('ansi-to-html');
var docker = require('../utils/DockerUtil');
var stream = require('stream');

var _convert = new Convert();
var _logs = {};
var _streams = {};

var MAX_LOG_SIZE = 3000;

module.exports = assign(Object.create(EventEmitter.prototype), {
  SERVER_LOGS_EVENT: 'server_logs_event',
  _escape: function (html) {
    var text = document.createTextNode(html);
    var div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  },
  fetch: function (name) {
    if (!name || !docker.client()) {
      return;
    }
    docker.client().getContainer(name).logs({
      stdout: true,
      stderr: true,
      timestamps: false,
      tail: MAX_LOG_SIZE,
      follow: false
    }, (err, logStream) => {
      if (err) {
        return;
      }
      var logs = [];
      var outstream = new stream.PassThrough();
      docker.client().modem.demuxStream(logStream, outstream, outstream);
      outstream.on('data', (chunk) => {
        logs.push(_convert.toHtml(this._escape(chunk)));
      });
      logStream.on('end', () => {
        _logs[name] = logs;
        this.emit(this.SERVER_LOGS_EVENT);
        this.attach(name);
      });
    });
  },
  attach: function (name) {
    if (!name || !docker.client() || _streams[name]) {
      return;
    }
    docker.client().getContainer(name).attach({
      stdout: true,
      stderr: true,
      logs: false,
      stream: true
    }, (err, logStream) => {
      if (err) {
        return;
      }
      _streams[name] = logStream;
      var outstream = new stream.PassThrough();
      docker.client().modem.demuxStream(logStream, outstream, outstream);
      outstream.on('data', (chunk) => {
        _logs[name].push(_convert.toHtml(this._escape(chunk)));
        if (_logs[name].length > MAX_LOG_SIZE) {
           _logs[name] = _logs[name].slice(_logs[name].length - MAX_LOG_SIZE, MAX_LOG_SIZE);
        }
        this.emit(this.SERVER_LOGS_EVENT);
      });
      logStream.on('end', () => {
        this.detach(name);
      });
    });
  },
  detach: function (name) {
    if (_streams[name]) {
      _streams[name].destroy();
      delete _streams[name];
    }
  },
  logs: function (name) {
    return _logs[name] || [];
  },
  rename: function (name, newName) {
    if (_logs[name]) {
      _logs[newName] = _logs[name];
    }
  }
});
