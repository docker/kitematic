import remote from 'remote';
var Menu = remote.require('menu');
var Tray = remote.require('tray');
import _ from 'underscore';
import router from './router';
import containerActions from './actions/ContainerActions';

var menubar = {
  appIcon: null,
  init: function (opts) {
    this.appIcon = new Tray(__dirname + '/menuicon.png');
    this.appIcon.setToolTip('Kitematic menu');
  },
  remove: function () {
    this.appIcon.destroy();
  },
  update: function (containers) {
    //console.log('Menu Containers: %o', containers);
    var containerMenu = [];
    _.mapObject(containers, (container) => {
      var state;
      var submenu = [
        {
          label: 'Settings',
          click: function () {
            remote.getCurrentWindow().show();
            router.get().transitionTo('containerSettings', {name: container.Name});
          },
        },
        {
          type: 'separator'
        }
      ];
      var start = {
        label: 'Start',
        click: function () {
          containerActions.start(container.Name);
        }
      };
      var stop = {
        label: 'Stop',
        click: function () {
          containerActions.stop(container.Name);
        }
      }
      var restart = {
        label: 'Restart',
        click: function () {
          containerActions.restart(container.Name);
        }
      }
      if (!(container.State.Downloading || container.State.Running || container.State.Updating)) {
        submenu.push(start);
      }
      if (!(container.State.Downloading || container.State.ExitCode || !container.State.Running || container.State.Updating)) {
        submenu.push(stop);
      }
      if (!(container.State.Downloading || container.State.Restarting || container.State.Updating)) {
        submenu.push(restart);
      }

      containerMenu.push({
        label: container.Name,
        submenu: submenu
      });
    });
    var contextMenu = Menu.buildFromTemplate(containerMenu);
    this.appIcon.setContextMenu(contextMenu);
  }
};
module.exports = menubar;
