/**
 * storage操作
 * @author xingzhizhou
 * @version v2016/08/17
 * @description storage相关操作，包括sessionStorage和localStorage，可以对客户端缓存设置过期时间，单位s。localStorage必须设置过期时间
 */
define("cachev1", function(require,exports,module){
    /**
     * var cache = require("./cachev1");
     * localStorage
     * 保存到localStorage
     * 保存到localStorage必须设置过期时间
     * 设置过期时间 单位 s
     * cache.setItem(key, value, true, 3600)
     * 增加失败回调， ret 0 成功 ，非 0 失败
     * cache.setItem(key, value, true, 3600, function(ret, message){})
     * cache.getItem(key, true)
     * cache.removeItem(key, true)
     *
     * 或者
     * cache.local.setItem(key, value, 3600);
     * cache.local.setItem(key, value, 3600, function(ret){})
     * cache.local.getItem(key)
     * cache.local.removeItem(key)
     *
     * sessionStorage
     * 保存到sessionStorage
     * cache.setItem(key, value);
     * 设置过期时间 单位 s
     * cache.setItem(key, value, 3600)
     * 增加失败回调， ret 0 成功 ，非 0 失败
     * cache.setItem(key, value, 3600, function(ret, message){})
     * cache.getItem(key)
     * cache.removeItem(key)
     *
     * 或者
     * cache.session.setItem(key, value);
     * cache.session.setItem(key, value, 3600, function(ret){})
     * cache.session.getItem(key)
     * cache.session.removeItem(key)
     *
     * 测试页面连接 http://wqs.jd.com/my/cachetest.shtml
     */

    var _cacheThisModule_;

    //sessionStorage是否可用
    var _isSessionAble = true;
    //localStorage是否可用
    var _isLocalAble = true;
    var checkStorage = function(o){
        var key = "WXSQ_STOARGE_TEST",
            value;
        try{
            o.setItem(key,1);
            value = o.getItem(key);
            o.removeItem(key);
            return value == 1;
        }catch(e){
            return false;
        }
    };

    try{  //兼容IOS7 中禁用cookie的情况：出现localStorage或者sessionStorage就会异常
        _isSessionAble = checkStorage(window.sessionStorage);
        _isLocalAble =  checkStorage(window.localStorage);
    }catch(e){
        _isSessionAble = false;
        _isLocalAble = false;
    }

    //cache不可用
    if(!_isSessionAble || !_isLocalAble){
        JD.report.umpBiz({bizid: 45, operation: 1, result: 2, source: 0, message: "session " + _isSessionAble + "|local " + _isLocalAble});
    }

    var isArray = Array.isArray ||
        function(object){ return object instanceof Array }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isObject(obj)     { return obj != null && typeof(obj) == "object" }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }
    function extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }else if (source[key] !== undefined) target[key] = source[key]

        return target;
    }

    function parseJSON(data){
        if(!data || typeof(data) != "string" ){
            return data;
        }
        data = data.replace(/^\s+|\s+$/g, "");
        if(!data)return data;

        try{
            data = JSON.parse(data);
        }catch(e){

        }
        return data;
    };

    /**
     * 本地存储操作接口
     * localStorage和sessionStorage的统一调用接口，当不支持这两个特性时则不会发生写入操作，也不会出现异常，所以这是一个非安全的存储方式
     */
    var storage = function(){
       var jdStorage = window.sessionStorage;
       var keyPrefix = "WQ_";

        /**
         * 设置本地缓存
         * @param key
         * @param value
         * @param expire 过期时间，单位 s
         * @param callback 回调
         * @private
         */
        var _setItem = function(key, value, merge, expire, callback){
            var o = parseJSON(getItem(keyPrefix + key));
            if(o && ( merge && isPlainObject(value) && isPlainObject(o.v) || isArray(value) && isArray(o.v) )){
                value = extend(o.v, value, true);
            }

            var v = {v: value, "t": new Date().getTime(), "e": typeof expire != "number" ? "" : expire};
            _flush(keyPrefix + key, v, callback);
        };

        /**
         * 获取本地存储信息，如果过期返回空
         * @param key
         * @returns {*}
         * @private
         */
        var _getItem = function(key){
            var o = jdStorage.getItem(keyPrefix + key);
            if(!o)return jdStorage.getItem(key);
            o = parseJSON(o);
            var e = o && o.e;
            //检查是否过期
            if(e === 0 || (e && (new Date() - o.t) >= e*1000)){
                _removeItem(key);
                return "";
            }

            return o.v;
        };

        /**
         * 删除本地存储信息
         * @param key
         * @private
         */
        var _removeItem = function(key){
            try{
                jdStorage.removeItem(keyPrefix + key);
            }catch(e){
                //JD.report.umpBiz({bizid: 45, operation: 1, result: 3, source: 0, message: e.message});
            }
        };

        /**
         * 将新的缓存信息写到本地存储
         * @param key
         * @param value
         * @param callback callback(0) 成功 callback(1, message) 失败
         * @returns {boolean} true 成功 false 失败
         * @private
         */
        var _flush = function(key, value, callback){
            var v = "";
            try{
                v = JSON.stringify(value);
            }catch (e){
                throw new Error("JSON数据格式异常：" + e.message);
            }

            try{
                jdStorage.setItem(key, v);
                callback && callback(0);
            }catch(e){
                //清除过期数据，重试一次
                _clearOut();
                try{
                    jdStorage.setItem(key, v);
                    callback && callback(0);
                }catch (e){
                    callback && callback(1, e.message);

                    //设置失败上报ump
                    JD.report.umpBiz({bizid: 45, operation: 1, result: 1, source: 0, message: key + "|" + e.message});
                    return false;
                }
            }

            return true;
        };

        /**
         * localStorage还是sessionStorage
         * 读取记录本地缓存过期信息的cache
         * @param p true localStorage false sessionStorage
         * @private
         */
        var _persistence = function(p){
            jdStorage =  p ? window.localStorage : window.sessionStorage;
        }

        /**
         * 清除本地过期存储
         * @private
         */
        var _clearOut = function(){
            var key = "";
            for( var i = jdStorage.length - 1 ; i >= 0; i--){
                key = jdStorage.key(i);
                key.indexOf(keyPrefix) == 0 && _getItem(key.slice(keyPrefix.length));
            }
        }

        return {
            setItem : _setItem,
            getItem : _getItem,
            removeItem : _removeItem,
            persistence: _persistence,
            clearOut: _clearOut,
        }
    }();

    /**
     * 根据key获取本地存储
     * @param key
     */
    function getItem(key){
        var v = "";
        try{
            v = storage.getItem(key);
        }catch (e){

        }
        return v;
    }

    /**
     * 设置缓存
     * @param key
     * @param value
     * @param force true 使用localStorage  false sessionStorage
     * @param merge true 如果是对象或者数组，就合并
     * @param expire 过期时间 单位：s
     * @param callback 回调方法 callback(0) 成功 callback(1, message) 设置失败 message 失败原因
     * @returns {boolean}
     */
    function setItem(key, value, force, merge, expire, callback){
        typeof expire == "function" && (callback = expire, expire = false);
        typeof merge == "number" && (expire = merge, merge = false);
        typeof merge == "function" && (callback = merge, merge = false);
        typeof force == "function" && (callback = force, force = false);
        typeof force == "number" && (expire = force, force = false);

        //localStorage强制设置过期时间
        if(force && (!expire || typeof expire != "number")){
            throw new Error("请设置过期时间");
            return false;
        }

        storage.persistence(!!force);
        storage.setItem(key, value, merge, expire, callback);
    }

    /**
     * 删除指定的session缓存
     * @param  key 删除的键值
     */
    function removeItem(key){
        storage.removeItem(key);
    }

    return { //默认sessionStorage， force  true  localStorage
        getItem: function(key,force){
            storage.persistence(!!force);
            return getItem(key);
        },
        setItem: function(key, value, force, merge, expire, callback){
            return setItem(key, value, force, merge, expire, callback);
        },
        removeItem: function(key, force){
            storage.persistence(!!force);
            return removeItem(key);
        },
        clearOut: function(force){
            storage.persistence(!!force);
            storage.clearOut();
        },
        session: { //sessionStorage
            getItem: function(key){
                storage.persistence(false);
                return getItem(key);
            },
            setItem: function(key, value, merge, expire, callback){
                return setItem(key, value, false, merge, expire, callback);
            },
            removeItem: function(key){
                storage.persistence(false);
                return removeItem(key);
            },
            clearOut: function(){
                storage.persistence(false);
                storage.clearOut();
            },
        },
        local: {  //localStorage
            getItem: function(key){
                storage.persistence(true);
                return getItem(key);
            },
            setItem: function(key, value, merge, expire, callback){
                return setItem(key, value, true, merge, expire, callback);
            },
            removeItem: function(key){
                storage.persistence(true);
                return removeItem(key);
            },
            clearOut: function(){
                storage.persistence(true);
                storage.clearOut();
            },
        }
    }
});