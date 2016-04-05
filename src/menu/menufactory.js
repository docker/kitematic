/**
 * Created by thofl on 3/26/2016.
 */
var WindowsMenuBuilder = require('./WindowsMenuBuilder');
var OsxLinuxMenuBuilder = require('./OsxLinuxMenuBuilder');
var MenuContainer = require('./MenuContainer');

//private method for handling the creation of the menu builder instance.
const createMenuBuilder = function(operatingSystem){
    if(operatingSystem === 'win32'){
        return new WindowsMenuBuilder();
    }else {
        return new OsxLinuxMenuBuilder();
    }
};

class MenuFactory{
    static buildMenu(operatingSystem){
        const menuContainer = new MenuContainer();
        const menuBuilder = createMenuBuilder(operatingSystem);
        const finalizedMenuContainer = menuBuilder.build(menuContainer);
        return finalizedMenuContainer.getMenu();
    };
}



module.exports = MenuFactory;