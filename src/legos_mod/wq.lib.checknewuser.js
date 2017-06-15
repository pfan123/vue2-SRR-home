//判断是否新用户
define("wq.lib.checknewuser", function(require, exports) {
    var ls = require("./loadJs"),
        _cacheThisModule_ = '',
        CONST_EVENT_CGI = "event_cgi_newuser",
        CONST_NEW_USER_KEY = "senior_user",
        CONST_JD_VIP_KEY = "vip_user",
        CONST_NEW_USER = "//wq.jd.com/mcoss/checknewusr/checkisnewuser?callback=checkIsNew",
        CONST_JD_LEVEL = "//wq.jd.com/user/info/QueryJDUserInfo?sceneid=30672&callback=QueryJDUserInfo";


    function checkJDVip(opt, callback) {
        var isVip, isDiamondVip, isGoldVip, serverError = true;
        var url = CONST_JD_LEVEL;
        if (window.GLOBAL_CHECKNEWUSER == "0") {
            callback && callback({
                "retcode": 0,
                "msg": "success.",
                "definePin": 0,
                "userFlag": 1,
                "orderFlag": 1,
                "isLongPwdActive": 1,
                "isShortPwdActive": 0,
                "base": {
                    "TipUrl": "http://wqs.jd.com/my/accountv2.shtml?sceneid=30672&state=0&rurl=http://preview.wqs.jd.com/event/juhui/bzmtest2/index.shtml",
                    "levelName": "银牌用户",
                    "userLevel": 61,
                    "nickname": "jd_Jackyfang",
                    "curPin": "",
                    "jdNum": "",
                    "mobile": "",
                    "headImageUrl": "",
                    "accountType": 0
                }
            }, 0);
            return;
        }
        window.QueryJDUserInfo = function(data) {
            serverError = false;
            if (data.retcode == 13) {
                //login.login(); 
            } else if (data.retcode != 0) {
                // showError();
            } else {


                if (data.base && data.base.userLevel) {
                    JD.store.setItem(CONST_JD_VIP_KEY, data, 5, function(a, b) {}, 'wqs.jd.com')
                    callback && callback(data, data.base.userLevel)
                }
            }
        };


        ls.loadScript({

            url: CONST_JD_LEVEL + "&t=" + Math.random(),
            isToken: true
        });



    }

    function checkNewUser(cb) {
        var isRongzai = window.GLOBAL_CHECKNEWUSER == "0" ? true : false;
        if (JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT) {
            //结果已经返回，直接使用
            cb && cb(JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT);
        } else {
            //加入监听队列wq.
            JD.events.listen(CONST_EVENT_CGI, function(obj) {
                cb && cb(obj);
            });
            if (JD.GLOBAL_CONFIG.CGI_NEWUSER_RUN) {
                return;
            }
            JD.GLOBAL_CONFIG.CGI_NEWUSER_RUN = true;
            window.checkIsNew = function(data) {
                //如果是老用户，多设置一些时间
                if (data && data.retcode == 0 && data.newuserflag == "0") {

                    JD.store.setValue(CONST_NEW_USER_KEY, data, 60 * 24 * 30); //老用户保存1个月

                }
                JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT = data;
                JD.events.trigger(CONST_EVENT_CGI, data);
            };
            //容灾特殊处理，不需要调用，按照老用户处理
            if (isRongzai) {
                window.checkIsNew({
                    "retcode": "0",
                    "errmsg": "CheckIsNewUser:invoke succ",
                    "newuserflag": "0"
                });
            } else {
                ls.loadScript({
                    url: CONST_NEW_USER + "&t=" + Math.random(),
                    isToken: false
                });
            }



        }

    }
    //回调方法
    exports.isNewUser = function(cb, isRongzai) {
    

        JD.store.getValue(CONST_NEW_USER_KEY, function(key, obj) {
            //如果有缓存，优先缓存数据
            if (obj) {
                cb && cb(obj);
            } else {
                checkNewUser(cb);
            }
        });


    };
    //回调方法
    exports.getJDVip = function(opt, callback) {

        JD.store.getItem(CONST_JD_VIP_KEY, function(key, data) {

            if (data && data.base && data.base.userLevel) {
                callback && callback(data, data.base.userLevel)
            } else {
                checkJDVip({}, callback)
            }
        }, "wqs.jd.com")



    };



});