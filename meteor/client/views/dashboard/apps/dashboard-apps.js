Template.dashboardApps.helpers({
  apps: function () {
    return Apps.find({}, {sort: {createdAt: -1}});
  }
});
