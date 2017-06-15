export default function stickyNav(el, opts){

    // iPhone stickyNav
    if(!$(el)[0] || window.getComputedStyle($(el)[0], "").position === "-webkit-sticky"){
        return;
    }
    /**
     * 使用zepto的$(window).scrollTop可能出现问题，如果scrollTop是全部变量
     * @private
     */
    function _getPageScrollTop(){
        return window.scrollY || document.body.scrollTop;
    };
    /**
     * 页面设置了zoom则获取top值的方式不一样
     * @param dom
     * @returns {*}
     * @private
     */
    function _getOffsetTop(dom) {
       
        return $(dom).offset().top;
        
    };
    var conf = {
        'className' : 'fixed',
        'realeseDirection' : 'up',
        'fixtop'    : 0,
        'fixedCallback': function(){},
        'unFixedCallback': function(){}
    }, opts = opts || {}, timer, oScrollTop = _getPageScrollTop();

    for(var i in opts) {
        conf[i] = opts[i];
    }

    $(window).on('scroll', function() {
        clearTimeout(timer);

        timer = setTimeout(function() {
            if(!$(el)[0]){
                return;
            }
            var cScrollTop = _getPageScrollTop();
            var cOffsetTop = _getOffsetTop($(el));

            var cDirection;
            if(cScrollTop > oScrollTop) {
                cDirection = 'down';
            }else if(cScrollTop < oScrollTop){
                cDirection = 'up';
            }
            oScrollTop = cScrollTop;

            if(cScrollTop >= cOffsetTop - conf.fixtop && cDirection != conf.realeseDirection){
                $(el).addClass(conf.className);
                conf.fixedCallback();
            }else {
                $(el).removeClass(conf.className);
                conf.unFixedCallback();
            }

        }, 200)
    })
}