define('mqqStorage', function(require, exports, module) {
         var _cacheThisModule_;
    	var	isInQQ = ((/qq\/([\d\.]+)*/).test(navigator.userAgent)),
     		supportDataApi=isInQQ&&window.mqq&&mqq.compare("4.6")>=0,
     		cfg={
     			prefix:"$lc_",//缓存前缀
     			expire:1440,//默认有效期1天，分钟
     			callId:1,//手Q api需要的参数，暂时写死
     			path:"wanggouH5data"//手Q api需要的参数，暂时写死
     		};
     	/*  手机qq返回给callback的参数格式示例:{"ret":0,"response":{"data":"20140811","callid":"811"}}
  			ret=0成功读写数据,写入、删除时没有response.data*/
  		var _cache = require("./cachev1");
  			
     	function writeH5Data(key,data,callback,exp){
     		try{
     			var now=new Date(),
     				myKey=cfg.prefix+key,
     				callback=callback?callback:empty(),     				
     				myData=JsonToStr({
	     				value:data,
	     				expire:now.setMinutes(now.getMinutes()+(exp||cfg.expire))
	     			});
	     		if(supportDataApi){
	     			mqq.data.writeH5Data({
	     				callid:cfg.callId,
	     				path:cfg.path,
	     				key:myKey,
	     				data:myData     
	     			},function(res){
	     				callback(res.ret==0);
	     			});
	     		}else{
	     			_cache.session.setItem(myKey, myData, (exp||cfg.expire) * 60, function(ret){
	     				if(ret == 0){
	     					callback(true);
	     				}else{
	     					callback(false);	
	     				}
	     			});
	 				//sessionStorage.setItem(myKey,myData);
	 				//callback(true);
	     		}
	     	}catch(e){
     			callback(false);
     		}
     	};
     	function readH5Data(key,callback){
     		try{
     			var myKey=cfg.prefix+key;
     			callback=callback?callback:empty();
	     		if(supportDataApi){
	     			mqq.data.readH5Data({
	     				callid:cfg.callId,
	     				path:cfg.path,
	     				key:myKey
	     			},function(res){
	     				if(res.ret!=0){
	     					callback(null,false);
	     					return ;
	     				}
	     				var d=StrToJson(res.response.data),
	     					now=new Date();
	     				if(!d){
	     					callback(null,false);
	     					return ;
	     				}
	     				if(d.expire>now.getTime()){
	     					callback(d.value,true);
	     				}else{
	     					mqq.data.deleteH5Data({
			     				callid:cfg.callId,
			     				path:cfg.path,
			     				key:myKey
			     			});
			     			callback(null,false);
	     				}
	     			});
	     		}else{
	     			var d=getStorageObj(myKey);
	     			callback(d?d.value:null,d?true:false);
	     		}
	     	}catch(e){
     			callback(null,false);
     		}
     	};
     	
     	function deleteH5Data(key,callback){
     		try{
     			var myKey=cfg.prefix+key;
     			callback=callback?callback:empty();
	     		if(supportDataApi){
	     			mqq.data.deleteH5Data({
	     				callid:cfg.callId,
	     				path:cfg.path,
	     				key:myKey
	     			},function(res){
	     				callback(res.ret==0);
	     			});
	     		}else{
	     			//sessionStorage.removeItem(key);
	     			_cache.session.removeItem(key);
	     			callback(true);
	     		}
     		}catch(e){
     			callback(false);
     		}
     	};
     	
     	function JsonToStr(o) {
			if (o == undefined) {
				return "";
			}
			if (JSON && JSON.stringify) { //ie8以上都支持
				return JSON.stringify(o);
			} else {
				var r = [];
				if (typeof o == "string") return "\"" + o.replace(/([\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
				if (typeof o == "object") {
					if (!o.sort) {
						for (var i in o)
							r.push("\"" + i + "\":" + JsonToStr(o[i]));
						if ( !! document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString)) {
							r.push("toString:" + o.toString.toString());
						}
						r = "{" + r.join() + "}"
					} else {
						for (var i = 0; i < o.length; i++)
							r.push(JsonToStr(o[i]))
						r = "[" + r.join() + "]";
					}
					return r;
				}
				return o.toString().replace(/\"\:/g, '":""');
			}
		}
		
		function StrToJson(str){
			try{
				if (JSON && JSON.parse) {
					return JSON.parse(str);
				} else {
					return eval('(' + str + ')');
				}
			}catch(e){
				return null;				
			}
		}
		
			//获取storage对象
		function getStorageObj(name) {
			var storageObj, timeNow = new Date();
			//storageObj =  StrToJson(sessionStorage.getItem(name));
			storageObj = StrToJson(_cache.session.getItem(name));
			if (storageObj && timeNow.getTime() < storageObj.expire) {
				return storageObj;
			} else {
				//sessionStorage.removeItem(name);
				_cache.session.removeItem(name);
				return null;
			}
		}
		
		function empty(){
			return function(){};
		}
	
	return {
		writeH5Data:writeH5Data,
		readH5Data:readH5Data,
		deleteH5Data:deleteH5Data
	};
});
