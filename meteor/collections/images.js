Images = new Meteor.Collection('images');

Images.helpers({
  downloadStatus: function () {
    if (this.buildLogs.length > 0) {
      return _.last(this.buildLogs);
    } else {
      return null;
    }
  },
  downloadPercentage: function () {
    if (this.buildLogs.length > 0) {
      var lastLine = _.last(this.buildLogs);
      if (_.last(lastLine) === '%') {
        return _.last(lastLine.split(' '));
      } else {
        return '100%';
      }
    } else {
      return '100%';
    }
  }
});

Images.allow({
  'update': function () {
    return true;
  },
  'insert': function () {
    return true;
  },
  'remove': function () {
    return true;
  }
});
