const { ipcMain, app, BrowserWindow, powerMonitor } = require('electron');
const sudo = require('sudo-prompt');
const path = require('path');
const url = require('url');
const axios = require('axios');
const ApiUrl = 'http://localhost:8801';
require('@electron/remote/main').initialize();
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
                width: 800,
                height: 400,
                frame: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true,
                },
            });

            var renderhtml = url.format({
                pathname: path.join(__dirname, '../renderer/index.html'),
                protocol: 'file',
                slashes: true,
            });
            win.loadURL(renderhtml);
            if (__dirname.indexOf('asar') < 0) {
                win.webContents.openDevTools();
            }
            require('@electron/remote/main').enable(win.webContents);
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
            // this.sendAlarm('+8618602174183');
        });
        app.on('will-quit', function (e) {
            // console.log('will quit');
            //e.preventDefault();
        });
    },
    disableSleep: function () {
        sudo.exec(
            'pmset -a disablesleep 1',
            {
                name: 'Fangdao',
                icns: path.resolve(__dirname, './assets/norecode.icns'),
            },
            function (code, stdout, stderr) {
                console.log(code);
            }
        );
    },
    enableSleep: function () {
        sudo.exec(
            'pmset -a disablesleep1 0',
            {
                name: 'Fangdao',
                icns: path.rsolve(__dirname, './assets/norecode.icns'),
            },
            function (code, stdout, stderr) {
                console.log(code);
            }
        );
    },
    checkSms: async function (code, cb) {
        if (!this.phone) {
            cb(false);
        }
        try {
            const res = await axios({
                method: 'post',
                url: `${ApiUrl}/sms/verifycode`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                data:
                    'phone=' +
                    encodeURIComponent(this.phone) +
                    '&code=' +
                    encodeURIComponent(code),
            });
            if (res && res.data && res.data.data) {
                cb(this.phone);
            } else {
                cb(false);
            }
        } catch (error) {
            console.log(error);
            cb(false);
        }
    },
    async sendAlarm(phone, cb = () => {}) {
        var computername = '';
        try {
            const res = await axios({
                method: 'post',
                url: `${ApiUrl}/sms/sendsms`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                data:
                    'phone=' +
                    encodeURIComponent(phone) +
                    '&type=' +
                    encodeURIComponent('alarm') +
                    '&params=' +
                    encodeURIComponent(JSON.stringify([computername])),
            });
            if (res && res.data && res.data.data) {
                cb(true);
            } else {
                cb(false);
            }
        } catch (error) {
            console.log(error);
            cb(false);
        }
    },
    async sendSms(phone, cb = () => {}) {
        try {
            const res = await axios({
                method: 'post',
                url: `${ApiUrl}/sms/sendcode`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                data: 'phone=' + encodeURIComponent(phone),
            });
            if (res && res.data && res.data.data) {
                this.phone = phone;
                cb(true);
            } else {
                cb(false);
            }
        } catch (error) {
            console.log(error);
            cb(false);
        }
    },
};
Main.init();
global.Main = Main;

function isPoneAvailable($poneInput) {
    var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
    if (!myreg.test($poneInput)) {
        return false;
    } else {
        return true;
    }
}
