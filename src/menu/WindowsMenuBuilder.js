/**
 * Created by thofl on 3/26/2016.
 */
import _ from 'underscore';
import electron from 'electron';
const remote = electron.remote;

class WindowsMenuBuilder{
    build(menuContainer){
        //Add exit to file 
        menuContainer.pushSubMenu({label: 'File', subItem: {
                label: 'Exit',
                accelerator: 'CmdOrCtrl+W',
                click: function () {
                    remote.getCurrentWindow().close();
                }
        }});

        //Move everything under kitematic to file
        let kitematicMenuItem = menuContainer.findMenu('Kitematic');
        let fileMenuItem = menuContainer.findMenu('File');
        console.log(kitematicMenuItem.submenu);
        kitematicMenuItem.submenu.reverse().forEach((subItem)=>{
            fileMenuItem.submenu.unshift(subItem);
        });
        menuContainer.removeMenu(kitematicMenuItem);

     
        //Add additional info to help menu, may be useful for OSX as well?
        menuContainer.pushSubMenu({label: 'Help', subItem: {
            label:"Online Documentation", 
            click:()=>{shell.openExternal('https://docs.docker.com/kitematic/userguide/')}}
        });
        menuContainer.pushSubMenu({label:'Help',subItem:{
            label:"Online Feedback", click:()=>{shell.openExternal('https://forums.docker.com/c/open-source-projects/kitematic')}}
        });

        return menuContainer;
    }
}
module.exports = WindowsMenuBuilder;