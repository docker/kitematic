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
  fetch: function (containerName) {
    if (!containerName) {
      return;
    }
    docker.client.getContainer(containerName).logs({
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
      docker.client.modem.demuxStream(logStream, outstream, outstream);
      outstream.on('data', (chunk) => {
        logs.push(_convert.toHtml(this._escape(chunk)));
      });
      logStream.on('end', () => {
        _logs[containerName] = logs;
        this.emit(this.SERVER_LOGS_EVENT);
        this.attach(containerName);
      });
    });
  },
  attach: function (driverName, containerName) {
    if (!containerName || !docker.activeClient || _streams[containerName]) {
      return;
    }
    docker.client.getContainer(containerName).attach({
      stdout: true,
      stderr: true,
      logs: false,
      stream: true
    }, (err, logStream) => {
      if (err) {
        return;
      }
      _streams[containerName] = logStream;
      var outstream = new stream.PassThrough();
      docker.client.modem.demuxStream(logStream, outstream, outstream);
      outstream.on('data', (chunk) => {
        _logs[containerName].push(_convert.toHtml(this._escape(chunk)));
        if (_logs[containerName].length > MAX_LOG_SIZE) {
           _logs[containerName] = _logs[containerName].slice(_logs[containerName].length - MAX_LOG_SIZE, MAX_LOG_SIZE);
        }
        this.emit(this.SERVER_LOGS_EVENT);
      });
      logStream.on('end', () => {
        this.detach(driverName, containerName);
      });
    });
  },
  detach: function (driverName, containerName) {
    if (_streams[containerName]) {
      _streams[containerName].destroy();
      delete _streams[containerName];
    }
  },
  logs: function (driverName, containerName) {
    return _logs[containerName] || [];
  }
});
