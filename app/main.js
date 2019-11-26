const { ipcMain, app, BrowserWindow, powerMonitor } = require('electron')
const sudo = require("sudo-prompt");
const path = require("path");
const url = require("url");
var Main = {
    init: function () {
        var self = this;
        this.createWin();
        ipcMain.on('callFun', function (event, name, data) {
            if (!name) {
                return;
            }
            if (!data) {
                data = null;
            }
            self[name](data);
        });
    },
    createWin: function () {
        app.on('ready', () => {
            let win = new BrowserWindow({
                width: 400, height: 400,
                frame: false,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            var renderhtml = url.format({
                pathname: path.join(__dirname, "../renderer/index.html"),
                protocol: "file",
                slashes: true
            });
            win.loadURL(renderhtml);
            //win.webContents.openDevTools();
            powerMonitor.on('resume', function () {
                win.webContents.send('powerMonitor', 'resume');
            });
            powerMonitor.on('suspend', function () {
                win.webContents.send('powerMonitor', 'sleep');
            });
            powerMonitor.on('lock-screen', function () {
                win.webContents.send('powerMonitor', 'lock');
            });
            powerMonitor.on('unlock-screen', function () {
                win.webContents.send('powerMonitor', 'unlock');
            });
        })
        app.on('will-quit', function (e) {
            // console.log('will quit');
            //e.preventDefault();
        });
    },
    disableSleep: function () {
        sudo.exec('pmset -a disablesleep 1', {
            name: 'Fangdao',
            icns: path.resolve(__dirname, "./assets/norecode.icns")
        }, function (code, stdout, stderr) {
            console.log(code);
        });
    },
    enableSleep: function () {
        sudo.exec('pmset -a disablesleep1 0', {
            name: 'Fangdao',
            icns: path.rsolve(__dirname, "./assets/norecode.icns")
        }, function (code, stdout, stderr) {
            console.log(code);
        });
    }
}
Main.init();