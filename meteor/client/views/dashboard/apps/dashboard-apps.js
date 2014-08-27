Template.dashboard_apps.helpers({
  apps: function () {
    return Apps.find({}, {sort: {createdAt: -1}});
  }
});
