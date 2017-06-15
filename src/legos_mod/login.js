/**
 * 登陆组件
 * @version 20160622
 * @author boatxing
 * @description 登录，支持手Q、微信、精致衣橱两种环境的登陆
 * 判断登陆
 * login.isLogin()  return Boolean
 * login.validateLogin() 会调用后台接口校验登陆态
 *
 * 登录
 * login.login();
 *
 * 测试页面：http://wqs.jd.com/my/login-test.html
 */
define('login', function(require, exports, module) {
    var  _cacheThisModule_;
    /**
     * 判断客户端是否登陆
     */
    exports.isLogin = isLogin;

    /**
     * 调用后台接口校验登陆态
     * @param callback 校验成功后的回调
     */
    exports.validateLogin = function(callback){
        if(!isLogin()){
            callback(false);
            return true;
        }
        validateLogin(callback);
    }

    /**
     * 登陆
     */
    exports.login = login;

    //判断是否登录
    function isLogin(){
        return getWqUin() && getWqSkey();
    }

    /**
     * 调用后台接口校验登陆态
     * @param callback 校验成功后的回调
     */
    function validateLogin(callback){
        window.validateLoginCallback = function(data){
            callback(data.iRet != 9999)
        }

        JD.sendJs("//wq.jd.com/mlogin/wxv3/LoginCheckJsonp?callback=validateLoginCallback&_t=" + Math.random());
    }

    /**
     * 登陆
     * @param opt: bj 是否调用北京登陆接口  env 微信or手Q  rurl 回跳链接
     */
    function login(opt){
        var option = {
            env: getEnv(), //wx,qq,h5
            scope:false,  //是否进行授权
            rurl:location.href //回跳链接
        };
        for(var i in opt){
            option[i] = opt[i];
        }
        //检查不合法回跳链接
        if(!/^\/\/|^http(?:s?):\/\//.test(option.rurl)){
            option.rurl = location.href;
        }
        //回跳链接加上http或者https头部
        option.rurl = option.rurl.replace(/^http(?:s?):\/\//, "//");
        option.rurl = location.protocol + option.rurl;

        //微信登录
        if(option.env == "weixin"){
            var rurl = "//wq.jd.com/mlogin/wxv3/login_BJ?rurl=" +encodeURIComponent(option.rurl)+"&appid=1" + (option.scope ? "&scope=snsapi_userinfo" : "");
            location.href = rurl;

            //防止登陆跳转失败
            setTimeout(function(){
                location.href = rurl;
            }, 1000)
            return true;
        }
        else if(window.WQAPI && option.env == "ycapp"){
            WQAPI.user.login(function(){
                if(option.rurl){
                    if(option.rurl == location.href) {
                        location.reload();
                    }
                    else{
                        location.href = option.rurl.replace(/^http(s?):/,"");
                    }
                }
            });
        }
        //京东APP
        else if(option.env == "jdapp"){
            var rurl = "//wq.jd.com/mlogin/mpage/Login?rurl="+encodeURIComponent(option.rurl);
            location.href = rurl;
            //防止登陆跳转失败
            setTimeout(function(){
                location.href = rurl;
            }, 1000);
        }
        else{
            var rurl = "//wq.jd.com/mlogin/h5v1/cpLogin_BJ?rurl="+encodeURIComponent(option.rurl);
            location.href = rurl;
            //防止登陆跳转失败
            setTimeout(function(){
                location.href = rurl;
            }, 1000);
        }
    }

    function getWqUin(){
        return getCookie("wq_uin");
    }

    function getWqSkey(){
        return getCookie("wq_skey");
    }

    function getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"), val = document.cookie.match(reg);
        return val ? (val[2] ? unescape(val[2]) : "") : null;
    }

    function getEnv() {
        var ua = navigator.userAgent.toLowerCase();
        if (/micromessenger(\/[\d\.]+)*/.test(ua)) {
            return "weixin";
        } else if (/qq\/(\/[\d\.]+)*/.test(ua) || /qzone\//.test(ua)) {
            return "qq";
        } else if (/jzyc/.test(ua)) {
            return "ycapp";
        } else if(/jdapp;/.test(ua)) {
            return "jdapp";
        } else {
            return "h5";
        }
    }
});
