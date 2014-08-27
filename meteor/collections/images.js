Images = new Meteor.Collection('images');

schemaImages = new SimpleSchema({
  path: {
    type: String,
    label: "Path to the image directory",
    optional: true
  },
  originPath: {
    type: String,
    label: "Path to the folder where image is built from",
    optional: true
  },
  logoPath: {
    type: String,
    label: "Path to the image logo",
    optional: true
  },
  meta: {
    type: Object,
    label: "Meta data for the image",
    blackbox: true,
    optional: true
  },
  docker: {
    type: Object,
    label: "Docker image data",
    blackbox: true,
    optional: true
  },
  status: {
    type: String,
    allowedValues: ['BUILDING', 'READY', 'ERROR'],
    label: "Image build current status",
    max: 200
  },
  buildLogs: {
    type: [String],
    label: "Build logs",
    defaultValue: []
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      var now = new Date();
      if (this.isInsert) {
        return now;
      } else if (this.isUpsert) {
        return {$setOnInsert: now};
      } else {
        this.unset();
      }
    },
    denyUpdate: true,
    label: "Time of image created"
  }
});

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

Images.attachSchema(schemaImages);
