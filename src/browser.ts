import {Promise} from "bluebird";
import {app, BrowserWindow} from "electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import BrowserWindowConstructorOptions = Electron.BrowserWindowConstructorOptions;

process.env.NODE_PATH = path.join(__dirname, "node_modules");
process.env.RESOURCES_PATH = path.join(__dirname, "/../resources");
if (process.platform !== "win32") {
  process.env.PATH = "/usr/local/bin:" + process.env.PATH;
}
let exiting = false;
let size: any = {};
try {
  size = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "size")) as any);
} catch (err) {}

app.on("ready", function() {
  const mainWindow = new BrowserWindow({
    width: size.width || 1080,
    height: size.height || 680,
    minWidth: os.platform() === "win32" ? 400 : 700,
    minHeight: os.platform() === "win32" ? 260 : 500,
    resizable: true,
    frame: false,
    show: false,
  } as BrowserWindowConstructorOptions);

  if (process.env.NODE_ENV === "development") {
      (mainWindow as any).openDevTools({detach: true});
  }

  mainWindow.loadURL(path.normalize("file://" + path.join(__dirname, "index.html")));

  app.on("activate", function() {
    if (mainWindow) {
      mainWindow.show();
    }
    return false;
  });

  if (os.platform() === "win32" || os.platform() === "linux") {
    mainWindow.on("close", function(e) {
      mainWindow.webContents.send("application:quitting");
      if (!exiting) {
        Promise.delay(1000).then(function() {
          mainWindow.close();
        });
        exiting = true;
        e.preventDefault();
      }
    });

    app.on("window-all-closed", function() {
      app.quit();
    });
  } else if (os.platform() === "darwin") {
    app.on("before-quit", function() {
      mainWindow.webContents.send("application:quitting");
    });
  }

  mainWindow.webContents.on("new-window", function(e) {
    e.preventDefault();
  });

  mainWindow.webContents.on("will-navigate", function(e, url) {
    if (url.indexOf("build/index.html#") < 0) {
      e.preventDefault();
    }
  });

  mainWindow.webContents.on("did-finish-load", function() {
    mainWindow.setTitle("Kitematic");
    mainWindow.show();
    mainWindow.focus();
  });
});
