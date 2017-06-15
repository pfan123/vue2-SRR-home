/*
描述：微信和手Q抽奖共用接口
*/
define('wq.lib.active.draw.new', function(require, exports, module) {
    var _cacheThisModule_;
    var base = require('./wq.lib.base'),
        ldJs = require('./loadJs'),
        login = require("./login"),
        ui = require("./ui"),
        drawDom = "",
        clickEvent = 'ontouchstart' in window ? 'tap' : 'click';
    var msg = {
        0: '领取成功，稍后前往个人中心查看。',
        10001: '您已经领取过优惠券。',
        10002: '您今天已经领取过优惠券，明天再来！',
        10010: '您已达中奖上限',
        10003: '很遗憾，运气不好，没有领到优惠券。',
        10004: '很遗憾，优惠券已经被领完。',
        10009: '很遗憾，今日优惠券已经被领完',
        10005: '活动不存在。',
        10006: '领券活动还未开始。',
        10007: '领券活动已经结束。',
        10008: '很遗憾，优惠券已经被领完', //黑名单用户
        10000: '当前排队人数太多，请稍后再试' //系统异常提示语
    };


    function getClsDraw(clickEvent) {
        var baseCls = base.init();
        var objEvent = {

        };
        objEvent[clickEvent] = (function() {
            var fun = function(self, e) {
              
                //单向绑定，修改数据直接更新对应模板
                //console.log(e.target);
                
                drawDom = $(e.target).closest("[data-drawkey]");
                var orderid = drawDom.attr("data-drawkey");
                if (orderid) {
                    self.set("activeName", orderid.split('~')[0]);
                    self.set("drawLevel", orderid.split('~')[1]);
                    self.set("drawNum", drawDom.attr("data-drawnum"));
                    self.set("ignoreLogin", false);

                    self.setDraw(null);
                };
                if(self.get("clickcb")){
                    return self.get("clickcb")(self, e);
                }
                return false;
            }
            return fun;
        })();

        var getDraw = baseCls.extend({

            EVENTS: {
                //选择器字符串，支持所有zepto风格的选择器
                '[data-drawkey]': objEvent,
            },



            getDrawNumber: function(activeName, success, fail) {

                var curObj = this,
                    queryNum = "//wq.jd.com/active/queryprizesstatus?active=",
                    getNumSuccess = success || this.get("getNumSuccess"),
                    getNumFail = fail || this.get("getNumFail");

                window.QueryPrizesStatus = function(data) {

                    if (data.retcode == 0) {

                        getNumSuccess && getNumSuccess(data);

                        return;

                    } else {

                        getNumFail && getNumFail(data);

                        return;

                    }
                }

                ldJs.loadScript({
                    url: queryNum + activeName,
                    charset: 'utf-8'
                });

            },



            checkDrawState: function(activeName, sucess, fail) {

                var curObj = this,
                    bingoUrl = "//wq.jd.com/active/querybingo?active=",
                    queryDrawSuccess = sucess || curObj.get("queryDrawSuccess"),
                    queryFail = fail || curObj.get("queryFail");
                callBinggo(activeName);

                function callBinggo(activeName) {
                    window.BingoCallBack = function(data) {

                        if (data.errorCode == 0) {

                            if (sucess) {
                                sucess(data);
                            }
                            return;

                        } else {
                            //不处理强制登录的情况
                            if (fail) {
                                fail(data);
                            }
                            return;
                        }
                    }

                    ldJs.loadScript({
                        url: bingoUrl + activeName,
                        charset: 'utf-8'
                    });
                }


            },



            setDraw: function(obj, drawLevel, activeName, callbackObj) { // callbackObj：本次领券的单独配置，isShowInfo
                var curObj = this,
                    activeNames = activeName || this.get("activeName"),
                    success = this.get("success"),
                    drawLevel = drawLevel || this.get("drawLevel"),
                    drawOver = this.get("drawOver"),
                    drawGetted = this.get("drawGetted"),
                    thisMsg = this.get("infos") || msg,
                    fail = this.get("fail"),

                    preLogin = this.get("preLogin"),
                    ignoreLogin = this.get("ignoreLogin"),

                    selfcallback = this.get("selfcallback"),
                    drawNum = this.get("drawNum"),
                    drawUrl = "//wq.jd.com/active/active_draw?",
                    device = JD.device.scene === "weixin",
                    extType = (device === true) ? "hj:w" : "hj:q",
                    isShowInfo = this.get('isShowInfo');
                obj = obj || drawDom;
                //console.log('请求之前： ', activeNames, drawLevel);
                if (!activeNames && !drawLevel) {
                    return;
                }
                //var _drawCBName = 'ActiveLotteryCallBack';
                var _drawCBName = 'couponDrawCB_' + activeNames.replace(/\W/g, '') + drawLevel; // ActiveLotteryCallBack
                window[_drawCBName] = function(json) {
                    var quanKey = activeNames + "~" + drawLevel;
                    //console.log('回调： ', quanKey);
                    if (json.ret == 2) {
                        JD.store.setValue("quanKey", quanKey);
                        JD.store.getValue("loginCount", function(a, b) {
                            JD.store.setValue("loginCount", b ? (b + 1) : 0);
                        })
                        obj && obj.attr("drawFlag", "yes");
                        preLogin && preLogin(quanKey);
                        !ignoreLogin && login.login();
                        return;
                    }
                    JD.store.del("quanKey");
                    var retCode = json.ret;
                    switch (retCode) {
                        case 0:
                            code = 0;
                            success && success(json, obj, code, quanKey, drawNum);
                            break; //领取成功
                        case 3:
                            code = 10010;
                             fail && fail(json, obj, quanKey, code);
                            break; //达活动中奖上限
                        case 10:
                            code = 10001;
                            drawGetted && drawGetted(json, obj, code, quanKey, drawNum);
                            break; //已经领取过了
                        case 4:
                            code = 10002;
                            drawGetted && drawGetted(json, obj, code, quanKey, drawNum);
                            break; //今天已经领取过了
                        case 5:
                        case 6:
                            code = 10009;
                            drawOver && drawOver(json, obj, code, quanKey, drawNum);
                            break; //今日优惠券已经被领完
                        case 8:
                            code = 10003;
                            break; //未领取到优惠券（未中奖）
                        case 7:
                        case 11:
                            code = 10004;
                            drawOver && drawOver(json, obj, code, quanKey, drawNum);
                            break; //已经被领完
                        case 101:
                            code = 10005;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动不存在
                        case 102:
                        case 103:
                            code = 10006;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动未开始
                        case 104:
                            code = 10007;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动已经结束
                        case 147:
                        case 151:
                            code = 10008;
                            fail && fail(json, obj, quanKey, code);
                            break; //黑名单用户
                        default:
                            code = retCode;
                            fail && fail(json, obj, quanKey, code);
                    }
                    if (selfcallback) {
                        selfcallback(json, obj, code, quanKey, drawNum);
                        return; // 弹窗也自己处理
                    }
                    if((callbackObj && callbackObj.isShowInfo === false) || (!callbackObj && isShowInfo === false)){
                        return;
                    }
                    //要判断中奖等级是否大于0
                    if (code == 0) {
                        code = json.bingo && json.bingo.bingolevel > 0 ? code : 10000;
                    }
                    var awardcode = json.award && json.award.awardcode ? json.award.awardcode : "优惠券";
                    var info = (thisMsg[code] || thisMsg[10000]).replace(/{#name#}/g, awardcode);
                    ui.info({
                        msg: info,
                        icon: code == 0 ? 'success' : 'info'
                    });
                };

                // ldJs.loadScript({
                //     url: drawUrl + "ext=" + extType + "&active=" + activeNames +
                //     "&level=" + drawLevel + "&callback=ActiveLotteryCallBack" + "&t=" + new Date().getTime(),
                //     charset: 'utf-8'
                // });


                /* */

                var promotejs = JD.cookie.get("promotejs"); //写入的cookie
                if (promotejs) {
                    ldJs.loadScript({
                        url: drawUrl + "ext=" + extType + "&active=" + activeNames +
                            "&level=" + drawLevel + "&callback=" + _drawCBName + "&t=" + new Date().getTime(),
                        charset: 'utf-8'
                    });
                } else {
                    window.GetFunction = function(res) {
                        if (res.errorCode == 2) {
                            var quanKey = activeNames + "~" + drawLevel;
                            JD.store.setValue("quanKey", quanKey);
                            JD.store.getValue("loginCount", function(a, b) {
                                JD.store.setValue("loginCount", b ? (b + 1) : 0);
                            })
                            obj && obj.attr("drawFlag", "yes");
                            login.login();
                            return;
                        }
                        if (res.errorCode == 0) {
                            res.function(res.TOKEN);
                        }
                        ldJs.loadScript({
                            url: drawUrl + "ext=" + extType + "&active=" + activeNames +
                                "&level=" + drawLevel  + "&callback=" + _drawCBName + "&t=" + new Date().getTime(),
                            charset: 'utf-8'
                        });
                    }
                    ldJs.loadScript('//wq.jd.com/active/getfunction');
                }

                /* */



            }

        });
        return getDraw;
    }
    /*
    options:
          parentNode：可选，不选默认是document
          activeName:必选， 一般为字符串
          drawLevel : 必传 ，一般为数字，比如1、2等数字,不同的数字代表不同的券的面值，比如1代表 满1000-50
          success: 可选，领取成功的回调函数 , 设置成功的回调函数的目的是在成功之后对对前端的一些操作，比如保存已领取的状态等
          preLogin:登录之前的处理， 可以保存一些状态
          fail: 可选，领券失败的回调函数
          drawOver: 可选，券已经被领完的回调函数
          drawGetted: 可选，已经领取成功的回调函数
          infos:可选 , 传递特定的文案 ,格式如下，并且都是可选的，不传递的话则使用默认的文案
           {0: '领取成功，稍后前往个人中心查看。',
            10001: '您已经领取过优惠券。',
            10002: '您今天已经领取过优惠券，明天再来！',
            10003: '很遗憾，运气不好，没有领到优惠券。',
            10004: '很遗憾，优惠券已经被领完。',
            10009: '很遗憾，今日优惠券已经被领完',
            10005: '活动不存在。',
            10006: '领券活动还未开始。',
            10007: '领券活动已经结束。',
            10008: '很遗憾，优惠券已经被领完。',  //黑名单用户
            10000: '很遗憾，优惠券已经被领完。'   //系统异常提示语
           }
           queryDrawSuccess：查询是否领过了券的成功了的回调函数
           queryFail：查询是否领过了券的失败了的回调函数
           getNumSuccess：查询券是否被领完了成功的回调函数
           getNumFail：查询券是否被领完了失败的回调函数
 
    */

    exports.init = function(options) {
        var _settings = {
            parentNode: null,
            activeName: null,
            drawLevel: null,
            preLogin: null,
            selfcallback: null, //完全自己处理
            success: null,
            fail: null,
            drawOver: null,
            drawGetted: null,
            infos: null,
            queryDrawSuccess: null,
            queryFail: null,
            getNumSuccess: null,
            getNumFail: null,
            ignoreLogin: false,
            clickcb: null,
            clickEvent: "click",
            isShowInfo: true // 领券时是否弹默认框

        };


        if (options) {
            $.extend(_settings, options);
        }
        var cls = getClsDraw(_settings.clickEvent);
        var objDraw = cls.create(_settings);
        (function(objDraw) {
            JD.store.getValue("loginCount", function(a, b) {
                if ((b ? (b + 1) : 0) > 2) {
                    return;


                }
            });
            JD.store.getValue("quanKey", function(a, b) {
                var quankey = b ? b.split("~") : 0;
                JD.store.del("quanKey");
                if (quankey == 0) return;
                var obj = $("[drawFlag]"),
                    drawLevel = quankey[1],
                    drawActive = quankey[0];


                objDraw.setDraw(obj, drawLevel, drawActive);

            });

        })(objDraw);

        return objDraw;


    }

});