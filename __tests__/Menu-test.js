/**
 * Created by thofl on 3/28/2016.
 */
'use strict';
jest.dontMock('../src/menu/MenuFactory');
jest.dontMock('../src/menu/MenuContainer').dontMock('console');
jest.dontMock('../src/menu/OsxLinuxMenuBuilder').dontMock('console');
jest.dontMock('../src/menu/WindowsMenuBuilder').dontMock('console');
jest.setMock('../src/router', require('router'));
jest.setMock('shell',require('shell'));
const MenuFactory = require('../src/menu/MenuFactory');
const machine = require('../src/utils/DockerMachineUtil');
const electron = require('electron');
const remote = electron.remote;
const router = require('../src/router');
const shell = require('shell');


describe('Menu',()=>{
    describe('Base menu Test',()=>{
        it('Should transition to the about page when a user clicks on the about menu item.',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //Kitematic->About Kitematic
            menu[0].submenu[0].click();
            expect(router.get().transitionTo).toBeCalledWith('about')
        });
        it('Should transition to the preferences page when a user clicks on the preference menu item.',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //Kitematic->Preferences
            menu[0].submenu[2].click();
            expect(menu[0].submenu[2].accelerator).toEqual('CmdOrCtrl+,');
            expect(router.get().transitionTo).toBeCalledWith('preferences');
        });
        it('Should open a terminal when a user clicks on the preference menu item.',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //File->Open Docker Command Line Terminal
            menu[1].submenu[1].click();
            expect(menu[1].submenu[1].accelerator).toEqual('CmdOrCtrl+Shift+T');
            expect(machine.dockerTerminal).toBeCalled();
        });
        it('Should have hot key and selector for minimizing the window',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //File->Minimize window
            expect(menu[2].submenu[0].accelerator).toEqual('CmdOrCtrl+M');
            expect(menu[2].submenu[0].selector).toEqual('performMiniaturize:');
        });
        it('Should call Close when clicked on, and have an accelerator, and selector',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //File->Close window
            expect(menu[2].submenu[1].accelerator).toEqual('CmdOrCtrl+W');
            menu[2].submenu[1].click();
            expect(remote.hide).toBeCalled();
        });
        it('Should load dev tools when clicked on, and have an accelerator',()=>{
            const menu = MenuFactory.buildMenu('win32');
            //File->View
            expect(menu[3].submenu[0].accelerator).toEqual('Alt+CmdOrCtrl+I');
            menu[3].submenu[0].click();
            expect(remote.toggleDevTools).toBeCalled();

        });
        
        it('Should open up a link to the help site',()=>{
            const menu = MenuFactory.buildMenu('win32');
            menu[4].submenu[0].click()
            expect(shell.openExternal).toBeCalledWith('https://github.com/kitematic/kitematic/issues/new');
        });
    });

    describe('Windows Test',()=>{

    });

    describe('Darwin/Linux testing',()=>{

    });

});