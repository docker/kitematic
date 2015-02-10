var async = require('async');
var $ = require('jquery');

var Registry = {
  token: function(repository, callback) {
    $.ajax({
      url: 'https://registry.hub.docker.com/v1/repositories/' + repository + '/images',
      headers: {
        'X-Docker-Token': true,
      },
      success: function (res, status, xhr) {
        callback(null, xhr.getResponseHeader('X-Docker-Token'));
      },
      error: function (err) {
        callback(err);
      }
    });
  },
  ancestry: function (imageId, token, callback) {
    $.ajax({
      url: 'https://registry-1.docker.io/v1/images/' + imageId + '/ancestry',
      headers: {
        Authorization: 'Token ' + token
      },
      success: function (layers) {
        callback(null, layers);
      },
      error: function (err) {
        callback(err);
      }
    });
  },
  imageId: function (repository, tag, token, callback) {
    $.ajax({
      url: 'https://registry-1.docker.io/v1/repositories/' + repository + '/tags/' + tag,
      headers: {
        Authorization: 'Token ' + token
      },
      success: function (res) {
        callback(null, res);
      },
      error: function (err) {
        callback(err);
      }
    });
  },

  // Returns an array [{Id: <12 character image ID, size: size of layer in bytes}]
  layers: function (repository, tag, callback) {
    var self = this;
    this.token(repository, function (err, token) {
      self.imageId(repository, tag, token, function (err, imageId) {
        self.ancestry(imageId, token, function (err, layers) {
          async.map(layers, function (layer, callback) {
            $.ajax({
              url: 'https://registry-1.docker.io/v1/images/' + layer + '/json',
              headers: {
                Authorization: 'Token ' + token
              },
              success: function (res, status, xhr) {
                var size = xhr.getResponseHeader('X-Docker-Size');
                callback(null, {
                  Id: layer.slice(0, 12),
                  size: parseInt(size, 10)
                });
              },
              error: function (err) {
                callback(err);
              }
            });
          }, function (err, results) {
            if (err) {
              callback('Could not sum' + err);
              return;
            }
            callback(null, results);
          });
        });
      });
    });
  }
};

module.exports = Registry;
