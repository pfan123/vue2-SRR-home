/**
 * [实名认证:先要判断是否绑定京东pin，如果没有要先绑定，再去判断是否实名]
 */
define('wg.market.2016certification', function(require, exports, module) {
    var login = require("./login");
    var debug = require("./wg.debug");

    var env = JD.device.scene;


    var _option = {
      callback: function() {},
      bussinessType: 63,
      sceneid: 3
    };


    /**
     * [查询用户信息]
     * @return {[type]} [description]
     */
    function queryUserInfo() {
      var cgi = "http://wq.jd.com/pinbind/getpinflw?rurl=" + encodeURIComponent(location.href) + "&sceneid=" + _option.sceneid + "&callback=callbackGetpinflw";
      debug.loadScript({
        success: function(data) {
          var retcode = data.errcode;
          if(retcode === 1001) {
            login.login();
          } else {
            if (data.state == 1) {
                if (data.url.indexOf("?") < 0) {
                    data.url = data.url + "?returnout=1";
                } else {
                    data.url = data.url + "&returnout=1";
                }
            }
            if([1, 2, 3, 4].indexOf(data.state) != -1) {
              location.href = data.url;
              return;
            } else {
              queryCertification();
            }
          }
        },
        degrade: {ret: 666, msg: "超时"},
        cbname: "callbackGetpinflw",
        retry: 1,
        timeout: 5000,
        url: cgi
      });
    }

    /**
     * [查询用户是否已经实名认证了]
     * @param  {Function} callback [回调方法]
     */
    function queryCertification() {
      var cgi = "http://wq.jd.com/vipplus/VerifyAuthUser?callback=queryCertificationBack";
      debug.loadScript({
        success: function(data) {
          var retcode = data.retcode;
          if(retcode === 13) {
            login.login();
          } else if (retcode === 0) {
            if(data.status === 1) {
              _option.callback(true);
            } else {
              loginBrigdeAuthName();
            }
          } else {
            _option.callback({msg: "查询用户实名认证错误！"});
          }
        },
        degrade: {ret: 666, msg: "超时"},
        cbname: "queryCertificationBack",
        retry: 1,
        timeout: 5000,
        url: cgi
      });
    }

    /**
     * [实名认证登陆态打通接口]
     */
    function loginBrigdeAuthName() {
      var cgi = "http://wq.jd.com/vipplus/LoginBrigdeAuthName?callback=loginBrigdeBack&scene=" + env + "&bussinessType=" + _option.bussinessType + "&rurl=" + encodeURIComponent(location.href);
      debug.loadScript({
        success: function(data) {
          var retcode = data.retcode;
          if(retcode === 13) {
            login.login();
          } else if (retcode === 0) {
            location.href = data.redirect;
            return;
          } else if (retcode === 45) {
            _option.callback(true);
          } else {
            _option.callback({msg: "实名认证失败！"});
          }
        },
        degrade: {ret: 666, msg: "超时"},
        cbname: "loginBrigdeBack",
        retry: 1,
        timeout: 5000,
        url: cgi
      });
    }

    //对外提供的接口
    function approve(option) {
      for (var key in option) {
        _option[key] = option[key];
      }

      queryUserInfo();

    }



    exports.approve = approve;

});
