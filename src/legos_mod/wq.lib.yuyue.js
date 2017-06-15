/*
描述：提供预约的相关方法，注意是新版的预约系统
*/
define('wq.lib.yuyue', function(require, exports, module) {
    var base = require('./wq.lib.base'),
        ldJs = require('./loadJs'),
        cookie = require("./cookie"),
        login = require("./login"),
        ui = require("./ui"),
        _cacheThisModule_,
        closeCallBack,
        isShowEwm, bInitCss = false; //用于判断是否呼出二维码浮层

    function getEnv() {
        var _ua = navigator.userAgent.toLowerCase();
        if (!/mobile|android/.test(_ua)) {
            return "pc";
        } else {
            if (/micromessenger(\/[\d\.]+)*/.test(_ua)) {
                return "weixin";
            } else if (/qq\/(\/[\d\.]+)*/.test(_ua) || /qzone\//.test(_ua)) {
                return "qq";
            } else {
                return "h5";
            }
        }
    }

    /**
     *  查询大账号
     * @param callback 回调方法，此方法回调参数为 true则表示未关注，false表示已关注
     *        followImg 二维码图片，默认为京东微信大账号图片
     *        isShowAlert 是否 弹出关注二维码的框，默认为true，弹出
     */
    function checkFollowStatus(callback, followImg, isShowAlert) {
        var isShowAt;
        if (isShowAlert == null || typeof(isShowAlert) == undefined) {
            isShowAt = isShowEwm;
        } else {
            isShowAt = isShowAlert;
        }
        if (getEnv() == "weixin") {
            ldJs.loadScript({
                url: "//wq.jd.com/user/info/CheckUserIsFans?wxid=qqwanggou001&callback=getFollowInfo&openid=" + cookie.get('open_id') + '&t=' + Date.now(),
                onError: function() {
                    callback && callback(false);
                },
                onTimeout: function() {
                    callback && callback(false);
                }
            });

            window.getFollowInfo = function(json) {
                if (json.retcode == 0) {
                    if (json.isfans == 0) { // 未关注
                        if (isShowAt) {
                            showQrcodeLayer(followImg);
                        }
                        callback(true);
                    } else { // 已关注
                        cookie.set("followWxAccount", 1, 24 * 3600, "/", "jd.com"); //有效期1天
                        callback(false);
                    }
                } else {
                    callback(false);
                }
            };

        } else if (getEnv() == "qq") {
            var qqfollowUrl = '//wq.jd.com/user/qquserinfo/CheckQQFans?callback=isQQFans&t=' + Math.random();
            ldJs.loadScript({
                url: qqfollowUrl,
                onError: function() {
                    callback && callback(false);
                },
                onTimeout: function() {
                    callback && callback(false);
                }
            });
            window.isQQFans = function(d) {
                if (d.subscribe == 0) { // 未关注
                    callback(true);
                } else {
                    callback(false);
                }
            };
        } else {
            callback && callback(false);
        }
    }

    function getLayerY() {
        var scrollTop = $(document.body).scrollTop();
        var windowHeight = $(window).height();
        var layerHeight = $("#followWxAccountLay").height();
        return scrollTop + (windowHeight - layerHeight) / 2;
    }


    function showQrcodeLayer(followImg) {
        console.log("enter  showQrcodeLayer  function");
        var img = followImg || "//img11.360buyimg.com/jdphoto/s135x135_jfs/t2122/47/717920692/46309/d2488484/56270c9bN63d0a620.jpg";
        if (document.getElementById("followWxAccountLay")) {
            $("#followWxAccountLay").show();
            return;
        }
        $('<div id="followWxAccountLay" style="display:none" class="mod_alert mod_alert_remind fixed show">' + '<i class="icon"></i>' + '<i class="close"></i>' + '<p class="title">离预约成功还差一步！</p>' + '<p class="desc">需要关注"京东JD.COM"服务号，<br/>才能及时获取活动提醒哦！</p>' + '<p class="qrcode"><img src="' + img + '"><span>长按二维码关注</span></p>' + '</div>').appendTo(document.body);

        $("#followWxAccountLay").show();
        $("#followWxAccountLay .close").click(function() {
            closeCallBack();
            $("#followWxAccountLay").hide();
        });
    }

    function loadCss(url) {
        var l = document.createElement('link');
        l.setAttribute('type', 'text/css');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('href', url);
        document.getElementsByTagName("head")[0].appendChild(l);
    };

    function getClsWXSubscribe() {
        var wxsubscribe = base.init().extend({
            EVENTS: {
                //选择器字符串，支持所有zepto风格的选择器
                '[data-activeid]': {
                    //注册keyup事件
                    click: function(self, e) {
                        //单向绑定，修改数据直接更新对应模板
                        //console.log(e.target);
                        var orderid = $(e.target).closest("[data-activeid]").attr("data-activeid");
                        if (orderid) {
                            self.setSubcribe(orderid, null, null, $(e.target));
                        }
                        //self.refreshData('count', self._getNum());
                    }
                },
            },


            //这个地方请注意，需要加 info的样式,默认构建中一般是有的（mod_alert show fixed），
            //如果是外包构建请加上下面的样式
            //.mod_alert.show {display: block}
            //.mod_alert.fixed {display: none;z-index: 899;position: fixed;top: 35%;left: 50%;margin-left: -120px}
            info: function(opts) {
                var option = {
                    container: opts.container || document.body,
                    msg: "", //提示消息
                    icon: "none", //图标类型，none,info,fail,success
                    delay: 2000 //倒计时消失秒数，默认2秒
                };
                opts = opts || {};
                for (var i in opts) {
                    if (opts.hasOwnProperty(i)) {
                        option[i] = opts[i];
                    }
                }

                ui.info({
                    msg: option.msg, //提示消息
                    icon: "none", //图标类型，none,info,fail,success
                    stopMove: true
                });

            },

            /**
             *  查询单个活动是否预约的方法
             * @param activeId 必选   预约id
             */
            queryIsSub: function(activeId, callback) {

                window.queryIsSubscribe = function(data) {
                    if (data.retCode == 0) {
                        callback && callback(data, true);
                    } else {
                        callback && callback(data, false);
                    }
                };

                ldJs.loadScript({
                    url: "//wq.jd.com/bases/yuyue/activeResult?callback=queryIsSubscribe&activeId=" + activeId,
                    charset: 'utf-8'
                });

            },
            loadPreOrder: function(list, parentNode, tips, keywor) {

                tips = tips || "{#num#}人预约";
                if (list.length > 0) {
                    list.forEach(function(item) {
                        ldJs.loadScript({
                            url: "//yushou.jd.com/youshouinfo.action?callback=cbjsonp&sku=" + item.sSkuId
                        });
                    });
                }
                window.cbjsonp = function(json) {
                    var num = json.num;

                    if (num) {
                        var renshu = "";
                        if (json.num > 100000) {
                            renshu = parseInt(json.num / 10000) + "万";
                        } else {
                            renshu = json.num;
                        }
                        //$('#price' + json.ret.w).html('<i>￥</i>' + (json.ret.sa[json.ret.cs - 1].m));
                        if (parentNode) {
                            parentNode.find('[data-yynum="' + json.sku + '"]').html(tips.replace("{#num#}", renshu));
                        } else {
                            $('[data-yynum="' + json.sku + '"]').html(tips.replace("{#num#}", renshu));
                        }

                    }
                }
            },

            checkCbName: function(cbName) {
                if (!window[cbName]) {
                    return cbName;
                } else {
                    return arguments.callee(cbName + '_1');
                }
            },

            /*  *
         *  设置预约提醒(这个是一个活动的预约)
         *
         * @param orderid 必选 (单个活动的id)

         * @param cbObj 可选 注意此参数可以包括以下属性：
                referType：活动类型，如商品特价活动为1、品牌活动为2、等（值必须为正整数，不能为0）
                referId：对应活动下，预约某项的Id值。每次只能传入一个referId，不支持批量
                selfDealErr： 自己处理回调，不由组件进行处理
                isShowInfo： 采用默认的弹框处理
                isReLogin:是否允许自动登录，默认为true，允许自动登录
                elseObj: 为预约时需要传递的额外数据，回调时会带入此对象，例如点击的button对象
                preLogin: 跳转登录前所需要做的回调方法，例如进行页面状态的sessionStorage的保存     
                success: 预约成功的回调方法
                orderedCb，重复预约的回调，
                actNotCb，活动不存在的回调，
                actEnded, 活动已结束
                onclose,关闭二维码回调函数
                actNotStartCb,活动还未开始
                failCb 失败的回调
                isCheckFollow： 是否关注大账号，用于预约成功返回为0的时候，默认为false
                isCheckFollowOrder： 是否关注大账号，用于已经进行预约返回为10006的时候，默认为false
                followImg 关注大账号的二维码图片

            @param  msgArray 可选 注意此参数为msg数组，设置默认弹框时，
                        需要用到此参数，需要修改默认msg值则进行值传递，对于下标见case语句中
            @return {[type]}      [description]
             返回码errcode：{
                    '0': '操作成功',
                    '13': '用户未登录 ',
                    '10006': '重复预约 ',
                    '10007': '活动不存在 ',                    
                     其它: '系统错误 '
                };
            返回对象：callback({ "retCode":"", "retUrl":"", "retMsg":"", 
            "list":[ { "activeId":"10002", "replyCode":"10006", "replyMsg":"已经预约成功，请勿重复预约", 
            "saleStartTime":"2015-09-25 15:34:01"} ] })
         */
            setSubcribe: function(orderId, cbObj, msgArr, dom) {
                var me = this,
                    orderId = orderId || me.get("orderId"),
                    orderUrl = "//wq.jd.com/bases/yuyue/active?activeId=",
                    callbackObj = cbObj || me.get("callbackObj"),
                    isShowInfo = callbackObj.isShowInfo || me.get("isShowInfo"),
                    success = callbackObj.success || me.get("success"),
                    isReLogin = callbackObj.isReLogin || me.get("isReLogin"),
                    preLogin = callbackObj.preLogin || me.get("preLogin"),
                    msgArray = msgArr || me.get("msgArray"),
                    isCheckFollow = callbackObj.isCheckFollow || me.get("isCheckFollow"),
                    isCheckFollowOrder = callbackObj.isCheckFollowOrder || me.get("isCheckFollowOrder"),
                    followImg = callbackObj.followImg || me.get("followImg"),
                    cbName = "setActSub" + orderId;
                closeCallBack = callbackObj.onclose || function() {};
                var referType = callbackObj.referType || '';
                var referId = callbackObj.referId || '';

                var orderCbName = me.checkCbName(cbName);

                window[orderCbName] = function(json) {
                    delete window[orderCbName];
                    var errNo = json.retCode,
                        msg = "";
                    //进行自己处理事件
                    if (callbackObj.selfDealErr) {
                        callbackObj.selfDealErr({
                            json: json,
                            elseObj: callbackObj.elseObj,
                            orderId: orderId
                        });
                        return;
                    }
                    if (errNo == "") {
                        var replyCode = json.list[0].replyCode;
                        switch (replyCode) {
                            case "0":
                                if (isCheckFollow) {
                                    checkFollowStatus(function(isShownQrcode) {
                                        if (!isShownQrcode) {
                                            msg = msgArray[0] ? msgArray[0] : "设置提醒成功，请留意" + (JD.device.scene == "qq" ? "手机QQ" : "微信") + "通知。";
                                            success && success({
                                                isShownQrcode: isShownQrcode,
                                                json: json,
                                                elseObj: callbackObj.elseObj,
                                                orderId: orderId,
                                                dom: dom //点击是哪个dom
                                            });
                                            if (isShowInfo && msg.length != 0) {
                                                me.info({
                                                    msg: msg
                                                });
                                            }
                                        } else {
                                            success && success({
                                                isShownQrcode: isShownQrcode,
                                                json: json,
                                                elseObj: callbackObj.elseObj,
                                                orderId: orderId,
                                                dom: dom //点击是哪个dom
                                            });
                                        }

                                    }, followImg);
                                } else {
                                    msg = msgArray[0] ? msgArray[0] : "设置提醒成功，请留意通知。页面底端关注大账号才可收到提醒!";
                                    success && success({
                                        json: json,
                                        elseObj: callbackObj.elseObj,
                                        orderId: orderId,
                                        dom: dom //点击是哪个dom
                                    });
                                }
                                break;
                            case "10006":
                                if (isCheckFollowOrder) {
                                    checkFollowStatus(function(isShownQrcode) {
                                        if (!isShownQrcode) {
                                            msg = msgArray[1] ? msgArray[1] : "已设置预约，无需再进行设置";
                                            callbackObj.orderedCb && callbackObj.orderedCb({
                                                isShownQrcode: isShownQrcode,
                                                json: json,
                                                elseObj: callbackObj.elseObj,
                                                orderId: orderId,
                                                dom: dom //点击是哪个dom
                                            });
                                            if (isShowInfo && msg.length != 0) {
                                                me.info({
                                                    msg: msg
                                                });
                                            }
                                        } else {
                                            callbackObj.orderedCb && callbackObj.orderedCb({
                                                isShownQrcode: isShownQrcode,
                                                json: json,
                                                elseObj: callbackObj.elseObj,
                                                orderId: orderId,
                                                dom: dom //点击是哪个dom
                                            });
                                        }

                                    }, followImg);
                                } else {
                                    msg = msgArray[1] ? msgArray[1] : "已设置预约，无需再进行设置";
                                    callbackObj.orderedCb && callbackObj.orderedCb({
                                        json: json,
                                        elseObj: callbackObj.elseObj,
                                        orderId: orderId,
                                        dom: dom
                                    });
                                }
                                break;
                            case "10007":
                                msg = msgArray[2] ? msgArray[2] : "活动不存在，请稍后再试";
                                callbackObj.actNotCb && callbackObj.actNotCb({
                                    json: json,
                                    elseObj: callbackObj.elseObj,
                                    orderId: orderId
                                });
                                break;
                            case "10008":
                                msg = msgArray[3] ? msgArray[3] : "活动已结束";
                                callbackObj.actEnded && callbackObj.actEnded({
                                    json: json,
                                    elseObj: callbackObj.elseObj,
                                    orderId: orderId
                                });
                                break;
                            case "10009":
                                msg = msgArray[4] ? msgArray[4] : "活动还未开始";
                                callbackObj.actNotStartCb && callbackObj.actNotStartCb({
                                    json: json,
                                    elseObj: callbackObj.elseObj,
                                    orderId: orderId
                                });
                        }

                    } else if (errNo == "13") {
                        preLogin && preLogin({
                            json: json,
                            elseObj: callbackObj.elseObj,
                            orderId: orderId
                        });
                        isReLogin && login.login();
                        return;
                    } else {
                        msg = msgArray[5] ? msgArray[5] : "系统错误,请稍后再试";
                        callbackObj.failCb && callbackObj.failCb({
                            json: json,
                            elseObj: callbackObj.elseObj,
                            orderId: orderId
                        });
                    }

                    if (isShowInfo && msg.length != 0) {
                        me.info({
                            msg: msg
                        });
                    }

                };

                var requestcgi = orderUrl + orderId + "&callback=" + orderCbName + "&t=" + new Date().getTime();
                if (referType) {
                    requestcgi = requestcgi + "&referType=" + referType;
                }
                if (referId) {
                    requestcgi = requestcgi + "&referId=" + referId;
                }

                ldJs.loadScript({
                    url: requestcgi,
                    charset: 'utf-8'
                });
            }

        });
        return wxsubscribe;
    }


    /*
    options:
          parentNode: 采用组件的默认事件处理的时候（'[data-activeid]'方式） ，需要传递
          orderid:可选， 一般为字符串,如果只有一个id，则可以在这里进行传递，
                如果页面中多个id，则需要在调用方法中传递，则此处不传，注意 此处不传则调用方法的时候必须传！！
          isShowInfo: 可选，默认true，在预约成功或者失败 后进行 弹框，如果传false，则需要自己进行弹框处理
          success 和 preLogin 分别为预约成功和未登录时的回调，可在此处设置，也可以在callbackObj对象中设置
          isCheckFollow： 是否关注大账号，用于预约成功返回为0的时候，默认为false
          isCheckFollowOrder： 是否关注大账号，用于已经进行预约返回为10006的时候，默认为false
          callbackObj，msgArray：可选，参数设置请查看setSubcribe方法注释
          isShowEwm: 是否呼出二维码浮层,默认为true，弹出二维码框
          followImg:二维码图片，默认为微信大账号的关注图片

    */
    exports.init = function(options) {
        if (!bInitCss) {
            bInitCss = true;
            loadCss("//wq.360buyimg.com/fd/base/css/base/mod_alert_remind.s.min.css?t=20160128");
        }

        var _settings = {
            parentNode: null,
            orderid: null,
            isShowInfo: true,
            isReLogin: true,
            success: null,
            isCheckFollow: false,
            isCheckFollowOrder: false,
            preLogin: function() {},
            callbackObj: {},
            msgArray: [],
            isShowEwm: true,
            followImg: null
        };
        if (options) {
            $.extend(_settings, options);
        }
        isShowEwm = _settings.isShowEwm;
        var cls = getClsWXSubscribe();
        return cls.create(_settings);
    }
    exports.checkFollowStatus = checkFollowStatus;

});