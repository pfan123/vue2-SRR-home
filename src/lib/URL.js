export default function URL(sURL,args){

    function parseParam(oSource, oParams, isown){
        var key, obj = {};
        oParams = oParams || {};
        for (key in oSource) {
            obj[key] = oSource[key];
            if (oParams[key] != null) {
                if (isown) {// 仅复制自己
                    if (oSource.hasOwnProperty[key]) {
                        obj[key] = oParams[key];
                    }
                }
                else {
                    obj[key] = oParams[key];
                }
            }
        }
        return obj;
    };

    function parseURL(url){
        var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        var names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'];
        var results = parse_url.exec(url);
        var that = {};
        for (var i = 0, len = names.length; i < len; i += 1) {
            that[names[i]] = results[i] || '';
        }
        return that;
    };

    function isArray(o){
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    function trim(str){
        if(typeof str !== 'string'){
            throw 'trim need a string as parameter';
        }
        var len = str.length;
        var s = 0;
        var reg = /(\u3000|\s|\t|\u00A0)/;
        
        while(s < len){
            if(!reg.test(str.charAt(s))){
                break;
            }
            s += 1;
        }
        while(len > s){
            if(!reg.test(str.charAt(len - 1))){
                break;
            }
            len -= 1;
        }
        return str.slice(s, len);
    };
    function _fdata(data,isEncode){
        data = data == null? '': data;
        data = trim(data.toString());
        if(isEncode){
            return encodeURIComponent(data);
        }else{
            return data;
        }
    };
    function jsonToQuery(JSON,isEncode){
        var _Qstring = [];
        if(typeof JSON == "object"){
            for(var k in JSON){
                if(k === '$nullName'){
                    _Qstring = _Qstring.concat(JSON[k]);
                    continue;
                }
                if(JSON[k] instanceof Array){
                    for(var i = 0, len = JSON[k].length; i < len; i++){
                        _Qstring.push(k + "=" + _fdata(JSON[k][i],isEncode));
                    }
                }else{
                    if(typeof JSON[k] != 'function'){
                        _Qstring.push(k + "=" +_fdata(JSON[k],isEncode));
                    }
                }
            }
        }
        if(_Qstring.length){
            return _Qstring.join("&");
        }else{
            return "";
        }
    };
    function queryToJson(QS, isDecode){
        var _Qlist = trim(QS).split("&");
        var _json  = {};
        var _fData = function(data){
            if(isDecode){
                return decodeURIComponent(data);
            }else{
                return data;
            }
        };
        for(var i = 0, len = _Qlist.length; i < len; i++){
            if(_Qlist[i]){
                var _hsh = _Qlist[i].split("=");
                var _key = _hsh[0];
                var _value = _hsh[1];
                
                // 如果只有key没有value, 那么将全部丢入一个$nullName数组中
                if(_hsh.length < 2){
                    _value = _key;
                    _key = '$nullName';
                }
                // 如果缓存堆栈中没有这个数据
                if(!_json[_key]) {
                    _json[_key] = _fData(_value);
                }
                // 如果堆栈中已经存在这个数据，则转换成数组存储
                else {
                    if(isArray(_json[_key]) != true) {
                        _json[_key] = [_json[_key]];
                    }
                    _json[_key].push(_fData(_value));
                }
            }
        }
        return _json;
    };
    var opts = parseParam({
        'isEncodeQuery'  : false,
        'isEncodeHash'   : false
    },args||{});
    var that = {};
    var url_json = parseURL(sURL);
        that.urlInfo = url_json;
    
    var query_json = queryToJson(url_json.query);
    
    var hash_json = queryToJson(url_json.hash);
    
    
    
    that.setParam = function(sKey, sValue){
        query_json[sKey] = sValue;
        return this;
    };
    that.getParam = function(sKey){
        return query_json[sKey];
    };
    that.setParams = function(oJson){
        for (var key in oJson) {
            that.setParam(key, oJson[key]);
        }
        return this;
    };
    that.setHash = function(sKey, sValue){
        hash_json[sKey] = sValue;
        return this;
    };
    that.getHash = function(sKey){
        return hash_json[sKey];
    };
    that.valueOf = that.toString = function(){
        var url = [];
        var query = jsonToQuery(query_json, opts.isEncodeQuery);
        var hash = jsonToQuery(hash_json, opts.isEncodeQuery);
        if (url_json.scheme != '') {
            url.push(url_json.scheme + ':');
            url.push(url_json.slash);
        }
        if (url_json.host != '') {
            url.push(url_json.host);
            if(url_json.port != ''){
                url.push(':');
                url.push(url_json.port);
            }
        }
        url.push('/');
        url.push(url_json.path);
        if (query != '') {
            url.push('?' + query);
        }
        if (hash != '') {
            url.push('#' + hash);
        }
        return url.join('');
    };
    
    return that;
}