define('addToCart', function(require, exports, module) {
    var cLs = require('./loadJs'),
        cCk = require('./cookie'),
        _cacheThisModule_='',
        ckey = 'cartNum';

    function $jdAddCart(skuId, opt) {
        var addrId = localStorage.getItem('jdAddrId') || $getCookie('jdAddrId') || localStorage.getItem('jdLOCAddrId') || $getCookie('jdLOCAddrId') || '1_72_4139';
        addrId = addrId.split('_');
        var param = ['http://wq.jd.com/deal/mshopcart/addcmdy?callback=addCartCB&scene=2',
            'type=0',
            'commlist=' + [skuId, '', 1, skuId, '1,0,0'].join(','),
            'locationid=' + [addrId.slice(0, 3).join('-')],
            't=' + Math.random()
        ],
        dAlert = typeof opt.dAlert === 'function' ? opt.dAlert : function(msg){return function(){alert(msg)}}, //显示提示的高阶函数
        emptyFunc = function(){},
        goLogin = typeof opt.goLogin === 'function' ? opt.goLogin : dAlert('未登录'),
        success = typeof opt.success === 'function' ? opt.success : emptyFunc,
        fail = typeof opt.fail === 'function' ? opt.fail : emptyFunc;
        window.addCartCB = function(json, loginFun) {
            if (json.errId == '13') {
                goLogin();
                return;
            } else if (json.errId == '8968') {
                dAlert('商品数量最大超过200')();
            } else if (json.errId == '8969') {
                dAlert('添加商品失败，已超出购物车最大容量！')();
            } else if (json.errId == '0') {
                success(json);
                dAlert('添加成功')();
            } else {
                fail(json);
                dAlert('添加失败，请稍后再试')();
            }
        }
        cLs.loadScript(param.join('&'));
    }

    function $jdGetCart(){
        return localStorage.getItem('cartNum')*1 || cCk.get('cartNum')*1 || 0;
    }

    function $jdSetCart(num){
        if(num){
            cCk.set('cartNum', num, 999999, "/", 'wanggou.com');
            localStorage.setItem('cartNum', num);
        }
    }

    exports.add = $jdAddCart;
    exports.set = $jdSetCart;
    exports.get = $jdGetCart;
});