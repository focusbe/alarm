const { ipcMain, ipcRenderer } = require('electron');
var Elspy = {
    _cbFuns: {},
    _spy(Obj) {
        var self = this;
        if (!!ipcMain) {
            this.obj = Obj;
            ipcMain.on('_callMainfun', function (ipc, key, arum) {
                for (var i in arum) {
                    if (!!arum[i]&&arum[i].toString().indexOf('-fun-:') > -1) {
                        var cbid = arum[i].replace('-fun-:', '');
                        arum[i] = function (...params) {
                            ipc.sender.webContents.send('_callback', cbid, params);
                        }
                    }
                }
                Obj[key](...arum);
            });
        }
        else {
            ipcRenderer.on('_callback', function (sender, cbid, params) {
                //console.log(cbid);
                //console.log(params);
                self._cbFuns[cbid]['fun'](...params);
            })
        }
    },
    _callMainFun(key) {
        //console.log(key);
        var self = this;
        return function (...arum) {
            //console.log(...arum);
            for (var i in arum) {
                if (typeof (arum[i]) == 'function') {
                    var id = this._getrandomid();
                    self._cbFuns[id] = { fun: arum[i], env: this };
                    arum[i] = '-fun-:' + id;
                }
            }
            ipcRenderer.send('_callMainfun', key, arum);
        }
    },
    _getrandomid() {
        return Number(Math.random().toString().substr(3, length) + Date.now()).toString(36);
    }
};
if (!!ipcRenderer) {
    Elspy._spy();
}
var elproxy = new Proxy(Elspy, {
    get(target, key, value) {
        if (!!target[key]) {
            return target[key];
        }
        else {
            return target['_callMainFun'](key);
        }
    }
});
var exportEl = !!ipcMain ? Elspy : elproxy;
module.exports = exportEl;