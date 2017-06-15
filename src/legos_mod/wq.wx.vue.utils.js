/**
 * Vue公用的一些东东
 *
 * @author liuhuimin
 */

define('wq.wx.vue.utils', function (require, exports, module) {
	var _cacheThisModule_,
		vue = require('vue'),
        utils = require('./wq.wx.channel.utils')

	function registerVueFilters() {
		/**
         * 处理图片 URL，此方法会用将图片文件名“随机”映射到一个 CDN 图片的子域名，以扩充并行下载能力
         * 以及调用平台的 JD.img.getImgUrl 方法，进行 webp、缩放、压缩、及去 http 协议头的处理
         * 
         * @param  {string}  图片URL
         * @param  {int}     图片缩放宽度
         * @param  {int}     图片缩放高度
         *
         * @return {string}  处理后的图片URL
         */
        Vue.filter('getImg', function(url, width, height) {
            if (!url) return ''
            var pool = [10,11,12,13,14,20,30] //域名池
            var idx = parseInt(url.substr(url.lastIndexOf('/') + 1, 8), 36) % pool.length
            url = url.replace(/(\/\/img)\d{1,2}(\.360buyimg\.com)/, '$1' + pool[idx] + '$2')
            return JD.img.getImgUrl(url, width, height)
        })

        //给链接加RD（参数可以有多个，会自动拼接成RD）
        Vue.filter('addRd', function(value, rd) {
            var _rd = Array.prototype.slice.call(arguments, 1).join('')
            return value ? JD.url.addRd(value, _rd).replace(/^http:/, '') : ''
        })

        //与PC端价格做对比
        Vue.filter('comparePrice', function(value, price) {
            //乘了又除是为了防止JS浮点数运算的BUG
            var gap = Math.round(parseFloat(price) * 100 - parseFloat(value) * 100) / 100
            return gap > 0 ? '比电脑省<span class="money_mark yen">&yen;</span>' + gap : ''
        })

        //套个span，生成价格标签
        Vue.filter('formatPrice', function(value) {
            var pieces = parseFloat(value).toFixed(2).toString().split('.')
            return ['<span>￥</span>', pieces[0], '<span>.', pieces[1], '</span>'].join('')
        })

        //生成价格标签
        Vue.filter('formatPrice2', function(value) {
            return '<span class="yen">&yen;</span>' + parseFloat(value).toFixed(2)
        })

        //左侧补个零，9 -> 09
        Vue.filter('leftPadZero', function(str) {
        	str += ''
        	return str.length == 1 ? '0' + str : str
        })

        //将购物圈的图片路径转换为URL
        Vue.filter('handleImgPath', function(value) {
            return value.indexOf('//') != -1 ? value : '//img1' + ~~(Math.random() * 5) + '.360buyimg.com/evalpic/s240x240_' + value
        })

        //老方法，仅供家电馆旧代码调用
        Vue.filter('jfsImage', function(value) {
            return value.indexOf('//') != -1 ? value : '//img1' + ~~(Math.random() * 5) + '.360buyimg.com/evalpic/s240x240_' + value;
        })
    }

    //直接执行吧，就不export 了
    registerVueFilters()

});
