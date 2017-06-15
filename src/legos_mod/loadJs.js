define('loadJs', function(require, exports, module) {
    var _cacheThisModule_;
    var ck = require('./cookie');
    /*cgi302报告*/
    var callbackNameCount={},letterMap=['Z','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    function transToLetter(num){//某些接口回调函数不能有数字，真是坑爹
        var arr=(num+'').split(''),v = [];
        for(var i=0;i<arr.length;i++){
            v.push(letterMap[arr[i]])
        }
        return v.join('');
    }
    function callbackNameUnique(str){
        if(!callbackNameCount[str]){
            callbackNameCount[str]=1;
        }else{
            callbackNameCount[str]+=1;
        }
        return str+transToLetter(callbackNameCount[str]);
    }
    function ignoreUrl(url){
        //文案系统特殊，不作此监测，滤掉
        //wqs.jd.com下的静态容灾文件滤掉
        //卖块接口做容灾期望回调名参数不要频繁变化，也过滤掉
        return url.indexOf('wq.360buyimg.com')>-1 || url.indexOf('wqs.jd.com')>-1 || url.indexOf("wq.jd.com/mcoss/mmart/show")>-1 || url.indexOf("wq.jd.com/mcoss/mmart/mshow")>-1 || url.indexOf("wq.jd.com/mcoss/spematerial/spematerialshow")>-1|| url.indexOf("wq.jd.com/mcoss/keyword/keywordsearch")>-1|| url.indexOf("wq.jd.com/mcoss/focusbi/show")>-1 || url.indexOf("wq.jd.com/mcoss/brandspecial/show")>-1 || url.indexOf("btshow.jd.com/queryBtPlanInfo.do")>-1;
    }
    /*cgi302报告*/
    function sendJs(url,opt) {
    	var option={
    		onLoad:null,//成功时回调函数
    		onError:null,//加载错误时回调函数
            onTimeout:null,//超时时回调函数
            timeout:8000,//超时时间
    		isToken:true,//是否需要token，默认需要
            keepProtocol:false,//是否需要保留协议前缀，默认不需要
    		charset:"utf-8",//默认字符集
            setReportUrl:""//设置上报url，应该定义为一个function，返回值就是接口出时候的上报url，默认取当前url，并且通过window.CGI302ReportKeepUrl控制当前页是否需要去除接口中的参数
    	};
        var timer;
        var clear = function(){
            if(!el){return ;}
            timer && clearTimeout(timer);
            el.onload = el.onreadystatechange = el.onerror = null;
            el.parentNode&&(el.parentNode.removeChild(el));
            el = null;
        }
    	if(arguments.length==1){
    		if(typeof arguments[0]=="object"){//只有一个参数，且参数为json对象的情况
    			opt=arguments[0];
    			url=opt.url;
    		}else{//只有一个参数，且参数字符串(url地址)的情况
    			opt={};
    		}
    	}
        /*增加键值对data参数支持*/
        if(typeof(opt.data)=='object'){
            var param=[];
            for(var k in opt.data){param.push(k+'='+opt.data[k])}
            if(param.length>0){
                param=param.join('&');
                url+=(url.indexOf('?')>0?'&':'?')+param;
            }
        }
        /*增加键值对data参数支持*/
    	for(var i in opt){
    		if(opt.hasOwnProperty(i)){
    			option[i]=opt[i];
    		}
    	}
		var el=document.createElement("script");
		el.charset=option.charset||"utf-8";
        var needCheck=false;//是否需要上报接口调用异常
        var cgiLoadOK=false;//接口是否加载完成
        var reportUrl= "";//接口上报的url
        
		if(opt.setReportUrl && typeof opt.setReportUrl=="function"){//自定义上报url的钩子函数，这个钩子函数需要返回一个字符串，就是当前的上报url
            reportUrl = opt.setReportUrl();//执行钩子函数，返回上报url
            !reportUrl&&(reportUrl=url);//兼容钩子函数返回异常的情况
        }else{//window.CGI302ReportKeepUrl控制页面的所有请求是需要上报完整的url，还是说仅仅路径部分,不设置的情况下仅仅上报路径部分
            reportUrl = window.CGI302ReportKeepUrl?url:url.replace(/\?.*/,'');
        }
        el.onload = el.onreadystatechange = function() {
			if(/loaded|complete/i.test(this.readyState) || navigator.userAgent.toLowerCase().indexOf("msie") == -1) {
	            option.onLoad&&option.onLoad();//加载成功之后的回调
                if(needCheck &&!cgiLoadOK){//接口302到error也会onload触发，但是cgiLoadOK仍为false
                    if(window.JD){
                        JD.report.umpBiz({bizid:24,operation:3,result:"1",source:0,message:reportUrl});
                    }
                    window.onerror('','','','',{stack:'servererror:'+reportUrl});
                    console.log('loadJs Failed:'+url);
                }
                clear();
			}
		};
		el.onerror = function(){
			option.onError&&option.onError();//加载错误时的回调
			clear();
		};
        var targetUrl=option.isToken?addToken(url,"ls"):url;
        /*cgi302报告*/
        if(!ignoreUrl(targetUrl)){
            var originFunctionName;
            var newFunctionName;
            var originFunction;
            var newUrl = targetUrl.replace(/callback=([^&]+)/,function(a,b){
                originFunctionName = b;
                newFunctionName=callbackNameUnique(originFunctionName);
                return 'callback='+newFunctionName;
            });
            if(originFunctionName&&window[originFunctionName]){
                needCheck=true;
                targetUrl = newUrl;
                originFunction=window[originFunctionName];
                window[newFunctionName]=function(d){
                    //cgi正确完成，不是302到error.html,会先跑完callback，再出发script onLoad,
                    //如果在onload事件里cgiLoadOK还是false，则说明是接口返回不对,对于那些不支持callback参数的接口，这里就管不到了
                    cgiLoadOK=true;
                    originFunction(d);
                };
            }
        }    
        //通过通用代理接口中转请求，需要配置白名单
        targetUrl=huidu(targetUrl);
		el.src = option.keepProtocol?targetUrl:targetUrl.replace(/^http(s?):/,"");
		document.getElementsByTagName('head')[0].appendChild(el);
        if (typeof option.onTimeout=="function") {
            timer = setTimeout(function(){
                option.onTimeout();
            },option.timeout);
        }
        console.log('loadJs request:'+el.src);
	};	
	function huidu(url){
        var posturl=url;
        if(window.huidu_cgi&&window.huidu_cgi.length>0){
            var filtercgi=window.huidu_cgi.filter(function(el){return window.location.href.indexOf(el.pageUrl)>=0&&window.location.href.indexOf(el.pageUrl)<10;});
            if(filtercgi.length>0&&(filtercgi[0].isAll=='1'||filtercgi[0].cgiList.filter(function(el){return url.indexOf(el.cgi)>=0&&url.indexOf(el.cgi)<10;}).length>0)){
                var uin = ck.get("wq_uin") || ck.get('wg_uin'),
                    tmp = (uin || '0').substr(-3);

                if(parseInt(tmp)<parseInt(filtercgi[0].ratio)||filtercgi[0].whitelist.split(';').indexOf(uin)>=0){
                    posturl='//wq.jd.com/httpsproxy/showinfo?url='+encodeURIComponent(location.protocol+url.replace(/^http(s?):/,""));
                    posturl=addToken(posturl,"ls");
                }
            }
        }
        return posturl;
        

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
    	var skey=ck.get("wq_skey"),
    		token=skey==null?"":time33(skey);
    	return token;
    };
    
    function time33(str){
        //哈希time33算法
        for(var i = 0, len = str.length,hash = 5381; i < len; ++i){
           hash += (hash << 5) + str.charAt(i).charCodeAt();
        }
        return hash & 0x7fffffff;
    }
	
    /**
        延时执行sendJs，延时发出请求，确保部分callback函数定义在请求后面的情况，也能在逻辑中捕捉到calback名字
    */
	exports.loadScript = function(url,opt){
        var args = [].slice.call(arguments);
        setTimeout(function(){
            sendJs.apply(null,args);
        },0);
    };
	exports.addToken = addToken;
});