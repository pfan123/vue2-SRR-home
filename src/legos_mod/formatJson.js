define('formatJson', function(require, exports, module){
    var _cacheThisModule_;
    var _formatJson_cache = {};
    
	$formatJson=function(str, data){
   	 	/* 模板替换,str:模板id或者内容，data:数据内容
			\W：匹配任何非单词字符。等价于 '[^A-Za-z0-9_]'。 
			如果是id,并且cache中有值，直接返回，否则获取innerHTML，再次解析；
			如果不是id，解析并存入cache
		 */
		var fn = !/\W/.test(str)?
			_formatJson_cache[str]=_formatJson_cache[str] || $formatJson(document.getElementById(str).innerHTML) :
				new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +
					"with(obj){p.push('" +str
					.replace(/[\r\t\n]/g, " ")
					.split("<%").join("\t")
					.replace(/((^|%>)[^\t]*)'/g, "$1\r")
					.replace(/\t=(.*?)%>/g, "',$1,'")
					.split("\t").join("');")
					.split("%>").join("p.push('")
					.split("\r").join("\\'") + "');}return p.join('');");
		return data ? fn( data ) : fn;
	}

	exports.formatJson = $formatJson;
});