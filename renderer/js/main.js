const sudo = require("sudo-prompt");
const path = require('path');
const ipcRenderer = require("electron").ipcRenderer;
const volumsControl = require("osx-volume-controls");
const $ = require('jquery');
const remote = require('electron').remote;
const Main = remote.getGlobal('Main');
var oldVolum;
volumsControl.volumeState(function (err, volume) {
    oldVolum = volume;
});
// Main.sendAlarm('+8618602174183',function(bool,res){
//     console.log(res);
// });
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
            // console.log(code);
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
        this.getPhone();
    },
    getPhone() {
        var binedephone = window.localStorage.getItem('phonenum');
        $('.binedephone').html(binedephone);
        //console.log(binedephone);
        return binedephone;
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
        $(".bindphone").click(function () {
            $(".binform").show();
            $(".yourphone").hide();
        });
        $(".cancle_btn").click(function () {
            $(".binform").hide();
            $(".yourphone").show();
        });

        $(".sendsms").click(function () {
            if ($(this).hasClass('disable')) {
                return;
            }
            var contrycode = $("#contrycode").val();
            var phone = $("#phonenum").val();
            if (!phone || (contrycode == '+86' && !isPoneAvailable(phone))) {
                alert('请输入正确的手机号');
                return;
            }
            $(this).addClass('disable');
            var time = 60;
            $(this).attr('oldhtml', $(this).html());
            $(this).html(time + 'S');
            var clock = setInterval(() => {
                time--;
                if (time <= 0) {
                    $(this).removeClass('disable');
                    clearInterval(clock);
                    $(this).html($(this).attr('oldhtml'));
                }
                else {
                    $(this).html(time + 'S');
                }
            }, 1000);
            Main.sendSms(contrycode + phone, function (bool, res) {
                if (!bool || !res || res.SendStatusSet[0].Code != 'Ok') {
                    alert('发送失败');
                    clearInterval(clock);
                    $(".sendsms").removeClass('disable').html($(".sendsms").attr('oldhtml'));
                }
                else{
                    alert('发送成功');
                }
                console.log(res);
            });
            //ipcRenderer.send('callFun', 'sendSms', contrycode + '18602174183');
        });
        $(".binform")[0].onsubmit = function () {
            //var contrycode = $("#contrycode").val();
            // var phone = $("#phonenum").val();
            var smscode = $(".smscode").val();
            if (!smscode) {
                alert('请输入短信验证码');
                return false;
            }
            Main.checkSms(smscode, function (phone) {
                if (!!phone) {
                    window.localStorage.setItem('phonenum', phone);
                    self.getPhone();
                    $(".cancle_btn").click();
                }
                else {
                    alert('验证码失败');
                }
            });
            return false;
        };
    },
    openAlert() {
        if (this.status == 1) {
            return;
        }
        if (confirm('需要摄像头权限\n请不要合上盖子\n请拔掉耳机\n请连接电源\n在接下来的弹窗中输入管理员密码，\n如果显示器变黑表示开启成功')) {
            checkCameraisok((bool) => {
                if (!bool) {
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
                                    Jingbao.start();
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
        if (this.status == 0) {
            return;
        }
        if (!cb) {
            cb = function () { }
        }
        var clock = setTimeout(() => {
            Jingbao.start();
        }, 5000);
        Pmset.enableSleep((bool) => {
            clearTimeout(clock);
            cb(bool);
            if (bool) {
                this.status = 0;
                this.setStatus();
                if (!!this.checkClock) {
                    clearInterval(this.checkClock);
                    this.checkClock = null;
                }
                Jingbao.stop();
                window.location.reload();
            }
            else {
                alert('关闭失败');
                Jingbao.start();
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
// Main.sendAlarm(Render.getPhone(), function (bool, res) {
//     console.log(res);
// });
Render.init();
var Jingbao = {
    start() {
        Main.sendAlarm(Render.getPhone(), function (bool, res) {
            console.log(res);
        });
        if (!this.jingbao) {
            this.jingbao = document.createElement('audio');
            this.jingbao.loop = true;
            this.jingbao.src = './sounds/baojing.mp3';
        }
        this.jingbao.play();
        this.curVolum = 10;
        volumsControl.set(this.curVolum);
        this.clock = setInterval(() => {
            var curVolum = this.curVolum += 10;
            if (curVolum >= 80) {
                clearInterval(this.clock);
                return;
            }
            volumsControl.set(curVolum);
        }, 3000);
    },
    stop() {
        if (!!this.clock) {
            clearInterval(this.clock);
        }
        if (!!this.jingbao) {
            this.jingbao.pause();
        }
        volumsControl.set(oldVolum);

    }
}

function isPoneAvailable($poneInput) {
    var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
    if (!myreg.test($poneInput)) {
        return false;
    } else {
        return true;
    }
}
// Pmset.disableSleep();