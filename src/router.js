module.exports = {
  router: null,

  get: function () {
    return this.router;
  },

  set: function (router) {
    this.router = router;
  }
};
