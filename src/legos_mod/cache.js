/**
 * storage操作
 * @author p_jdzzxing
 * @version v2014/12/9
 * @description storage相关操作，包括sessionStorage和localStorage
 */
define("cache",function(require,exports,module){
    /**
     * var _cache = require("./cache");
     * localStorage
     * 保存到localStorage
     * _cache.setItem(key, value, true)
     * 设置过期日期 单位 s
     * _cache.setItem(key, value, true, 3600)
     * 如果value是对象或者数组，可以合并原有值
     * _cache.setItem(key, value, true, true)
     * _cache.getItem(key, true)
     * _cache.removeItem(key, true)
     *
     * 或者
     * var _cache = require("cache").local;
     * _cache.setItem(key, value);
     * _cache.getItem(key)
     * _cache.removeItem(key)
     *
     * sessionStorage
     * 保存到sessionStorage
     * _cache.setItem(key, value)
     * 设置session值，expire是过期日期，单位 s
     * _cache.setItem(key, value, 3600)
     * 设置session值，true 是否合并session中已有的值
     * _cache.setItem(key, value, false, true)
     * _cache.getItem(key)
     * _cache.removeItem(key)
     *
     * 测试页面连接 http://wqs.jd.com/my/cachetest.html
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
        _isSessionAble = checkStorage(sessionStorage);
        _isLocalAble =  checkStorage(localStorage);
    }catch(e){
        _isSessionAble = false;
        _isLocalAble = false;
        try{
            JD.report.umpBiz({bizid: 45, operation: 1, result: 2, source: 0, message: ""});
        }catch(e){}
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
            data = (new Function("return " + data))();
        }
        return data;
    };
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

    /**
     * 本地存储操作接口
     * <p>
     * localStorage和sessionStorage的统一调用接口，当不支持这两个特性时则不会发生写入操作，也不会出现异常，所以这是一个非安全的存储方式
     * </p>
     * @method storage
     */
    var storage = function(){
        var MAX_TRY = 1;    //最大尝试写入次数 如果超过这个次数，依然发生异常则抛出错误提示
        var count = 0;
        var STORAGE_KEY = "WXSQ_STORAGE_CACHE";  //采用相同的存储键值
        var persistence = false;
        var cacheS = cacheL = cache = null;

        /**
         * 读取本地存储的数据
         *
         * @param {String} key 存储的键值
         * @param {String} value 存储的值信息
         * @param expire 过期日期 单位s
         */
        var _setItem = function(key,value, expire){
            count = MAX_TRY;  //复位
            cache[key] = {"v" : value, "t": +new Date, "e": typeof expire == 'undefined' ? "" : expire};
            _flush();
        };

        /**
         * 获取本地存储的值信息
         * @param {String} key 获取缓存的键值
         * @return {Object|String} 本地存储指定的键值的数据
         */
        var _getItem = function(key){
            var o = cache[key];
            var v = o && o.v;
            var e = o && o.e;
            //检查是否过期
            if(e === 0 || (e && (new Date() - o.t) >= e*1000)){
                return "";
            }
            return isPlainObject(v) ? extend({}, v, true) :
                isArray(v) ? extend([], v, true) : v;
        };

        /**
         * 移除本地存储中指定键值的数据
         *
         * @param {String} key 移除缓存的键值
         */
        var _removeItem = function(key){
            count = MAX_TRY;  //复位
            delete cache[key];
            _flush();
        };

        /**
         * 将新的缓存信息重新写入到缓存中
         *
         * @method _flush
         * @private
         * @param {Boolean} [persistence:false] 控制写入缓存到sessionStorage还是localStorage
         */
        var _flush = function(){
            var o;

            try{     //数据格式不正确转换可能导致发生异常
                o = JSON.stringify(cache);
            }catch(e){
                throw new Error("JSON数据格式异常：" + e.message);
            }

            try{
                if(persistence){
                    _isLocalAble && localStorage.setItem(STORAGE_KEY,o);
                }else{
                    _isSessionAble && sessionStorage.setItem(STORAGE_KEY,o);
                }

            }catch(e){
                count--;   //如果发生写入缓存异常则去除旧的数据后重新尝试写入
                if(count >= 0){
                    _flush();
                }else{
                    try{
                        JD.report.umpBiz({bizid: 45, operation: 1, result: 1, source: 0, message: (persistence ? 'localStorage' : 'sessionStorage')});
                    }catch(e){}
                    /*
                     if(persistence){
                     _isLocalAble && localStorage.clear();
                     }else{
                     _isSessionAble && sessionStorage.clear();
                     }
                     _flush();*/
                    //throw new Error("写入缓存异常：" + e.message);
                }
            }
        };

        /**
         * 根据时间排除旧的数据
         * @method _shiftByTime
         * @private
         * @param {Boolean} [persistence:false] 根据写入的时间淘汰旧的值
         */
        var _shiftByTime = function(){
            var tar = cache;
            var old;

            $.each(tar,function(k,v){
                if(old){
                    old = (old.t > v.t ? v : old);
                }else{
                    old = v;
                }
            });

            old && delete tar[old.id];
        }

        /**
         * 用localStorage还是sessionStorage
         * @param p true localStorage  false  sessionStorage
         * @private
         */
        var _persistence = function(p){
            persistence = p;
            if(p){  //localStorage
                !cacheL && (cacheL = _isSessionAble ?
                    parseJSON(localStorage.getItem(STORAGE_KEY)||"{}") : {});
                cache = _isLocalAble ? cacheL : null;
            }else{ //sessionStorage
                !cacheS && (cacheS = _isSessionAble ?
                    parseJSON(sessionStorage.getItem(STORAGE_KEY)||"{}") : {})
                cache = _isSessionAble ? cacheS : null;
            }
        }

        return {
            setItem : _setItem,
            getItem : _getItem,
            removeItem : _removeItem,
            persistence: _persistence
        }
    }();

    /**
     * 获取window.name中数据
     * @method getWindow
     * @private
     * @return {Object} window.name转换后的对象
     */
    function getWindow(){
        try{
            return parseJSON(window.name||"{}");
        }catch(e){
            return {};
        }
    }

    /**
     * 设置window.name的数据
     * @method setWindow
     * @private
     * @param {Object} data 需要写入到window.name中的缓存数据
     */
    function setWindow(data){
        data && (window.name = JSON.stringify(data));
    }

    /**
     * 根据key获取session级的缓存
     * @param  {String} key 获取的缓存键值名
     * @param  {Boolean} [force:false] 是否强制使用window.name
     */
    function getItem(key,force){
        if(cache && !force){
            return storage.getItem(key,false);
        }else{
            var data = getWindow();
            return data[key];
        }
    }

    /**
     * 设置session级的缓存
     * @param {String} key   存储的键值
     * @param {String} value 存储的值
     * @param {Boolean} merge 是否进行合并
     * @param Number expire 过期时间，单位 s
     * @param {Boolean} [force:false] 是否强制使用window.name
     */
    function setItem(key,value,merge,expire, force){
        typeof merge == "number" && (expire = merge, merge = false);
        if(merge && isPlainObject(value) && isPlainObject(getItem(key)) || isArray(value) && isArray(getItem(key))){
            value = extend(getItem(key),value);
        }

        if(cache && !force){
            storage.setItem(key,value, expire, false);
        }else{
            var data = getWindow();
            if(!isPlainObject(data)){
                data = {};
            }
            data[key] = value;
            setWindow(data);
        }
    }

    /**
     * 删除指定的session缓存
     * @param  {String} key 删除的键值
     * @param  {Boolean} [force:false] 是否强制使用window.name
     */
    function removeItem(key,force){
        if(cache && !force){
            storage.removeItem(key,false);
        }else{
            var data = getWindow();
            if(isPlainObject(data)){
                delete data[key];
                setWindow(data);
            }
        }
    }


    return {
        getItem: function(key,force){     //force  true  localStorage
            storage.persistence(!!force);
            return getItem(key);
        },
        setItem: function(key,value,force,merge,expire){  //force  true  localStorage
            if(arguments.length == 3 && typeof force != "boolean")force = false;
            storage.persistence(!!force);
            return setItem(key,value,merge,expire);
        },
        removeItem: function(key,force){  //force  true  localStorage
            storage.persistence(!!force);
            return removeItem(key);
        },
        session: { //sessionStorage
            getItem: function(key,force){
                storage.persistence(false);
                return getItem(key);
            },
            setItem: function(key,value,merge,expire, force){
                storage.persistence(false);
                return setItem(key,value,merge,expire);
            },
            removeItem: function(key,force){
                storage.persistence(false);
                return removeItem(key);
            }
        },
        local: {  //localStorage
            getItem: function(key){
                storage.persistence(true);
                return getItem(key);
            },
            setItem: function(key,value,merge,expire){
                storage.persistence(true);
                return setItem(key,value,merge,expire);
            },
            removeItem: function(key){
                storage.persistence(true);
                return removeItem(key);
            }
        }
    }
});