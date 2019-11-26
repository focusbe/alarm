const sudo = require("sudo-prompt");
const path = require('path');
const ipcRenderer = require("electron").ipcRenderer;
const volumsControl = require("osx-volume-controls");
const $ = require('jquery');
var constraints = {
    audio: false,
    video: {
        width: 128,
        height: 72
    }
};
function checkCameraisok(cb) {
    if (!cb) {
        cb = function () { }
    }
    navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
        //console.log(mediaStream);
        cb(mediaStream);
    }).catch(function () {
        cb(false);
    });
}
var Pmset = {
    disableSleep: function (cb) {
        if (!cb) {
            cb = function () { };
        }
        sudo.exec('pmset -a disablesleep 1 && pmset displaysleepnow', {
            name: 'Alarm',
            icns: path.resolve(__dirname, "../assets/alarmLogo.icns")
        }, function (code, stdout, stderr) {
            // console.log(code);
            cb(!code);
        });
    },
    enableSleep: function (cb) {
        if (!cb) {
            cb = function () { };
        }
        sudo.exec('pmset -a disablesleep 0', {
            name: 'Alarm',
            icns: path.resolve(__dirname, "../assets/alarmLogo.icns")
        }, function (code, stdout, stderr) {
            console.log(code);
            cb(!code);
        });
    }
}
var Render = {
    status: 0,
    checkClock: null,
    init: function () {
        this.bind();
        this.setStatus();
    },
    bind: function () {
        var self = this;
        $(".openbtn").click(() => {
            this.openAlert();
        });
        $(".closebtn").click(() => {
            this.closeAlert();
        });
        ipcRenderer.on('powerMonitor', (event, status) => {
            switch (status) {
                case 'resume':
                case 'unlock':
                    this.closeAlert();
                    break;
            }
        });
    },
    openAlert() {
        if (this.status == 1) {
            return;
        }
        if (confirm('需要摄像头权限\n请不要合上盖子\n请拔掉耳机\n请连接电源\n在接下来的弹窗中输入管理员密码，\n如果显示器变黑表示开启成功')) {
            checkCameraisok(function(bool){
                if(!bool)
                {
                    alert('请容许程序访问摄像头');
                    return;
                }
                Pmset.disableSleep((bool) => {
                    if (bool) {
                        if (!!this.checkClock) {
                            clearInterval(self.checkClock);
                        }
                        volumsControl.set(0);
                        this.checkClock = setInterval(() => {
                            // console.log('checking');
                            checkCameraisok((bool) => {
                                if (!bool) {
                                    //合上盖子了，应该发出警报;
                                    if (!this.jingbao) {
                                        this.jingbao = document.createElement('audio');
                                        this.jingbao.loop = true;
                                        this.jingbao.src = './sounds/baojing.mp3';
                                    }
                                    this.jingbao.play();
                                    volumsControl.set(10);
                                    setTimeout(() => {
                                        if (this.status == 1) {
                                            volumsControl.set(100);
                                            setTimeout(() => {
                                                if (this.status == 1) {
                                                    volumsControl.set(50);
                                                    setTimeout(() => {
                                                        if (this.status == 1) {
                                                            volumsControl.set(100);
                                                        }
                                                    }, 5000);
                                                }
                                            }, 5000);
                                        }
                                    }, 5000);
                                    clearInterval(this.checkClock);
                                    this.checkClock = null;
                                }
                            });
                        }, 1000);
    
                        this.status = 1;
                        this.setStatus();
                    }
                    else {
                        alert('开启失败');
                    }
                });
            });
            
        }
    },
    closeAlert(cb) {
        // if (this.status == 0) {
        //     return;
        // }
        if (!cb) {
            cb = function () { }
        }
        Pmset.enableSleep((bool) => {
            cb(bool);
            if (bool) {
                this.status = 0;
                this.setStatus();
                if (!!this.checkClock) {
                    clearInterval(this.checkClock);
                    this.checkClock = null;
                }
                if (!!this.jingbao) {
                    this.jingbao.pause();
                }
                window.location.reload();
            }
            else {
                alert('关闭失败');
            }
        });

    },
    setStatus() {
        var text = !this.status ? '关闭' : '开启';
        var color = !this.status ? 'green' : 'red';
        $(".curstatus").html(text).css({
            color: color
        });
    }
}
Render.init();
// Pmset.disableSleep();