/**
 * 网购debug模块
 * @author p_jdslhuang(zerahuang)
 * @description 引用debug模块，可以记录页面的访问日志，打出日志以及上报日志功能，方便定位bug
 *              还能在Url参数里面指定cgi的返回值以及一些全局变量的值，方便模拟各种各样的场景
 *              url参数的格式(debug参数)：
 *                  var zz = {param:{aa:"zz"},cgiData:{queryprizesstatus:{cbname:"QueryPrizesStatus",data:{"active":"QQVIP2"}}}};
 *                  encodeURIComponent(JSON.stringify(zz))
 */
define('wg.debug', function(require, exports, module) {
    var _cacheThisModule_;
    var _url = require("./url");
    var _ajax = require("./ajax");
    var cookie = require("./cookie");

    //是否开始debug模式
    var _debug = JSON.parse(_url.getUrlParam("debug")?decodeURIComponent(_url.getUrlParam("debug")):"{}");
    //环境
    var _ua = navigator.userAgent.toLowerCase();
    var env = (function(){
        return !/mobile|android/.test(_ua)?"pc":_ua.indexOf("micromessenger")>-1?"weixin":/qq\/([\d\.]+)*/.test(_ua)||/qzone\//.test(_ua)?"qq":/jzyc\/\d\.\d/.test(_ua)?"jzyc":"mobile";
    })();
    //数据缓存
    window.logs = [];
    //错误日志上报
    var biztype = "errorreport";
    //设置域名为根域名
    //document.domain = "wanggou.com";
    //定义缓存
    if(typeof window.cgiData == "undefined"){
        window.cgiData = {};
    }

    //初始化debug
    init_debug();
    //计时器
    // var _timer = ["setTimeout","setInterval"];
    // _timer.forEach(function(ceil){
    //     window["_" + ceil] = window[ceil];
    //     /**
    //      * 设置计时器
    //      * @param {Function} func 传的方法
    //      * @param {String & Number} time 传入的时间
    //      * @param {Boolean} needlog 是否需要日志，默认不需要，加上true的话，打日志
    //      */
    //     window[ceil] = function(func,time,needlog){
    //         return window["_" + ceil](function(){
    //             if(needlog){
    //                 try{
    //                     func();
    //                 }catch(e){
    //                     addScriptErrorLog(e,3,func.toString().slice(0,100));
    //                 }
    //             }else{
    //                 func();
    //             }
    //         },time);
    //     }
    // });

    /**
     * 加载Js，与正常的loadScript，loadJs用法一致
     */
    exports.loadScript = loadScript;

    /**
     * addToken
     */
    exports.addToken = _ajax.addToken;
    /**
     * 添加日志
     * @param {Object} opt 日志内容：
            time://时间
            cgi:"",  //cgi链接
            cbname:"",   //目前的函数名
            data:null,  //打入log的数据
            params:"" //目前函数的参数值
     */
    exports.log = log;

    /**
     * 错误处理机制
     * @param {Function} 系统错误（window.onerror发生时）执行的函数
     */
    exports.error = error;
    
    /**
     * 上报日志（上报日志，直接上报日志，不需要显示日志）
     */
    exports.report = report;

    /**
     * 是否开始了debug模式
     * @return {Boolean} 是否开始了debug模式
     */
    exports.isdebug = isdebug;

    /**
     * 设置参数值（可以被url参数更改）
     */
    exports.setParam = setParam;

    /**
     * 显示日志信息（内含上报日志的功能）
     */
    exports.showLog = showLog;

    /**
     * 添加错误日志
     * @param {Object} e 事件
     * @param {String} type 事件类型
     *   type不填 是默认顺序执行代码的错误
     *   type=1 是点击事件触发的错误
     *   type=2 是异步回调函数触发的错误
     *   type=3 是计时器触发的错误
     * @param {String} info 附加信息
     */
    exports.addScriptErrorLog = addScriptErrorLog;

    /**
     * 点击事件
     * @param {Object} node zepto对象
     * @param {Function} func      事件绑定
     * @param {Object} opt 配置对象
     */
    exports.addEvent = addEvent;

    /**
     * 计时器
     */
    exports.setTimeout = function(func,time){
        return window.setTimeout(function(){
            try{
                func();
            }catch(e){
                addScriptErrorLog(e,3,func.toString().slice(0,100));
            }
        },time);
    }
    exports.setInterval = function(func,time){
        return window.setInterval(function(){
            try{
                func();
            }catch(e){
                addScriptErrorLog(e,3,func.toString().slice(0,100));
            }
        },time);
    }

    /**
     * 初始化debug
     */
    function init_debug(){
        if(isdebug()){
            //如果是debug模式，在底部新增一个标签
            $("body").append("<div style=\"\
                width: 50px;\
                height: 50px;\
                position: fixed;\
                right: 20px;\
                bottom: 50px;\
                line-height: 50px;\
                text-align: center;\
                z-index: 999999;\
                background-color: #222;opacity: 0.8;border-radius: 5px;color: white;font-size: 14px;\" id=\"debug_showlog\">log</div>");
            document.getElementById('debug_showlog').onclick = showLog;
        }
    }

    /**
     * 初始化
     * @param  {Function} errorHandle 错误处理函数
     */
    function error(errorHandle){
        if(isdebug()){
            //开启debug
            /**
             * 统一错误
             * @param  {String} cause 原因
             * @param  {String} url   链接
             * @param  {String} line  行数
             */
            window.onerror = function(cause,url,line,row,ReferenceError){
                /**
                 * 系统出了一点异常哦，我们的工程师正在紧张处理中...！
                 */
                //记录日志
                log();
                errorHandle(cause,url,line,row,ReferenceError);
            }
        }
    }

    function empty() {}

    /**
     * 是否开启了debug模式
     * @date   2014-12-15
     * @author p_jdslhuang(zerahuang)
     * @return {Boolean} 是否开启了debug模式
     */
    function isdebug(){
        return JSON.stringify(_debug) != "{}";
    }

    //去除undefined和空的值
    function clearObject(_o){
        var _ret = {};
        for(var i in _o){
            if(_o[i]){
                _ret[i] = _o[i];
            }
        }
        return _ret;
    }
    /**
     * 加载js
     * debug.loadScript({
     *     success: function,//成功的执行函数
     *     degrade: data,//降级处理
     *     cbname: string,//回调函数名字
     *     retry: num,//重试次数
     *     timeout: num,//超时时间
     *     url: string,//url
     *     data: boject,//参数数据
     *     cgikey: string, //缓存的key，如果有则设置缓存，如果没有，则不需要缓存
     *     dataType: jsonp|json
     * });
     */
    function loadScript(param,ext){
        if(typeof param == "string"){
            //是字符串
            var opt = {
                url: param,
                dataType : "jsonp",
                success : empty,
                error: empty
            };
        }else{
            //过滤空的数据
            param.data = clearObject(param.data);
            
            var opt = {
                url: param.url,
                dataType: param.dataType ? param.dataType : "jsonp",
                degrade: param.degrade,
                jsonpCallback: param.cbname,
                retryCount: param.retry,
                timeout: param.timeout / 1000,
                data: param.data,
                cgiKey: param.cgikey,
                success: function (data , settings) {
                    //记录日志
                    log({
                        cgi: param.url,
                        cbname: param.cbname,
                        type: 1
                    });
                    //这里增加try-catch的相关处理
                    try{
                        param.success && param.success(data,function(){
                            settings.setCache.apply({cgiKey:param.cgikey},[data]);
                        });
                    }catch(e){
                        addScriptErrorLog(e,2,param.success && param.success.toString().slice(0,100));
                    }
                },
                error: function (ret) {
                    
                }
            };
        }
        //兼容以前的onLoad的处理方式
        if(ext && ext.onLoad){
            opt.complete = ext.onLoad;
        }
        //发请求
        _ajax.load.apply(this, [opt]);
    }

    /**
     * 将数据记录在Log中
     */
    function log(opt){
        if(!isdebug()){
            return false;
        }
        if(!opt){
            opt = {};
        }
        //如果直接打日志的，则算自定义日志
        if(typeof opt == "string"){
            var _tmp = opt;
            opt = {};
            opt.data = _tmp;
            opt.type = 3;
        }
        
        //当前时间
        var nowtime = new Date();
        var option = {
            time:nowtime.getFullYear() + "/" + (nowtime.getMonth() + 1) + "/" + nowtime.getDate() + "&nbsp;" + nowtime.getHours() + ":" + nowtime.getMinutes() + ":" + (nowtime.getSeconds() + ":" + nowtime.getTime() % 1000),   //时间
            cgi:"",  //cgi链接
            cbname:"",   //目前的函数名
            data:null,  //打入log的数据
            params:arguments.callee.caller.arguments, //参数
            type:null   //为空则不计类型，1是接口回调，2是异常
        };
        for(var i in option){
            option[i] = opt[i] || option[i];
        }
        window.logs.push(option);
        //打入头部日志
        // JD.log.add(JSON.stringify(option));
    }
    
    /**
     * 上报异常日志
     */
    function report(){
        //初始化数据
        var reportInfo = JSON.stringify({ua:navigator.userAgent,url:location.protocol + "//" + location.host + location.pathname,logs:window.logs.concat().reverse()});
        reportInfo = reportInfo.slice(0,4900);
        var sendData = serialize({
                biztype:biztype,
                msgcontent:reportInfo,
                platform:isMqq()?"1":"2",
                callback:"hello"
            });
        //发送ajax请求
        ajax({
            url:"//party.wanggou.com/tws64/appointment/CommonAppointSubmit",
            type:"post",
            data:sendData,
            success:function(data){
                if(data.match(/iRet[^\d]+(\d+)/) && data.match(/iRet[^\d]+(\d+)/)[1] == "0"){
                    alert("上报成功！请勿重复上报，我们会尽快解决您的问题！");
                }else{
                    alert("上报失败！为了更好地定位到您的问题，如有需要，您可以把日志截图发给我们。");
                }
            },error:function(){}
        });
        
        /**
         * 序列化
         * @date   2014-12-15
         * @author p_jdslhuang(zerahuang)
         * @param  {Object}   o 要序列化的对象
         * @return {String}     序列化之后的数据
         */
        function serialize(o){
            var _r = "";
            for(var i in o){
                _r += (i + "=" + o[i] + "&");
            }
            return _r;
        }

        /**
         * ajax方法
         * @date   2014-12-15
         * @author p_jdslhuang(zerahuang)
         * @param  {Object}   opt 请求内容
         */
        function ajax(opt){
            if(!document.getElementById("debug_iframe")){
                //没有新建过,新建iframe
                var ifr = document.createElement("iframe");
                ifr.style.width = "1px";
                ifr.style.height = "1px";
                ifr.style.position = "absolute";
                ifr.style.top = "-100px";
                ifr.id = "debug_iframe";
                //跨域操作需要的中转页
                ifr.src = "//party.wanggou.com/promote/2014/cross.html";
                document.body.appendChild(ifr);
            }
            //轮询看是否加载完了
            var _t = setInterval(function(){
                if(document.getElementById("debug_iframe").contentWindow && document.getElementById("debug_iframe").contentWindow.ajax){
                    document.getElementById("debug_iframe").contentWindow.ajax(opt);
                    clearInterval(_t);
                }
            },100);
        }

        /**
         * 查询是否是QQ
         * @author zerahuang(p_jdslhuang)
         * @version 2014-10-10
         */
        function isMqq(){
            var ua = navigator.userAgent.toLowerCase();
            return /qq\/(\/[\d\.]+)*/.test(ua) || /qzone\//.test(ua);
        }
    }
    
    /**
     * 显示日志信息
     * @date   2014-12-15
     * @author p_jdslhuang(zerahuang)
     * @modify by kejunsheng
     */
    function showLog(){
        //删除原来的节点
        document.getElementById('debug') && document.body.removeChild(document.getElementById('debug_style')) && document.body.removeChild(document.getElementById('debug'));
        //初始化变量
        var _style = document.createElement('style'),
            _el = document.createElement('div'),
            _html = '<div class="debug_top">访问日志：<a href="javascript: ;" id="debug_close">返回</a></div>',
            _tpl_info = '<div class="debug_info"><span>用户uin：{uin}</span><span>当前环境：{env}</span></div>',
            _tpl_li = '<li><div class="debug_brief"><span>{info}</span><a href="javascript: ;" class="debug_see">查看详情</a></div><div class="debug_detail">{detail}</div></li>';

        //添加样式
        _style.innerHTML = "#debug{position:fixed;top:0;left:0;z-index:111111;box-sizing:border-box;padding:10px;width:100%;height:100%;background-color:#333;color:#FFF}.debug_top{margin-bottom:20px;border-bottom:1px solid #aaa}#debug_close{float:right;color:#FFF}.debug_info{margin-bottom:5px;color:wheat}.debug_info span{display:inline-block;width:49%}ul.debug_list{overflow-y:scroll;margin-bottom:20px;height:86%;color:#fff;word-break: break-all;padding:0}ul.debug_list li{padding:5px 0;border-bottom:1px dashed #888;color: #fff;}.debug_brief{position:relative;max-height: 42px;overflow: hidden;}ul.debug_list li span{margin-right: 80px;line-height: 21px;overflow: hidden;text-overflow: ellipsis;display: -webkit-inline-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;}.debug_see{color:#FFF;margin-right:10px;position:absolute;right:0;bottom:0}.debug_detail{display:none;padding-top:10px;border-top: 1px dashed #444;}";

        
        //添加id
        _style.setAttribute('id', 'debug_style');
        _el.setAttribute('id', 'debug');
        //拼接信息部分的html
        _html += _tpl_info.replace('{uin}', getUin).replace('{env}', env);
        //拼接接口信息部分
        _html += '<ul class="debug_list">';
        //这里应该倒叙输出
        window.logs.concat().reverse().forEach(function(ceil, index){
            if(ceil.data == null){
                var _cginame = "";
                if(ceil.cgi.indexOf('?') == -1){
                    _cginame = ceil.cgi.substring(ceil.cgi.lastIndexOf('/')+1);
                }else{
                    _cginame = ceil.cgi.substring(ceil.cgi.lastIndexOf('/')+1, ceil.cgi.indexOf('?'));
                }
                var _info = '【'+ (index+1) +'】<a style="color:#00c853">接口</a>&nbsp;：'+ _cginame;
                //添加返回码
                _info += '，'+ getRetInfo(ceil.params[0]);
                //添加时间
                _info += '，time：'+ceil.time.substring(ceil.time.indexOf(';')+1);
                //拼接html
                _html += _tpl_li.replace('{info}', _info).replace('{detail}', JSON.stringify(ceil));
            }else{
                var _startwith = '【'+ (index+1) +'】' + (ceil.type == 2 ? "<a style=\"color:red\">异常</a>&nbsp;：" : ceil.type == 3 ? "<a style=\"color:yellow\">自定义</a>&nbsp;：" : "");
                var _time = '<br>时间：'+ceil.time.substring(ceil.time.indexOf(';')+1);
                if(typeof ceil.data != 'object'){
                    _html += _tpl_li.replace('{info}', _startwith + ceil.data).replace('{detail}', ceil.data + _time);
                }else{
                    _html += _tpl_li.replace('{info}', _startwith + JSON.stringify(ceil.data)).replace('{detail}', JSON.stringify(ceil.data) + _time);
                }
            }
        });
        //设置debug本体的html
        _el.innerHTML = _html;
        //添加对应的元素
        document.body.appendChild(_style);
        document.body.appendChild(_el);
        //添加绑定事件
        var _t = document.getElementsByClassName('debug_see');
        for(var i=0,_len=_t.length; i<_len; i++){
            _t[i].onclick = function(){
                if(this.parentNode.nextSibling.style.display == 'none' || this.parentNode.nextSibling.style.display == ''){
                    hideDetail();
                    this.parentNode.nextSibling.style.display = 'block';
                }else{
                    this.parentNode.nextSibling.style.display = 'none';
                }
            };
        }
        document.getElementById('debug_close').onclick = function(){
            document.body.removeChild(_el);
            document.body.removeChild(_style);
        };
        //隐藏全部debug_detail
        function hideDetail(){
            var _detail = document.getElementsByClassName('debug_detail');
            for(var i=0,_len=_detail.length; i<_len; i++){
                _detail[i].style.display = 'none';
            }
        }
        /*
        var tpl = "<div style=\"padding:10px;color:white;height: 100%;\">\
                        <div style=\"color: white;border-bottom: 1px solid #aaa;margin-bottom: 20px;\">访问日志：\
                            <div style=\"color: white;position: absolute;right: 10px;top: 10px;\">\
                                <a style=\"text-decoration: underline;\" id=\"debug_report\">日志上报</a>&nbsp;&nbsp;&nbsp;&nbsp;<a style=\"text-decoration: underline; color: white;\" id=\"debug_close\">返回</a>\
                            </div>\
                        </div>\
                        <p style=\"color:wheat;margin-bottom:10px;\">userAgent：{ua}</p>\
                        <ul style=\"height: 75%;overflow-y: scroll;\">{list}</ul>\
                    </div>";
        //新建错误日志浮层
        var el = document.createElement("div");
        el.setAttribute("style","width:100%;height:100%;background-color:#333;z-index:900;position:fixed;top:0px;left:0px;");
        //插入一条条的错误日志，倒叙输出
        var _t = "";
        for(var len = window.logs.length - 1 , i = len; i >= 0 ; i--){
            _t += "<li style='color:white;margin-bottom:20px;word-wrap:break-word;'>【"+(len - i + 1)+"】&nbsp;"+JSON.stringify(window.logs[i])+"</li>";
        }
        el.innerHTML = tpl.replace("{list}",_t).replace("{ua}",navigator.userAgent);
        document.body.appendChild(el);
        //点击关闭错误日志浮层
        document.getElementById("debug_close").onclick = function(){
            document.getElementById("debug_report").onclick = document.getElementById("debug_close").onclick = null;
            document.body.removeChild(el);
        }
        //点击上报错误日志
        document.getElementById("debug_report").onclick = function(){
            report();
        }
        */
    }

    /**
     * 设置参数值
     * @date   2014-12-15
     * @author p_jdslhuang(zerahuang)
     * @param  {String}   name         参数名
     * @param  {String}   defaultValue 默认参数值
     */
    function setParam(name,defaultValue){
        return (_debug.param && _debug.param[name]) ? _debug.param[name] : defaultValue;
    }

    /**
     * 获取用户的uin
     * @date   2015-12-17
     * @author kejunsheng
     */
    function getUin(){
        var uin=cookie.get("wg_uin")||cookie.get("uin")||cookie.get('uin_cookie')||cookie.get('pt2gguin')||cookie.get('o_cookie')||cookie.get('luin')||cookie.get('buy_uin');
        return uin?parseInt(uin.replace("o",""),10):""; 
    }

    /**
     * 获取接口对应的ret
     * @date   2015-12-17
     * @author kejunsheng
     */
    function getRetInfo(param){
        var _ret_arr = ['ret', 'retcode', 'retCode', 'errorcode', 'errorCode', 'errcode', 'errCode', 'iret', 'iRet', 'errno', 'errNo'];
        var _result = '';
        _ret_arr.some(function(ceil){
            if(param[ceil] || param[ceil] == 0){
                _result = ceil + "：" + param[ceil];
                return true;
            }
        });
        return _result;
    }

    /**
     * 添加错误日志
     * @param {Object} e 事件
     * @param {String} type 事件类型
     *   type不填 是默认顺序执行代码的错误(包括export.init和onhashchange事件)
     *   type=1 是点击事件触发的错误
     *   type=2 是异步回调函数触发的错误
     *   type=3 是计时器触发的错误
     * @param {String} info 附加信息
     */
    function addScriptErrorLog(e,type,info){
        var _index = 0 , _stack = e.stack.split(/\n/) , _mess = [];
        _stack.some(function(ceil,index){
            if(/\.[sx]?html/.test(ceil)){
                return true;
            }
            _index = index;
        });
        _stack.slice(0,_index + 1).filter(function(ceil){return !/zepto(\.\d+)?\.js:\d+:\d+/.test(ceil)}).forEach(function(ceil){
            var _files = ceil.match(/\/[^\/]+\.js/g);
            var _pos = ceil.match(/:(\d+:\d+)(\))?$/);
            if(_files){
                var _row = _pos ? _pos[1].split(":")[0] : 0;
                var _col = _pos ? _pos[1].split(":")[1] : 0;
                var _func = ceil.replace(/^\s*at/,"").trim().match(/^[^@\s]+/);
                if(_files.length == 1){
                    //只有一项的
                    var _name = _files[0].replace(/\//,"");
                }else{
                    //可能有很多js聚合的
                    var _name = "聚合的JS";
                }
                var _messtr = _name + " 文件 " + _row + "行" + _col + "列的 " + (_func && _func[0].trim() != ceil.replace(/^\s*at/,"").trim() ? _func[0] : "匿名") + " 方法报错";
            }else{
                var _messtr = ceil;
            }
            _mess.push(_messtr);
        });
        var infomess = (info ? info : "") + (type == 1 ? "(点击触发)" : type == 2 ? "(异步回调触发)" : type == 3 ? "(计时器触发)" : "");
        //打入日志
        log({type:2,data:e.message + (infomess ? "<br><a style='color:lawngreen'>相关信息</a>：" + infomess + "</a>" : "") + (_mess.length > 0 ? ("<br><a style='color:lawngreen'>堆栈信息</a>：<br>" + _mess.join("<br>")) : "")}); 
        //再抛出异常
        throw e;
    }

    /**
     * 点击事件
     * @param {Object} node zepto对象
     * @param {Function} func      事件绑定
     * @param {Object} opt 配置对象
     */
    function addEvent(node,func,opt){
        var option = {
            name : opt && opt.name ? opt.name : env == "pc" ? "click" : "tap",
            type : opt && opt.type ? opt.type : "on",
            clear: opt && typeof opt.clear != "undefined" ? opt.clear : true
        };

        if(option.type == "live"){
            node.live(option.name,function(){
                try{
                    func.apply(this);
                }catch(e){
                    addScriptErrorLog(e,1,func.toString().replace(/[\s\r\n]/g,"").slice(0,100));
                }
            });
        }else{
            if(option.clear){
                node.off();
            }
            node.on(option.name,function(){
                try{
                    func.apply(this);
                }catch(e){
                    addScriptErrorLog(e,1,func.toString().replace(/[\s\r\n]/g,"").slice(0,100));
                }
            });
        }
    }
});