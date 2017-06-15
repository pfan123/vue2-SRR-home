define('lazyLoad', function(require, exports, module){
    var _cacheThisModule_;
    var $ = require('./zepto');
    var g = {};
    var opt = {
        scrollOffsetH : 100,  //加载偏移量
        initSrcName : 'init-src',    //加载属性名
        container:document.body,//滚动加载的容器（id或者dom）
        fadeIn:false,//是否渐显(针对图片的过渡渐显动画，图片的默认css属性为opacity:0;transition:opacity 0.3 linear,找构建同学实现)
        zoom:1,//页面的缩放比
        skip_invisible : false,   //过滤隐藏的图片，默认不过滤隐藏图片,
        afterImgLoaded : null    //当前图片加载完成后的回调
    };
    g.autoLoadImage = function(option) {
        
        if(option){
            for(var key in option){
                opt[key] = option[key];
            }
        }
        function init() {
            var cont=typeof opt.container=="string"?$("#"+opt.container):$(opt.container);
            var objImages=$("img["+opt.initSrcName+"]",cont);
            objImages.each(function (i) {
                var dom = $(this);
                images_data.cache.push({
                    url:dom.attr(opt.initSrcName),
                    obj:dom,
                    top:(opt.skip_invisible && isElementHidden(dom) ? Infinity : dom[0].getBoundingClientRect().top) * opt.zoom + window.pageYOffset    //是否要跳过隐藏的图片
                });
            });
            images_data.num = images_data.cache.length;
        }
        var images_data = {
            // 当前可视区域的高度
            viewHeight:$(window).height(),
            // 定时器
            ptr:"",
            // 所有图片
            cache:[],
            // 图片数量
            num:0
        };
        init();
        if (images_data.ptr) {
            clearInterval(images_data.ptr);
        }
        images_data.ptr = setInterval(doScroll, 100);
        function doScroll() {
            // 滚动条的高度
            var scrollHeight = window.pageYOffset,
            // 已经卷起的高度+可视区域高度，即当前显示的元素的高度
                visibleHeight = images_data.viewHeight * 2 + opt.scrollOffsetH + scrollHeight;
            $.each(images_data.cache, function (i, data) {
                var element = data.obj, loaded = element.attr("loaded");
                // 图片在后面两屏范围内，并且未被加载过
                if (visibleHeight > data.top && !loaded) {
                    // 加载图片
                    element.attr("lazyloadimg", 'true');
                    var _img = document.createElement('img');
                        _img.onload = function(){
                            element.attr("src", data.url);
                            opt.fadeIn  && element.css("transition", "opacity 0.5s ease");
                            element.css("opacity", "1");
                            opt.afterImgLoaded && opt.afterImgLoaded(element);
                            
                        }
                        _img.onerror = function(){
                            element.attr("src", data.url);
                            opt.fadeIn  && element.css("transition", "opacity 0.5s ease");
                            element.css("opacity", "1");
                            opt.afterImgLoaded && opt.afterImgLoaded(element);
                        }
                    _img.src = data.url;
                    element.removeAttr(opt.initSrcName);
                    element.attr("loaded", images_data.num);
                    images_data.num--;
                }
            });
            // 没有图片加载，清除定时器
            if (images_data.num == 0) {
                clearInterval(images_data.ptr);
                images_data.ptr = null;
            }
            //回调方法，比如利用这个来判断是否需要翻页
            opt.callback && opt.callback();
        }
    }
    g.set = function(option){
        if(option){
            for(var key in option){
                opt[key] = option[key];
            }
        }
    }
    //判断当前节点是否是隐藏的
    function isElementHidden(ele){
        var _relate = $(ele).parents().concat();
        _relate.unshift($(ele)[0]);
        return _relate.some(function(e){
            if(getComputedStyle(e, '').getPropertyValue("display") == "none"){
                //元素隐藏了
                return true;
            }
        });
    }
    function init(){
        var style = document.createElement('style');
            style.innerHTML = '' + 
                'img[init-src] { opacity:0; }' +
                'img[lazyloadimg] { opacity:0; }' +
                '';
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    init();

    module.exports = g;
});
