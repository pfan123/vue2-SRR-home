/**
 * 用于封装馆区页面的一些公共的业务相关的处理方法
 *
 * @author HuiminLiu
 */

define('wq.wx.channel.common', function (require, exports, module) {

	var _cacheThisModule_
    var $ = require('zepto')
    var url = require('./url')
    var wxpopmenu = require('./wq.wx.menu')
    var utils = require('./wq.wx.channel.utils')


    /**
     * 一些页面公共部分的处理
     */
    function initCommonStuff() {
        //侧边栏
        wxpopmenu.init()

        //公共底部
        var loadCommonFoot = function() {
            try{
                $('#foot_wx_level2').show();
                window._wxfootconfig.searchfoot.load();
            }catch(e){
                setTimeout(loadCommonFoot, 500)
            }
        }
        loadCommonFoot()
    }

    /**
     * 返回顶部按钮的处理
     *
     * @param {Int} bottom 按钮离底部的距离
     */
    function initBackToTopBtn(bottom) {
        if (!$('.WX_backtop').length) {
            bottom = bottom || 60
            $('.wx_wrap').append('<a href="javascript:;" class="WX_backtop" style="bottom: ' + bottom + 'px;">返回顶部</a>')
        }

        $('.WX_backtop').on('click', function() {
            window.scrollTo(0, 0)
            return false
        })

        $(window).on('scroll', utils.throttle(function() {
            if (utils.getScrollTop() > $(window).height()) {
                $('.WX_backtop').show()
            } else {
                $('.WX_backtop').hide()
            }
        }))
    }

    /**
     * 页面高度的记录与恢复，调用 init 方法即可
     *
     * 实现思路：监听 .wx_wrap 下所有的 a 链接，在点击时将当前的 scrollTop 更新到 location.hash 中，
     *         页面返回时，在 3 秒钟之内，如果页面高度足够，能根据 hash 中的 st 值恢复页面滚动高度
     *
     * 注：也可以将其他需要记录的值设置进 hashParam 对象，如 scrollTopHelper.hashParam.tab = '2'
     */
    var scrollTopHelper = {
        init: function() {
            //将当前页面状态写入hash，以便返回时恢复
            this.hashParam = { st: 0 }
            this.bindEvents()
            this.restoreScrollTop()
        },
        hashParam: {},
        bindEvents: function() {
            //点击时记录当前页面状态
            $('.wx_wrap').on('click', 'a', function(ev) {
                var a = ev.currentTarget
                if ($(a).attr('href').indexOf('javascript:') == -1) {
                    this.updateCurrentST()
                }
            }.bind(this))
        },
        setHashParam: function() {
            var newHash = '#' + $.param(this.hashParam)

            var hashStr = location.hash.substr(1)
            if (hashStr.length) {
                hashStr.split('&').forEach(function(item) {
                    var a = item.split('='),
                        k = a[0],
                        v = a[1]
                    if (typeof this.hashParam[k] == 'undefined') {
                        newHash += '&' + k + (v ? '=' + v : '') //保留其他hash参数
                    }
                }.bind(this))
            }

            location.replace(newHash)
        },
        updateCurrentST: function(st) {
            this.hashParam.st = typeof st == 'undefined' ? utils.getScrollTop() : st
            this.setHashParam()
        },
        restoreScrollTop: function() {
            var st = parseInt(url.getHashParam('st')) || 0

            if (st) {
                var begin = Date.now()
                
                var setScrollTop = function() {
                    if (document.body.clientHeight >= st + $(window).height()) {
                        window.scrollTo(0, st)
                        this.updateCurrentST(0)
                    } else if (begin + 3000 > Date.now()) { //3秒内恢复
                        setTimeout(setScrollTop, 200)
                    } else {
                        this.updateCurrentST(0)
                    }
                }.bind(this)
                
                setScrollTop()
            }
        }
    }

    /**
     * 这里最后导出一些公共的方法，以便复用
     */
    module.exports = {
        initCommonStuff: initCommonStuff,
        initBackToTopBtn: initBackToTopBtn,
    	scrollTopHelper: scrollTopHelper
    }

});
