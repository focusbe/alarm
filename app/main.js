const { ipcMain, app, BrowserWindow, powerMonitor } = require('electron')
const sudo = require("sudo-prompt");
const path = require("path");
const url = require("url");
const os = require("os");
const tencentcloud = require("tencentcloud-sdk-nodejs");
const SmsClient = tencentcloud.sms.v20190711.Client;
const models = tencentcloud.sms.v20190711.Models;
const Credential = tencentcloud.common.Credential;
const ClientProfile = tencentcloud.common.ClientProfile;
const HttpProfile = tencentcloud.common.HttpProfile;
let cred = new Credential("AKIDFJ7h2BWr7BzYsxIR1QcZGj13qX2Iw4bu", "FKH1Wlmb9XgkdGdleIm3FF0VlnaJqLdg");
let httpProfile = new HttpProfile();
httpProfile.endpoint = "sms.tencentcloudapi.com";
let clientProfile = new ClientProfile();
clientProfile.httpProfile = httpProfile;
let client = new SmsClient(cred, "ap-shanghai", clientProfile);
const Elspy = require("../libs/elspy");

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
    },
    // checkSms(cb) {

    // },
    checkSms: function (code, cb) {
        var res = !!code && code == this.smscode ? this.curphone : false;
        cb(res);
    },
    sendAlarm(phone, cb) {
        var computername = '';
        // console.log('computername' + computername);
        let req = new models.SendSmsRequest();
        let params = '{"PhoneNumberSet":["' + phone + '"],"TemplateID":"497287","Sign":"FOCUSBE","TemplateParamSet":["' + computername + '"],"SmsSdkAppid":"1400294742"}'
        req.from_json_string(params);
        client.SendSms(req, function (errMsg, response) {
            if (errMsg) {
                cb(false, errMsg);
                return;
            }
            cb(true, response);
        });
    },
    sendSms(phone, cb) {
        if (!cb) {
            cb = function () { };
        }
        // if (!isPoneAvailable(phone)) {
        //     cb(false, "请输入正确的手机号");
        //     return;
        // }
        this.curphone = phone;
        this.smscode = ('000000' + Math.floor(Math.random() * 999999)).slice(-6);
        let req = new models.SendSmsRequest();
        //console.log(this.smscode);
        let params = '{"PhoneNumberSet":["' + phone + '"],"TemplateID":"496908","Sign":"FOCUSBE","TemplateParamSet":["' + this.smscode + '"],"SmsSdkAppid":"1400294742"}'
        req.from_json_string(params);
        client.SendSms(req, function (errMsg, response) {
            if (errMsg) {
                cb(false, errMsg);
                return;
            }
            cb(true, response);
        });
    }
}
Main.init();
Elspy._spy(Main);
function isPoneAvailable($poneInput) {
    var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
    if (!myreg.test($poneInput)) {
        return false;
    } else {
        return true;
    }
}
