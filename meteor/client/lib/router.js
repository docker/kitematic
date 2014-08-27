Router.configure({
  layoutTemplate: 'layout',
  trackPageView: true
});

SetupController = RouteController.extend({
  layoutTemplate: 'setup_layout',
  waitOn: function () {
    return [Meteor.subscribe('installs')];
  }
});

DashboardController = RouteController.extend({
  layoutTemplate: 'dashboard_layout',
  waitOn: function () {
    return [Meteor.subscribe('apps'), Meteor.subscribe('images'), Meteor.subscribe('installs')];
  }
});

AppController = DashboardController.extend({
  layoutTemplate: 'dashboard_apps_layout',
  data: function () {
    return Apps.findOne({name: this.params.name});
  }
});

ImageController = DashboardController.extend({
  layoutTemplate: 'dashboard_images_layout',
  data: function () {
    return Images.findOne({_id: this.params.id});
  }
});

Router.map(function () {

  this.route('setup_intro', {
    path: '/setup/intro',
    controller: 'SetupController'
  });

  this.route('setup_install', {
    path: '/setup/install',
    controller: 'SetupController'
  });

  this.route('setup', {
    path: '/',
    controller: 'SetupController',
    action: function () {
      if (this.ready()) {
        var install = Installs.findOne();
        if (!install) {
          console.log('No installs detected, running installer again.');
          this.redirect('/setup/intro');
        } else {
          startFixInterval();
          this.redirect('/apps');
        }
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
