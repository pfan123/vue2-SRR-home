/**
 * 免费领劵模块
 * @author weiqian
 * @date   2017-02-21
 * @description 
 */
define('wq.data.freedraw', function(require, exports, module) {
    var _cacheThisModule_;
    //依赖组件
    var ajax = require("./ajax");
    var login = require("./login");
    var centificate = require("./wg.market.2016certification");
    var $ = require("zepto");
    var ui = require("./ui");

    /**
     * 免费领劵接口对外方法
     * @author weiqian
     * @date   2017-02-21
     * 
     * *********示例*********
     * http://wq.jd.com/activeapi/obtainjdshopfreecoupon?key=a1af51a3656a48f8ae2e6b69b858e4d3&roleid=5571023&active=tcl222jingquan&scene=14
     * 1.传入的string类型
     * freedraw.drawFreeCoupon("//wq.jd.com/activeapi/obtainjdshopfreecouponv2?key=3e1228ffc3034b4ebbbef34ca0495beb&roleid=5504878", function(data) {
     *    //to do 业务逻辑
     * });
     *
     * 2.传入的obj类型
     *freedraw.drawFreeCoupon({"key":"3e1228ffc3034b4ebbbef34ca0495beb","roleid":"5504878"}, function(data) {
     *    //to do 业务逻辑
     * });
     * *********参数*********
     * @param {Object} cgi 免费领劵链接或者json对象参数
     * @param {Function} callback 回调函数
     * @param {Object} opt 参数
     * {
     *  key:优惠券key,  必填
     *  roleid:优惠券roleid, 必填
     *  active:活动标识, 选填
     *  scene:发券场景  选填
     *  bindscene:拉绑定场景  选填
     *  beforelogin:未登录的回调 选填
     *  overcb:优惠劵领完或者已经领过的的回调 选填
     *  degrade：degrade  选填
     *  manuallyHandle: false//是否手动处理固定的异常返回
     * }
     * @return 
     *     @param {String} code 返回码
     *     @param {String} messege 错误信息
     *     
     */

    exports.drawFreeCoupon = _drawFreeCoupon;

    //空函数
    function noop() {}

    function _drawFreeCoupon(cgi, callback, options) {

        callback = typeof callback === 'function' ? callback : noop;
        //默认参数  to do  dataDefalut    
        var opt = {
            "dataType": "jsonp",
            "beforelogin":noop,//未登录的回调
            "overcb":noop,//优惠劵领完或者已经领过的的回调
            "manuallyHandle": false 
        };
        if (typeof cgi == "string") {
            opt.key = getQuery("key", cgi) || "";
            opt.roleid = getQuery("roleid", cgi) || "";
            opt.active = getQuery("active", cgi) || "";
            opt.scene = getQuery("scene", cgi) || "";
            opt.bindscene = getQuery("bindscene", cgi) || "";
            //传入 object 类型参数  例如 {"key":"3e1228ffc3034b4ebbbef34ca0495beb","roleid":"5504878"}
        } else if (cgi && typeof cgi == "object" && cgi.key && cgi.roleid) {
            opt.key = cgi.key || "";
            opt.roleid = cgi.roleid || "";
            opt.active = cgi.active || "";
            opt.scene = cgi.scene || "";
            opt.bindscene = cgi.bindscene || "";
        }

        //赋值
        for (var k in options) {
            //这里应该判断options[k]是否存在  options[k] "" null
            opt[k] = options[k] || opt[k];
        }

        //参数错误  !opt.key || ! opt.roleid
        if (!(opt.key && opt.roleid)) {
            callback({
                code: 5,
                message: "param error"
            });
            return;
        }

        //发请求
        ajax.load({
            url: "//wq.jd.com/activeapi/obtainjdshopfreecouponv2", //新接口
            data:{
                key: opt.key,
                roleid: opt.roleid,
                active: opt.active,
                scene:opt.scene,
            },
            degrade: opt.degrade,
            globalLock: 1, //加上全局锁
            lockCallback: opt.lockCallback,
            dataType: opt.dataType, //默认是jsonp
            success: function(data) {
                //上报指纹信息
                try {
                    if (typeof wa === 'function') {
                        wa('shDeviceId', {
                            type: 1,
                            activeInfo: {
                                "key": opt.key || "",
                                "roleid": opt.roleid || "",
                                "active": opt.active || ""
                            }
                        });
                    }
                } catch (e) {
                    console.log(e);
                }

                //上报ump信息
                if (data.code == 999) { //正常领到劵
                    JD.report.umpBiz({
                        bizid: "320",
                        operation: "5",
                        result: "0",
                        source: "0",
                        message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
                    });
                } else { //没领到
                    JD.report.umpBiz({
                        bizid: "320",
                        operation: "5",
                        result: "1",
                        source: "0",
                        message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
                    });
                }

                //1. 没登录
                if (data.code == 1000) {
                    if(opt.beforelogin && typeof opt.beforelogin === 'function'){
                        opt.beforelogin(data);
                    }
                    login.login();
                    callback(data);
                    return;
                }

                // 2.没绑定 引导绑定 
                if (!opt.manuallyHandle && data.code == 163) { //
                    _queryBindStatus(function(bindInfo) {
                        ui.alert({
                            showClose: true,
                            msg: "亲，别着急，<br />先完善京东账号的手机号码再来领券！",
                            confirmText: '绑定账号', // 确认按钮文案
                            onConfirm: function() {
                                //点击“绑定账号”时的回调
                                location.href = bindInfo.url || "//wqs.jd.com/my/accountv2.shtml";
                            }
                        });
                        callback(data);
                    }, opt.bindscene);
                    return;
                }

                // 3.没有实名认证   此处直接跳转需要优化
                if(!opt.manuallyHandle && data.code ==34){
                    callback(data); 
                    centificate.approve();
                    return;
                }

                // 4. 其他异常
                if (!opt.manuallyHandle && [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 32].indexOf(data.code) > -1) {
                    //14 15 是之前参加过活动的   16,17是已经领取完的
                    if([14,15,16,17].indexOf(data.code) >-1 && opt.overcb && typeof opt.overcb === 'function'){
                        opt.overcb(data);
                    }
                    //存在固定的异常
                    var _tinfo = "";
                    switch (data.code + "") {
                        case "3":
                            _tinfo = "为了保障您的账户安全， 请前往'在账户安全'开启支付密码再领券！";
                            break;
                        case "5":
                            _tinfo = "貌似领不了哟，看一下其他活动吧~";
                            break;
                        case "6":
                            _tinfo = "没有找到该链接的活动，请您看一下其他活动吧~";
                            break;
                        case "7":
                            _tinfo = "没有找到该链接的活动，请看一下其他活动吧~";
                            break;
                        case "8":
                            _tinfo = "您来太晚了，活动已经结束了哟~";
                            break;
                        case "9":
                            _tinfo = "您来早了，活动还没开始哟，请稍后再来~";
                            break;
                        case "10":
                            _tinfo = "您来早了，今天的活动还未开始哟，请稍后再试~";
                            break;
                        case "11":
                            _tinfo = "您来太晚了，今天活动已经结束了哟，谢谢您的关注~";
                            break;
                        case "12":
                            _tinfo = "您的账户级别稍微有点低，需再接再厉哟~";
                            break;
                        case "13":
                            _tinfo = "貌似有点小问题，请您30秒后再次尝试~";
                            break;
                        case "14":
                            _tinfo = "您已经参加过此活动，别太贪心哟，下次再来~";
                            break;
                        case "15":
                            _tinfo = "您今天已经参加过此活动，别太贪心哟，明天再来~";
                            break;
                        case "16":
                            _tinfo = "此券今日已经被领完，请您明日再来~";
                            break;
                        case "17":
                            _tinfo = "此券已经被领完了，下次记得早点来哟~";
                            break;
                        case "18":
                            _tinfo = "您提交过于频繁，请30秒后再试。";
                            break;
                        case "19":
                            _tinfo = "貌似有点小问题，您可以30秒后再试一下哟~";
                            break;
                        case "21":
                            _tinfo = "您提交的过于频繁，请50秒稍后重试。";
                            break;
                        case "22":
                            _tinfo = "十分抱歉，领券失败了哟，感谢您的参与~";
                            break;
                        case "23":
                            _tinfo = "支付密码现在貌似有点小问题，您可以30秒后再试一下哟~";
                            break;
                        case "24":
                            _tinfo = "貌似有点小问题哟，请您30秒后再次尝试吧~";
                            break;
                        case "25":
                            _tinfo = "貌似有点小问题呀，请您30秒后再次尝试吧~";
                            break;
                        case "32":
                            _tinfo = "活动太火爆，请您一会再来吧！！！";
                            break;
                        // case "34":
                        //     _tinfo = "实名认证用户才可以领取哦~";
                        //     break;
                    }
                    ui.alert({
                        showClose: true,
                        msg: _tinfo
                    });
                    return;
                } 
                //正常领劵返回999   或者要手动处理返回码 opt.manuallyHandle=true  
                callback(data);
    
            },
            error: function(ret) { //ret: timeout|parsererror|error|load|abort
                callback({
                    code: -1,
                    message: "error",
                    data: ""
                });
                //上报error 异常
                JD.report.umpBiz({
                    bizid: "320",
                    operation: "5",
                    result: "1",
                    source: "0",
                    message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + ret
                });
            }
        });
    }


    /**
     * 查询免费劵接口
     * @author weiqian
     * @date   2017-02-21
     * 
     * *********示例:*********
     * freedraw.queryFreeCoupon("http://wq.jd.com/activeapi/queryjdshopfreecouponstatus?rolekeys=1:2|3:3", function(data) {
     *    //to do 业务逻辑 callback调用
     * });
     *
     * freedraw.queryFreeCoupon("http://wq.jd.com/activeapi/queryjdshopfreecouponstatus?rolekeys=1:2|3:3").then(function(data){
     *   //to do 业务逻辑 deferr调用 
     * });
     * 
     * freedraw.queryFreeCoupon(["1:2","3:3"], function(data) {
     *    //to do 业务逻辑  deferr调用   rolekeys 为数组
     * });
     *
     * freedraw.queryFreeCoupon("["1:2","3:3"]).then(function(data){
     *   //to do 业务逻辑  callback调用  rolekeys 为数组
     * });
     *
     * *********参数*********
     * @param {String} rolekeys  传递roleid和加密key   
     * @param {Function} callback 回调函数
     
     * @return 
     *    @param {String} errorCode 返回码
     *    @param {String} errMsg 错误信息
     *    @param {String} jdpin jdpin
     *    @param {String} uin uin
     *    @param {Object} data 
     *     
     */
    exports.queryFreeCoupon = _queryFreeCoupon;

    //外部暴露的函数
    function _queryFreeCoupon(rolekeys, callback, options) {
        var promise = _internalQueryFreeCoupon(rolekeys, options);
        if (typeof callback === 'function') {
            promise.then(callback, callback);
        }
        return promise;
    }
    //内部查询的函数
    function _internalQueryFreeCoupon(rolekeys, options) {
        //默认参数
        var opt = {
            "dataType": "jsonp",
            "manuallyHandle": false
        };
        //赋值
        for (var k in options) {
            //这里应该判断options[k]是否存在
            opt[k] = options[k] || opt[k];
        }

        return $.Deferred(function(deferred) {
            var rolekeysArr = [];
            if (typeof rolekeys == "string") {
                rolekeysArr = rolekeys.split("|");
            } else if (rolekeys instanceof Array && rolekeys.length) {
                rolekeysArr = rolekeys;
            } else { //异常 传参错误 to do 待定  需要做
                deferred.resolve({
                    errorCode: 2,
                    errMsg: "param error",
                    jdpin: "",
                    uin: "",
                    data: {}
                });
                return;
            }
            // 切分数组  30一组
            var keyChunks = chunk(rolekeysArr, 30);
            //请求函数列表  [[id..], [id..]]  => [promise, promise]
            var promiseList = keyChunks.map(function(rolekeysList) {
                return _queryfree30(opt, rolekeysList);
            });
            //发送请求
            $.when.apply($, promiseList).then(function() {
                var result = {};
                $.each(arguments, function(idx, response) {
                    //合并对象  to do 这里合并有坑会存在覆盖的问题  记得要改
                    $.extend(true, result, response);
                });
                deferred.resolve(result);
            }, function() {
                // do somthing
            });
        }).promise();
    }

    function _queryfree30(opt, queryRoleKey) {
        return $.Deferred(function(deferred) {
            ajax.load({
                url: "//wq.jd.com/activeapi/queryjdshopfreecouponstatus?rolekeys=" + queryRoleKey.join("|"), //新接口
                degrade: opt.degrade,
                dataType: opt.dataType, //默认是jsonp
                success: function(data) {
                    //上报ump信息
                    if (data.errorCode == 0 || data.errorCode == 1) { //正常查询到
                        JD.report.umpBiz({
                            bizid: "320",
                            operation: "6",
                            result: "0",
                            source: "0",
                            message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
                        });
                    } else { //没查到
                        JD.report.umpBiz({
                            bizid: "320",
                            operation: "6",
                            result: "1",
                            source: "0",
                            message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
                        });
                    }
                    // errorCode: [0 成功]  [1 未登录]  [2 参数错误] [-1 查询失败]
                    if (data.errorCode == 0) {
                        deferred.resolve(data);
                    } else if (data.errorCode == 1) { //没登录
                        login.login();
                    }
                },
                error: function(ret) { //ret: timeout|parsererror|error|load|abort
                    //上报error 异常
                    JD.report.umpBiz({
                        bizid: "320",
                        operation: "6",
                        result: "1",
                        source: "0",
                        message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + ret
                    });
                    deferred.resolve({
                        errorCode: 1,
                        errMsg: "query error",
                        jdpin: "",
                        uin: "",
                        data: {}
                    });
                }
            })
        });
    }
    //切分数组 30个一组
    function chunk(array, size) {
        var length = array ? array.length : 0;
        if (!length || size < 1) {
            return [];
        }
        var index = 0;
        var result = [];
        while (index < length) {
            result.push(array.slice(index, index += size));
        }
        return result;
    }
    //合并对象
    function extend(o, n) {
        for (var p in n) {
            if (n.hasOwnProperty(p) && (!o.hasOwnProperty(p)))
                o[p] = n[p];
        }
    }

    //获取cgi的参数
    function getQuery(name, url) {
        var u = arguments[1] || window.location.search,
            reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"),
            r = u.substr(u.indexOf("\?") + 1).match(reg);
        return r != null ? r[2] : "";
    }



    /**
     * 查询用户是否绑定
     * @author weiqian
     * @date   2017-02-27
     * 
     * *********示例:*********
     * freedraw.queryBindStatus(function(data) {
     *    //to do 业务逻辑 callback调用
     * },sceneid);
     *
     *
     * *********参数*********
     * @param {String} sceneid  绑定场景id  选填 
     * @param {Function} callback 回调函数
     */
    exports.queryBindStatus = _queryBindStatus;

    function _queryBindStatus(callback, sceneid) {
        var cgi = "//wq.jd.com/pinbind/getpinflw?rurl=" + encodeURIComponent(location.href) + (sceneid ? ("&sceneid=" + sceneid) : "");
        ajax.load({
            url: cgi,
            dataType: 'jsonp',
            timeout: 3,
            success: function(data) {
                if (data.state == 0 || (data.state == 3 && data.url == "")) { //绑定的
                    data.isBind = true;
                } else { //没绑定
                    data.isBind = false;
                }
                callback && callback(data);
            },
           
            error: function(ret) {
                //错了就默认进账号管理页面
                callback && callback({
                    errcode: "1002",
                    errmsg: "query ajax error",
                    state: "",
                    pin: "",
                    isBind: false,
                    url: "//wqs.jd.com/my/accountv2.shtml"
                });
            }
        });
    }
});


// 计数的方法处理起来太麻烦  废弃
// function _queryFreeCoupon(rolekeys, callback, options){
//      //兼容deffer和普通的
//      var dfd = $.Deferred();
//      //要查询的数组
//      var rolekeysArr = [];
//      //默认参数
//      var opt = {
//          "dataType": "jsonp",
//          "manuallyHandle": false
//      };
//      //赋值
//      for (var k in options) {
//          //这里应该判断options[k]是否存在
//          opt[k] = options[k] || opt[k];
//      }
//      //入参判断处理
//      if (typeof rolekeys == "String") { //如果传进来的是字符串
//          rolekeysArr = rolekeys.split("|");
//      } else if (typeof rolekeys == "object") { //如果传进来的是数组
//          rolekeysArr = rolekeys;
//      } else { //异常 传参错误 to do 待定  需要做
//          var errRes = {
//              "errorCode": 2,
//              "errMsg": "param error",
//              "jdpin": "",
//              "uin": "",
//              "data": ""
//          };
//          dfd.resolve(errRes);
//          callback && callback(errRes);
//          return dfd.promise();
//      }
//      //如果传进来的是数组
//      var flagCout = Math.ceil(rolekeysArr.length / 30);
//      var resultData;
//      //处理多条请求
//      for (var i = 0; i < flagCout; i++) {
//          _queryfree30(rolekeysArr.slice(i * 30, (i + 1) * 30).join("|"));
//      }
//      return dfd.promise();

//      //查询免费劵
//      function _queryfree30(queryRoleKey) {

//          //发请求
//          ajax.load({
//              url: "//wq.jd.com/activeapi/queryjdshopfreecouponstatus?rolekeys=" + queryRoleKey, //新接口
//              degrade: opt.degrade,
//              //globalLock: 1, //加上全局锁  此处待定需要修改  to do
//              //lockCallback: opt.lockCallback,
//              dataType: opt.dataType, //默认是jsonp
//              success: function(data) {
//                  //上报ump信息
//                  if (data.errorCode == 0 || data.errorCode == 1) { //正常查询到
//                      JD.report.umpBiz({
//                          bizid: "320",
//                          operation: "6",
//                          result: "0",
//                          source: "0",
//                          message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
//                      });
//                  } else { //没查到
//                      JD.report.umpBiz({
//                          bizid: "320",
//                          operation: "6",
//                          result: "1",
//                          source: "0",
//                          message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + data.code
//                      });
//                  }
//                  // errorCode: [0 成功]  [1 未登录]  [2 参数错误] [-1 查询失败] 
//                  if (data.errorCode == 0) {
//                      if (typeof resultData == "undefined") { //多次请求的第一次请求 赋值
//                          resultData = data;
//                      } else { //不是第一次请求了  合并对象
//                          extend(resultData.data, data.data);
//                      }
//                  } else if (data.errorCode == 1) { //没登录
//                      login.login();
//                  }
//                  //减除计数
//                  if ((--flagCout) == 0) {
//                      dfd.resolve(resultData);
//                      callback && callback(resultData);
//                  }
//              },
//              error: function(ret) { //ret: timeout|parsererror|error|load|abort
//                  //减去技术
//                  --flagCout;
//                  //上报error 异常
//                  JD.report.umpBiz({
//                      bizid: "320",
//                      operation: "6",
//                      result: "1",
//                      source: "0",
//                      message: "5:" + location.protocol + "//" + location.host + location.pathname + ":" + ret
//                  });
//                  //只发一次连接的
//                  if (rolekeysArr.length < 31) {
//                      dfd.resolve(ret);
//                      callback && callback({
//                          "errorCode": 2,
//                          "errMsg": "param error",
//                          "jdpin": "",
//                          "uin": "",
//                          "data": ""
//                      });
//                  }
//              }
//          });
//      }
//  }
