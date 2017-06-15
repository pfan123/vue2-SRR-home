//2014-11-07 alert时增减 禁止touchmove参数
define('ui', function(require, exports, module) {
    /*
    demo 地址 ：http://static.paipaiimg.com/wx/html/common/mod_alert.html?t=1411459215227
    demo 构建：williamsli 
    全部为但
    */
    var _cacheThisModule_,
        container = document.querySelector(".wx_wrap") || document.body;
    var bInit1111Tips = false;
     var goLink = "//wqs.jd.com/my/mywx1111.shtml?p=my1111Record";

    /*alert蒙层*/
    var alertCoverDiv = document.createElement('div');
    alertCoverDiv.style.cssText = "position: fixed; width: 100%; height: 100%; top: 0px; left: 0px; z-index: 109; background: rgba(0, 0, 0, 0.3);";

    function notNeedLoadCss() {
        var uiCSSUrl2 = 'base/gb/css/gb.min_',
            uiCSSUrl3 = 'wx/gb/css/gb.min_',
            uiCSSUrl4 = 'sq/gb/css/gb.min_',
            uiCSSUrl5 = 'mod_alert.min',
            //uiCSSUrl = 'base.s.min',
        links = document.getElementsByTagName('link'),
            isHave = false;
        for (var i = 0, l = links.length; i < l; i++) {
            if (links[i].rel == 'stylesheet' && (links[i].href.indexOf(uiCSSUrl2) >= 0 || 
                    links[i].href.indexOf(uiCSSUrl3) >= 0 || links[i].href.indexOf(uiCSSUrl4) >= 0 || links[i].href.indexOf(uiCSSUrl5) >= 0)) {
                isHave = true;
                break;
            }
        }
        return isHave;
    }
    /*alert蒙层*/

    function loadCss(url) {
        if (notNeedLoadCss()) {
            return;
        }
        var l = document.createElement('link');
        l.setAttribute('type', 'text/css');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('href', url);
        document.getElementsByTagName("head")[0].appendChild(l);
    };

    /*
    title:文字提示，默认操作成功
    t:倒计时消失秒数，默认2秒
    classname:默认g_small_tips
    */
    function showTip(obj) {
        if (!obj) return;
        var className = obj.className || 'g_small_tips',
            tips = document.querySelector("." + className),
            t = obj.t || 2000,
            title = obj.title || '操作成功!';
        //判断是否存在tips，如果不存在，则新加一个节点
        if (!tips) {
            tips = document.createElement('div');
            tips.className = className;
            document.body.appendChild(tips);
        }
        tips.innerText = title;
        tips.style.display = 'block'; //显示tips
        //展示后自动消失
        setTimeout(function() {
            tips.style.display = 'none'; //隐藏tips
        }, t);

    }

    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }


    /*
     * opts {object}
     *      msg:提示消息，必传参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function info(opts) {
        var option = {
            msg: "", //提示消息
            icon: "none", //图标类型，none,info,fail,success
            delay: 2000 //倒计时消失秒数，默认2秒
        };
        opts = opts || {};
        extend(option, opts);
        var el = document.createElement('div');
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.icon != 'none' ? ('<i class="icon' + (option.icon != 'info' ? (' icon_' + option.icon) : '') + '"></i>') : '') + '<p>' + option.msg + '</p>';
        container.appendChild(el);
        setTimeout(function() {
            el.style.display = 'none';
            container.removeChild(el);
        }, option.delay);
    }

    /*
     * msg:提示消息，必传参数
     * opts 参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function alert(opts) {
        var option = {
                showClose: false,
                msg: "", //提示消息
                confirmText: '确认', // 确认按钮文案
                icon: "none", //图标类型，none,info,fail,success
                onConfirm: null, //点击“确认按钮”时的回调
                stopMove: false,
                btnClass: 'btn_1'
            },
            stopMove = function(e) {
                e.preventDefault();
            },
            el = document.createElement('div');
        opts = opts || {};
        extend(option, opts);
        container = opts.container || container;
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.showClose ? '<span class="close"></span>' : '') + (option.icon != 'none' ? ('<i class="icon' + (option.icon != 'info' ? (' icon_' + option.icon) : '') + '"></i>') : '') + '<p>' + option.msg + '</p>' + (option.subMsg ? '<p class="small">' + option.subMsg + '</p>' : '') + '<p class="btns"><a href="javascript:;" class="btn ' + option.btnClass + '">' + option.confirmText + '</a></p>';
        container.appendChild(el);
        option.showClose && (el.querySelector(".close").onclick = function(e) {
            //option.onCancel && option.onCancel();
            this.onclick = null;
            clear();
        });

        //禁止滑动
        el.querySelector(".btn").onclick = function(e) {
            /*alert蒙层*/

            /*alert蒙层*/
            option.onConfirm && option.onConfirm();
            //el.style.display = 'none';
            this.onclick = null;
            clear();
            //释放 禁止滑动事件


        };
        /*alert蒙层*/
        document.body.appendChild(alertCoverDiv);
        option.stopMove && document.addEventListener("touchmove", stopMove, false);

        function clear() {
            document.body.removeChild(alertCoverDiv);
            el.style.display = 'none';
            container.removeChild(el);
            option.stopMove && document.removeEventListener("touchmove", stopMove, false);
        }
    }

    /*
     * msg:提示消息，必传参数
     * opts 参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function confirm(opts) {
        var option = {
            msg: "", //提示消息
            icon: "none", //图标类型，none,info,fail,success
            okText: "确定",
            cancelText: "取消",
            onConfirm: null, //点击“确认按钮”时的回调
            onCancel: null, //点击“确认按钮”时的回调
            onClearCb:null  //清除后的操作
        };
        opts = opts || {};
        extend(option, opts);
        container = opts.container || container;
        var el = document.createElement('div');
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.icon != 'none' ? ('<i class="icon' + (option.icon != 'info' ? (' icon_' + option.icon) : '') + '"></i>') : '') + '<p>' + option.msg + '</p>' + (option.subMsg ? '<p class="small">' + option.subMsg + '</p>' : '') + '<p class="btns"><a href="javascript:;" id="ui_btn_confirm" class="btn btn_1">' + option.okText + '</a><a href="javascript:;" id="ui_btn_cancel" class="btn btn_1">' + option.cancelText + '</a></p>';
        container.appendChild(el);
        /*alert蒙层*/
        document.body.appendChild(alertCoverDiv);
        /*alert蒙层*/
        el.querySelector("#ui_btn_cancel").onclick = function(e) {
            option.onCancel && option.onCancel();
            clear();
        };
        el.querySelector("#ui_btn_confirm").onclick = function(e) {
            option.onConfirm && option.onConfirm();
            clear();
        };

        function clear() {
            el.style.display = 'none';
            container.removeChild(el)
            document.body.removeChild(alertCoverDiv);
            option.onClearCb && option.onClearCb();

        }
    }

    /*
    type:类型
    result:/
    */
    loadCss("//wq.360buyimg.com/fd/h5/base/gb/css/mod_alert.min_79c590c3.css");

    module.exports = {
        showTip: showTip,
        info: info,
        alert: alert,
        confirm: confirm
  
    };
});