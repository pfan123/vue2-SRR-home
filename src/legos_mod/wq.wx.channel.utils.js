/**
 * 用于封装馆区页面的一些公共的工具类方法
 *
 * @author HuiminLiu
 */

define('wq.wx.channel.utils', function (require, exports, module) {
	var _cacheThisModule_
    var $ = require('zepto')
    var servTime = require('./time')
    var wfdata = require('./wfdata')

    /**
     * 节流函数 (https://remysharp.com/2010/07/21/throttling-function-calls)
     */
    function throttle(fn, threshhold, scope) {
        var last, deferTimer;
        threshhold || (threshhold = 200);
        
        return function () {
            var context = scope || this;
            var now = +new Date, args = arguments;
            
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        }
    }

    /**
     * 取随机数
     */
    function getRandom(begin, end) {
        var range = end - begin + 1
        return Math.floor(Math.random() * range + begin)
    }

    /**
     * 生成一个随机ID
     */
    function makeId() {
        return 'R' + Math.random().toString(36).substr(2,7)
    }

    /**
     * 取滚动高度
     */
    function getScrollTop() {
        return (document.documentElement && document.documentElement.scrollTop) || 
              document.body.scrollTop || 0
    }

    /**
     * 获取服务端时间
     */
    function getServerTime() {
        return location.href.indexOf('debugTime=1') != -1 ? (+new Date) : servTime.getServerTime()
    }

    /**
     * 检测时间范围，传入的参数可以是空字符串、或时间戳
     *   或是 PPMS 时间字符串 (格式为 2016/07/20 00:00:00)
     */
    function checkTime(beginTime, endTime) {
        var now = getServerTime()

        //将10位时间戳加上毫秒数
        if (/^\d{10}$/.test(beginTime + '')) beginTime *= 1000
        if (/^\d{10}$/.test(endTime + '')) endTime *= 1000

        var didBegin = !beginTime || (parseInt(beginTime) == beginTime ? 
                       now >= beginTime : now >= Date.parse(beginTime))

        var didNotEnd = !endTime || (parseInt(endTime) == endTime ? 
                        now < endTime : now < Date.parse(endTime))

        return didBegin && didNotEnd
    }

    /**
     * 打乱数组顺序
     */
    function shuffle(a) {
        var j, x, i;
        for (i = a.length; i; i -= 1) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    }

    /**
     * 解析焦点系统返回的数据（不要问这段代码干了些啥，因为我也是抄来的..）
     */
    function parseCPCList(list){
        var _cpcList = {};
        if(!list || !list.length){
            return _cpcList;
        }
        for(var i = 0, iLen = list.length; i < iLen; i++){
            var _g = list[i];
            if(!_g || $.isEmptyObject(_g)){
                continue;
            }
            var _returnLocations = {};
            _cpcList[_g.groupid] = _returnLocations;
            var _locations = _g.locations;
            if(!_locations || !_locations.length){
                continue;
            }
            for(var j = 0, jLen = _locations.length; j < jLen; j++){
                var _location = _locations[j];
                if(!_location || $.isEmptyObject(_location)){
                    continue;
                }
                var _plans = _location.plans;
                if(!_plans || !_plans.length){
                    _returnLocations[_location.locationid] = [];
                    continue;
                }
                _returnLocations[_location.locationid] = _plans;
            }
        }
        return _cpcList;
    }

    /**
     * 获取旧焦点系统轮播Banner 的数据
     */
    function getBannerListData(cpcGId, cpcLocationIds, callback) {
        _getBannerListData(cpcGId, cpcLocationIds, false, callback)
    }

    /**
     * 获取新焦点系统轮播Banner 的数据
     */
    function getNewBannerListData(cpcGId, cpcLocationIds, callback) {
        _getBannerListData(cpcGId, cpcLocationIds, true, callback)
    }

    /**
     * 获取顶部轮播Banner 的数据（每个广告位取第1条数据）
     *   newCpc: 是否拉取新版焦点系统的数据
     * 调用事例： _getBannerListData(4057, [10653, 10654, 10655], true, function(err, data) {})
     */
    function _getBannerListData(cpcGId, cpcLocationIds, newCpc, callback) {
        var banner = {
            cpcGId: cpcGId, //广告组ID
            cpcLocationIds: cpcLocationIds //广告位ID
        }

        var pcs = []
        banner.cpcLocationIds.forEach(function(item) {
            pcs.push(item + ':1')
        })

        //将某个广告组里的各个广告位的第1条数据取出
        var extractData = function(_data, config) {
            var entries = [], data
            if (data = _data[config.cpcGId]) {
                config.cpcLocationIds.forEach(function(id) {
                    var item = data[id] && data[id][0]
                    if (item) {
                        entries.push(item)
                    }
                })
            }
            return entries
        }

        wfdata.getData({
            dataType: wfdata.DataType[newCpc ? 'CPC_NEW' : 'CPC'],
            param: {
                gids : banner.cpcGId,
                pc   : 0,
                pcs  : pcs.join(',')
            },
            cb: function(res) {
                if (res && res.errCode == 0 && res.list && res.list.length) {
                    var list = parseCPCList(res.list)
                    list = extractData(list, banner)
                    callback(null, list)
                } else {
                    callback('出错啦')
                }
            }
        })
    }

    /**
     * 解析多卖场接口的返回数据
     * （注：本方法只针对 gbyarea = 2, tpl = 7 的情况）
     *
     * @param  {Object} data       后台返回数据的 data 部分（res.data）
     * @param  {Bool} stripExpired 是否要过滤掉 dwBeginTime ~ dwEndTime 不在当前时间内的
     *
     * @return {Object}  返回以 ${actId}_${areaId} 格式的 key 组织成的列表数据
     */
    function parseMultiMartData(data, stripExpired) {
        var d = {}
        data.forEach(function(actItem) {
            var actId = actItem.dwActId
            actItem.area.forEach(function(areaItem) {
                var key = actId + '_' + areaItem.dwAreaId
                if (!d[key]) d[key] = []
                d[key] = d[key].concat(areaItem.list || [])
            })
        })
        return d
    }

    /**
     * 吸顶处理，对于不支持 -webkit-sticky 定位的情况，自动添加或移除类名 fixed
     *
     * @param {DOM} el 要吸顶的元素
     * @param {Function} stickyStateDidChange 吸顶状态改变时触发的回调
     */
    function makeSticky(el, options) {
        var isSticky = false,
            height = el.getBoundingClientRect().height

        options = $.extend({
            buffer: 0,
            stickyStateDidChange: function() {}
        }, options)

        $(window).on('scroll', throttle(function(ev) {
            var shouldSticky = el.parentNode.getBoundingClientRect().top < options.buffer

            if ($(el).css('position').indexOf('sticky') == -1) {
                if (shouldSticky) {
                    el.classList.add('fixed')
                } else {
                    el.classList.remove('fixed')
                }
            }

            if (isSticky != shouldSticky) {
                options.stickyStateDidChange(isSticky = shouldSticky)
            }
        }))
    }

    /**
     * 商品销售进度计算（假的，认真你就输了）
     */
    function getSalesProgress(skuId, beginTime) {
        var delta = (skuId % 50 / 100 + .6).toFixed(2)
        var x = ((getServerTime() / 1000 - beginTime) / 3600).toFixed(2)
        return parseInt(Math.pow(Math.E, -Math.sqrt(x, 2) / (2 * Math.pow(delta, 2))) * 100)
    }


    /**
     * 这里最后导出一些公共的方法，以便复用
     */
    module.exports = {
        throttle: throttle,
    	getRandom: getRandom,
        makeId: makeId,
        getScrollTop: getScrollTop,
    	getServerTime: getServerTime,
        checkTime: checkTime,
    	shuffle: shuffle,
        parseCPCList: parseCPCList,
        getBannerListData: getBannerListData,
        getNewBannerListData: getNewBannerListData,
        parseMultiMartData: parseMultiMartData,
        makeSticky: makeSticky,
        getSalesProgress: getSalesProgress
    }

});
