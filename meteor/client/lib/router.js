Router.configure({
  layoutTemplate: 'layout',
  onBeforeAction: function () {
    var setting = Settings.findOne({});
    if (setting && setting.tracking) {
      var currentPath = Router.current().path;
      ga('send', 'pageview', currentPath);
    }
    this.next();
  }
});

DashboardController = RouteController.extend({
  layoutTemplate: 'dashboardLayout',
  waitOn: function () {
    return [Meteor.subscribe('apps'), Meteor.subscribe('images'), Meteor.subscribe('settings')];
  }
});

AppController = DashboardController.extend({
  layoutTemplate: 'dashboardAppsLayout',
  data: function () {
    return Apps.findOne({name: this.params.name});
  }
});

ImageController = DashboardController.extend({
  layoutTemplate: 'dashboardImagesLayout',
  data: function () {
    return Images.findOne({_id: this.params.id});
  }
});

Router.map(function () {
  this.route('intro', {
    path: '/',
    waitOn: function () {
      return [Meteor.subscribe('apps'), Meteor.subscribe('images'), Meteor.subscribe('settings')];
    },
    action: function () {
      Session.set('onIntro', true);
      if (this.ready()) {
        this.render();
        Setup.run(function (err) {
          if (err) {
            console.log('Setup failed.');
            console.log(err);
          } else {
            var settings = Settings.findOne();
            if (!settings) {
              Settings.insert({tracking: true});
            }
            Session.set('onIntro', false);
            startUpdatingBoot2DockerUtilization();
            startSyncingAppState();
            Router.go('dashboard_apps');
          }
        });
      }
    }
  });

  this.route('dashboard_apps', {
    path: '/apps',
    controller: 'DashboardController'
  });

  this.route('dashboard_apps_detail', {
    path: '/apps/:name',
    controller: 'AppController',
    action: function () {
      this.redirect('dashboard_apps_settings', {name: this.params.name});
    }
  });

  this.route('dashboard_images_detail', {
    path: '/images/:id',
    controller: 'ImageController',
    action: function () {
      this.redirect('dashboard_images_settings', {id: this.params.id});
    }
  });

  this.route('dashboard_images', {
    path: '/images',
    controller: 'DashboardController'
  });

  this.route('dashboard_images_logs', {
    path: '/images/:id/logs',
    controller: 'ImageController'
  });

  this.route('dashboard_images_settings', {
    path: '/images/:id/settings',
    controller: 'ImageController'
  });

  this.route('dashboard_apps_logs', {
    path: '/apps/:name/logs',
    controller: 'AppController'
  });

  this.route('dashboard_apps_settings', {
    path: '/apps/:name/settings',
    controller: 'AppController'
  });

  this.route('dashboard_settings', {
    path: '/settings',
    controller: 'DashboardController'
  });

  this.route('404', {
    path: '*',
    controller: 'DashboardController',
    template: 'dashboard_apps'
  });

});
