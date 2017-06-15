/**
 * ajax组件支持json和jsonp，iframe post三种方式
 * @author xingzhizhou
 * @version 2015/7/20
 * @description. 从zepto独立出来的ajax组件，支持重试，临时缓存，降级
 */
define("ajax", function (require, exports, module) {
    /**
     * 使用说明：http://cf.jd.com/pages/viewpage.action?pageId=77243321
     * 单元测试地址：http://wqs.jd.com/my/ajaxtest.shtml
     */
    var _cacheThisModule_;

    //globalLock为true时，接口加载标识
    var loading = false;

    //临时缓存，传了cgiKey，启用临时缓存
    var dataCache = {};

    var ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        retryCount: 0,     //重试次数
        globalLock: 0,     //全局锁
        lockCallback: null, //设置了全局锁，lock时的回调
        cgiKey: false,    //缓存，接口数据缓存
        setCache: function(data){ //成功回调的方法决定数据是否应该缓存，组件不主动缓存数据
            if(!this.cgiKey){
                throw Error("cgiKey不能为空");
            }
            dataCache[this.cgiKey] = data;
        },
        degrade: false,  //降级，接口失败时返回预先配置的数据
        // Transport
        xhr: function () {
            return new window.XMLHttpRequest()
        },
        dataType: 'json',
        // MIME types mapping
        // IIS returns Javascript as "application/x-javascript"
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json:   'application/json',
            xml:    'application/xml, text/xml',
            html:   'text/html',
            text:   'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 8,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: false,
        //是否单元测试模式
        wqunit: /[?&]_wqunit_=1/.test(location.search),
        setReportUrl:""//设置上报url，应该定义为一个function，返回值就是接口出时候的上报url，默认取当前url，并且通过window.CGI302ReportKeepUrl控制当前页是否需要去除接口中的参数
    }

    var jsonpID = 0;

    //jsonp callback方法的后缀解决一些接口的callback方法不支持数字的问题
    var callbackSuffix = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', "L", 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];

    var reportUrl = "";

    exports.load = ajax;

    exports.addToken = addToken;

    function ajax(options){
        if(!options)return false;
        var settings = options;
        for (key in ajaxSettings){
            typeof settings[key] == 'undefined' && (settings[key] = ajaxSettings[key]);
        }

        //上一个请求还没有响应完毕
        if(settings.globalLock){
            if(loading){
                console.log("ajax loading ...");
                settings.lockCallback && settings.lockCallback();
                return false;
            }
            loading = true;
        }

        //兼容活动组的cgiData（用户cgi返回数据缓存）全局变量
        if(settings.cgiKey){
            window.cgiData = dataCache;
        }

        //临时缓存
        if(settings.cgiKey && dataCache[settings.cgiKey]){
            console.log("ajax命中临时缓存");
            settings.isCache = 1;
            ajaxSuccess(dataCache[settings.cgiKey], "", settings);
            return false;
        }

        //如果当前域名是ppms.jd.com（dev预览）一律采用jsonp
        if(location.hostname == "ppms.jd.com"){
            settings.dataType = 'jsonp';
        }

        settings.url = settings.url.replace(/^http:/, "");

        if(settings.setReportUrl && typeof settings.setReportUrl=="function"){//自定义上报url的钩子函数，这个钩子函数需要返回一个字符串，就是当前的上报url
            reportUrl = settings.setReportUrl();//执行钩子函数，返回上报url
            !reportUrl&&(reportUrl = settings.url);//兼容钩子函数返回异常的情况
        }else{//window.CGI302ReportKeepUrl控制页面的所有请求是需要上报完整的url，还是说仅仅路径部分,不设置的情况下仅仅上报路径部分
            reportUrl =  window.CGI302ReportKeepUrl ? settings.url : settings.url.replace(/\?.*/,'');
        }

        //判断是否跨域
        if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) &&
            RegExp.$2 != window.location.host;

        if(settings.crossDomain)settings.xhrFields = {withCredentials: true};

        if (!settings.url) settings.url = window.location.toString();
        serializeData(settings);

        var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url);
        if (hasPlaceholder) dataType = 'jsonp';

        if (settings.cache === false || (
                (!options || options.cache !== true) &&
                ('script' == dataType || 'jsonp' == dataType)
            ))
            settings.url = appendQuery(settings.url, '_=' + Date.now());

        if ('jsonp' == dataType || settings.wqunit) {
            if (!hasPlaceholder){
                settings.urlbak = settings.url;
                settings.url = appendQuery(settings.url,
                    settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
            }
            settings.url = addToken(settings.url, "ls");
            return ajaxJSONP(settings)
        }

        //post请求用form表单模拟
        if(settings.type.toLowerCase() == 'post' && settings.jsonpCallback){
            settings.url = addToken(settings.url, "fr");
            return ajaxPost(settings);
        }

        //如果是fiddler映射测试，修改域名解决跨域问题
        if(/[?&]ajaxtest=1/.test(location.search) && dataType == 'json')settings.url = settings.url.replace("http://wq.jd.com", "http://wqs.jd.com");

        settings.url = addToken(settings.url, "ajax");
        var mime = settings.accepts[dataType],
            headers = { },
            setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout;

        if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
        setHeader('Accept', mime || '*/*');
        if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

        if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
        xhr.setRequestHeader = setHeader;

        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout);
                var result, error = false;
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
                    result = xhr.responseText;

                    try {
                        // http://perfectionkills.com/global-eval-what-are-the-options/
                        if (dataType == 'script')    (1,eval)(result)
                        else if (dataType == 'xml')  result = xhr.responseXML
                        else if (dataType == 'json') result = /^\s*$/.test(result) ? null : parseJSON(result)
                    } catch (e) { error = e }
                    if (error) ajaxError(error, 'parsererror', xhr, settings)
                    else ajaxSuccess(result, xhr, settings)
                } else {
                    console.log("ajax error", xhr);
                    ajaxError(xhr.statusText || null, "load", xhr, settings)
                }
            }
        }


        var async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async, settings.username, settings.password);
        if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

        for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

        if (settings.timeout > 0) abortTimeout = setTimeout(function(){
            xhr.onreadystatechange = empty;
            xhr.abort();
            ajaxError(null, 'timeout', xhr, settings);
        }, settings.timeout*1000);

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null);
        return xhr
    }

    function parseJSON(data){
        if(!data || typeof(data) != "string" ){
            return data;
        }
        data = data.replace(/^\s+|\s+$/g, "");
        if(!data)return data;

        return JSON.parse(data);
    };

    function ajaxJSONP(options){
        var _callbackName = options.jsonpCallback,
            callbackName = (typeof _callbackName == 'function' ?
                    _callbackName() : _callbackName) || ('jsonpCBK' + (callbackSuffix[(jsonpID++)%callbackSuffix.length])),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            xhr = { abort: abort }, abortTimeout,
            abort = function(errorType) {
                isTimeout = 1;
                console.log(options.url, "timeout");
                ajaxError(null, "timeout", xhr, options);
            },
            isTimeout = 0;

        options.callbackName = callbackName;
        script.charset=options.charset||"utf-8";
        script.onload = script.onerror = function(e, errorType){
            clearTimeout(abortTimeout);
            if(isTimeout){
                console.log("timeout");
                return false;
            }
            if (e.type == 'error') {
                console.log(options.url, errorType || e.type || 'error');
                ajaxError(null, 'error', xhr, options);
            }else if(!responseData){
                ajaxError(null, e.type, xhr, options);
                window.onerror('','','','',{stack:'servererror:'+reportUrl});
            } else {
                //当wqunit中查询结果失败时，重新调用ajax方法，并且强制不走单元测试流程
                if(responseData[0] && responseData[0].retcode == -1 && responseData[0].message == "没有找到" && responseData[0].unitReload == 1){
                    options.wqunit = false;
                    options.url = options.urlbak;
                    ajax(options);
                }else{
                    ajaxSuccess(responseData[0], xhr, options);
                }
            }

            responseData = undefined;
            script.parentNode.removeChild(script);
        }

        window[callbackName] = function(){
            responseData = arguments;
        }

        options.url = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        script.src = options.url;

        //单元测试
        if(options.wqunit){
            script.src = "http://ppms.jd.com/wqunit/unittest?pageUrl=" + encodeURIComponent(location.href) + "&cgiUrl="+encodeURIComponent(script.src) + "&callback=" + callbackName;
        }
        document.head.appendChild(script);

        if (options.timeout > 0) abortTimeout = setTimeout(function(){
            abort('timeout');
        }, options.timeout*1000);

        return  xhr;
    }

    function ajaxPost(options){
        var _callbackName = options.jsonpCallback,
            callbackName = (typeof _callbackName == 'function' ?
                    _callbackName() : _callbackName) || ('jsonpCBK' + (callbackSuffix[(jsonpID++)%callbackSuffix.length])),
            abortTimeout,
            xhr = { abort: abort },
            abort = function(errorType) {
                isTimeout = 1;
                console.log(options.url, "timeout");
                ajaxError(null, "timeout", xhr, options);
            },
            isTimeout = 0;



        window[callbackName] = function(){
            clearTimeout(abortTimeout);
            responseData = arguments;
            ajaxSuccess(responseData[0], xhr, options);
        }

        //如果是跨域post请求，用form表单
        options.data.callback = callbackName;
        options.data.g_tk = getToken();
        formPost(options, options.isFile);

        if (options.timeout > 0) abortTimeout = setTimeout(function(){
            window[callbackName] = empty;
            abort('timeout');
        }, options.timeout*1000);
    }

    /**
     * 跨域的post请求用form模拟
     *
     */
    function formPost(options, isFile){
        var form = document.getElementById("ajaxPostForm");
        var iframe = document.getElementById("ajaxPostIframe");
        if(!form){
            form = document.createElement("form");
            form.id = "ajaxPostForm";
            iframe = document.createElement("iframe");
            iframe.height = 0;
            iframe.width = 0;
            iframe.id = iframe.name = "ajaxPostIframe";
            form.style.display = "none";
            document.body.appendChild(iframe);
            document.body.appendChild(form);
        }
        $("input", form).remove();
        for(var i in options.data){
            var tempInput = document.createElement("input");
            $(form).append($(tempInput).attr("type", "hidden").attr("name", i).attr("value", options.data[i]));
        }
        form.target = "ajaxPostIframe";
        form.action = options.url;
        form.method = "POST";
        form.enctype = isFile ? "multipart/form-data" : "application/x-www-form-urlencoded";
        form.submit();
    }

    function ajaxSuccess(data, xhr, settings) {
        settings.globalLock && (loading = false);
        var context = settings.context, status = 'success';
        console.log(settings.url, data);
        settings.success.call(context, data, settings, status, xhr);
        ajaxComplete(status, xhr, settings);
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
        //post不重试，未设置retry或设置非true和数字不重试
        if(settings.retryCount <= 0 || settings.type.toLowerCase() == 'post'){
            //don't retry
            ajaxErrorCallback(error, type, xhr, settings);
            return;
        }

        //不再重试范围的type，则重试
        if(["error","parsererror"].indexOf(type) >= 0){
            ajaxErrorCallback(error, type, xhr, settings);
            return;
        }
        //增加settimeout让原代码全部执行完成吧。
        setTimeout(function(){
            //去除临时加上的参数
            settings.url = settings.url.replace(/(&)?(_|g_tk|g_ty|callback)=\w+/g, "");
            console.log("start retry," + settings);
            //重试次数减1
            settings.retryCount--;
            //重试
            settings.globalLock && (loading = false);
            ajax(settings);
        },0);
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxErrorCallback(error, type, xhr, settings){
        settings.globalLock && (loading = false);
        var context = settings.context;
        console.log(settings.url, type, error);
        //降级，降级后还是要回调error，监控上报
        if(settings.degrade){
            console.log("降级", settings.degrade);
            settings.isDegrade = 1; //标识被降级
            settings.success.call(context, settings.degrade, settings);
            //return false;
        }
        settings.error.call(context, type, settings, error, xhr);
        ajaxComplete(type, xhr, settings);
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context;
        settings.complete.call(context, status, xhr);
    }

    function empty() {}

    function serializeData(options) {
        if (options.processData && options.data && typeof options.data != "string"){
            if(options.type.toLowerCase() == 'post' && options.jsonpCallback){
                return;
            }
            options.data = param(options.data);
        }
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
            options.url = appendQuery(options.url, options.data), options.data = undefined
    }

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0]
        return mime && ( mime == htmlType ? 'html' :
                mime == jsonType ? 'json' :
                    scriptTypeRE.test(mime) ? 'script' :
                    xmlTypeRE.test(mime) && 'xml' ) || 'text'
    }

    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    function addToken(url,type){
        //type标识请求的方式,ls表loadscript，j132标识jquery，j126标识base，lk标识普通链接,fr标识form表单,ow打开新窗口
        var token=getToken();
        //只支持http和https协议，当url中无协议头的时候，应该检查当前页面的协议头
        if(url=="" || (url.indexOf("://")<0?location.href:url).indexOf("http")!=0){
            return url;
        }
        if(url.indexOf("#")!=-1){
            var f1=url.match(/\?.+\#/);
            if(f1){
                var t=f1[0].split("#"),newPara=[t[0],"&g_tk=",token,"&g_ty=",type,"#",t[1]].join("");
                return url.replace(f1[0],newPara);
            }else{
                var t=url.split("#");
                return [t[0],"?g_tk=",token,"&g_ty=",type,"#",t[1]].join("");
            }
        }
        //无论如何都把g_ty带上，用户服务器端判断请求的类型
        return token==""?(url+(url.indexOf("?")!=-1?"&":"?")+"g_ty="+type):(url+(url.indexOf("?")!=-1?"&":"?")+"g_tk="+token+"&g_ty="+type);
    };

    function getToken(){
        var skey=getCookie("wq_skey"),
            token=skey==null?"":time33(skey);
        return token;
    };

    function time33(str){
        //哈希time33算法
        for(var i = 0, len = str.length,hash = 5381; i < len; ++i){
            hash += (hash << 5) + str.charAt(i).charCodeAt();
        };
        return hash & 0x7fffffff;
    }

    function getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"), val = document.cookie.match(reg);
        return val ? (val[2] ? unescape(val[2]) : "") : null;
    }

    var escape = encodeURIComponent

    function serialize(params, obj){
        for(var key in obj){
            params.add(key, obj[key]);
        }
    }

    function param(obj){
        var params = []
        params.add = function(k, v){ this.push(escape(k) + '=' + escape(v)) }
        serialize(params, obj)
        return params.join('&').replace(/%20/g, '+')
    }

    //与子iframe传递消息---域名不同
    window.addEventListener('message', function (e){
        if(!e || !e.data)return false;
        var callback = e.data.callback;
        if(callback && window[callback]){
            window[callback](e.data.data);
        }
    });

    //if(typeof $ != 'undefined')$.ajax = ajax;
});