Template.dashboard_apps.helpers({
  apps: function () {
    return Apps.find({name: {$ne: 'kite-dns'}}, {sort: {createdAt: -1}});
  }
});
