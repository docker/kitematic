Installs = new Meteor.Collection('installs');

schemaInstalls = new SimpleSchema({
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
    label: 'Time of install created'
  },
  version: {
    type: String,
    label: 'Installed version',
    optional: true
  }
});

Installs.allow({
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

Installs.attachSchema(schemaInstalls);