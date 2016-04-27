/**
 * Created by thofl on 3/26/2016.
 */
import electron from 'electron';
const remote = electron.remote;
const app = remote.app;
import MenuContainer from './MenuContainer'


class OsxLinuxMenuBuilder {
    build(menuContainer) {
        menuContainer.pushSubMenu({label: 'Kitematic', subItem: MenuContainer.separator()});
        menuContainer.pushSubMenu({
            label: 'Kitematic',
            subItem: {label: 'Hide Kitematic', accelerator: 'CmdOrCtrl+H', selector: 'hide:'}
        });
        menuContainer.pushSubMenu({
            label: 'Kitematic',
            subItem: {label: 'Hide Others', accelerator: 'CmdOrCtrl+Shift+H', selector: 'hideOtherApplications:'}
        });
        menuContainer.pushSubMenu({
            label: 'Kitematic',
            subItem: {label: 'Show All', selector: 'unhideAllApplications:'}
        });
        menuContainer.pushSubMenu({label: 'Kitematic', subItem: MenuContainer.separator()});
        menuContainer.pushSubMenu({
            label: 'Kitematic',
            subItem: {
                label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: function () {
                    app.quit();
                }
            }
        });

        menuContainer.pushMenu({
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    selector: 'undo:'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    selector: 'redo:'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    selector: 'cut:'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    selector: 'copy:'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:'
                }
            ]
        });

        menuContainer.pushSubMenu({label: 'Window', subItem: MenuContainer.separator()});
        menuContainer.pushSubMenu({
            label: 'Window',
            subItem: {label: 'Bring All to Front', selector: 'arrangeInFront:'}
        });
        menuContainer.pushSubMenu({label: 'Window', subItem: MenuContainer.separator()});
        menuContainer.pushSubMenu({
            label: 'Window', subItem: {
                label: 'Kitematic',
                accelerator: 'Cmd+0',
                click: function () {
                    remote.getCurrentWindow().show();
                }
            }
        });
        return menuContainer;
    };

}

module.exports = OsxLinuxMenuBuilder;