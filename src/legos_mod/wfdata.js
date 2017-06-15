define('wfdata', function(require, exports, module) {
    var _cacheThisModule_,
        $ = require('../legos_mod/zepto'),
        ls = require('./loadJs'),
        useDebug = JD.url.getUrlParam("mdebug") ? true : false,
        storage = require("./mqqStorage"),
        md5 = require("./md5"),

        _DataType = {
            MART: 0, //单卖快
            CPT: 1, //CPT的具体参数见 http://cf.jd.com/pages/viewpage.action?pageId=46363407
            CPC: 2,
            CPT_WX: 3,
            MART_MUTI: 4, //多卖快
            PPMS: 5,
            MaterialQuery: 6, //素材详情
            Spematerial: 7,
            Mportal: 8,
            Brandspecial: 9,
            Keywordsearch: 10, //金手指关键词
            CPC_NEW: 11, //新焦点
            SECKILL: 12, //秒杀接口
            RANKLIST: 13 //排行榜
        },
        myDomain = '//wq.jd.com',
        cgi = [myDomain + '/mcoss/mmart/show', //MART
            myDomain + '/mcoss/focuscpt/qqshow', //CPT
            myDomain + '/mcoss/focusbi/show', //CPC
            myDomain + '/mcoss/focuscpt/wxshow', //CPT_WX
            myDomain + '/mcoss/mmart/mshow', ///多卖快
            '//wq.360buyimg.com/data/ppms/js/ppms.page{#key#}.jsonp', //PPMS的路径
            myDomain + '/mcoss/material/query',
            myDomain + '/mcoss/spematerial/spematerialshow', //手Q惠品牌新特卖接口//wq.jd.com/mcoss/brandspecial/show?
            myDomain + '/mcoss/mportal/show', //mportal接口，目前用于微信女装馆
            myDomain + '/mcoss/brandspecial/show', //手Q惠品牌新 拉取mid 接口 //wq.jd.com/mcoss/spematerial/spematerialshow?requestParam 
            myDomain + '/mcoss/keyword/keywordsearch', //金手指关键词
            myDomain + '/mcoss/focusbi/show_new',
            myDomain + '/mcoss/seckill/show', //秒杀接口
            myDomain + '/mcoss/ranklist/bshow' //秒杀接口
        ];

    /**
     * 对象转化为字符串
     * @param  {object}  param         要转化的对象
     * @param  {Boolean} isGetCacheKey true:转成cachekey,false组合成url
     * @return {[type]}                转化后的字符串
     
     */
    function getParamStr(param, isGetCacheKey) {
        var arr = [];

        for (var key in param) {
            var v = param[key] + "";
            //如果限制了参数，则判断参数
            if (v) {
                arr.push(isGetCacheKey ? key + '_' + v : key + '=' + v);
            }
        }
        if (isGetCacheKey) {
            // arrObj.sort(function(a,b){return a.key-b.key;})
            return arr.sort().join('_'); //因为arr的位置会变化，所以需要排序


        } else {
            arr.push('t=' + Math.round(new Date() / (1000 * 300)));
            return arr.join('&');
        }

    }


    //CGI要替换回调方法
    function getCGI(opt) {
        var nowtype = opt.dataType;
        var tplUrl = cgi[opt.dataType];
        if (window.GLOBAL_USEWQCOSS == "1" && opt.userNewCoss) {
            //使用coss新域名
            if (nowtype == _DataType.MART || nowtype == _DataType.CPC || nowtype == _DataType.CPC_NEW || nowtype == _DataType.MART_MUTI || nowtype == _DataType.Spematerial || nowtype == _DataType.Brandspecial) {
                tplUrl = tplUrl.replace("//wq.jd.com", "//wqcoss.jd.com");
            }
        }
        return opt.dataType == _DataType.PPMS ? tplUrl.replace("{#key#}", opt.param.key) : tplUrl;

    }

    //防止页面异步的时候产生两个同样的全局方法，导致回调出错
    function getCBName(cbName, params) {
        return cbName = cbName || "cb" + md5.getHash(getParamStr(params, true));
    }

    /**
     * [getStaticUrl 获取静态容灾cgi地址]
     * @param  {[type]} type [cgi类型，_DataType.MART,_DataType.CPT,_DataType.CPC]
     * @param  {[type]} url  [动态cgi地址]
     * @return {[type]}      [静态容灾cgi地址]
     */
    function createStaticUrl(type, url, opt) {
        var validParamsMap = {
            0: ["actid", "ptype", "pi", "pc", "pcs", "cgid", "areaid", "sorttype", "ch", "callback", "tpl", "pretime", "mscence", "exclarea", "options", "gbyarea", "btime", "etime"], //单卖快
            1: ["id", "pageindex", "pagesize", "tpl", "category", "level", "ch", "webview", "parent", "minimg", "newarrival", "tag", "callback", "bi", "showtype", "sday", "eday"], //焦点cpt
            2: ["gids", "pc", "callback", "pcs"], //焦点cpc
            3: ["id", "pageindex", "pagesize", "tpl", "category", "level", "ch", "webview", "parent", "minimg", "newarrival", "tag", "callback", "bi", "showtype", "sday", "eday"], //焦点cpt（微信）
            4: ["actid", "ptype", "pi", "pc", "pcs", "cgid", "areaid", "sorttype", "ch", "callback", "tpl", "pretime", "mscence", "exclarea", "options", "gbyarea", "btime", "etime"], //多区域快
            6: [
                ["mids", "gid", "callback"],
                ["showtype", "gid", "callback", "category", "pageindex", "pagesize"]
            ], //获取素材详情
            7: ["aid", "actid", "pagesize", "pageindex", "callback", "showtype", "category"], //品牌特卖素材详情接口
            9: ["aid", "pagesize", "pageindex", "callback", "showtype", "category"], //品牌特卖列表接口
            10: ["ruleid", "pi", "pc", "tpl", "sorttype", "callback", "options", "cgid1", "cgid2", "cgid3"], //品牌特卖列表接口ruleid,pi,pc,tpl,sorttype,callback,options,cgid1,cgid2,cgid3
            11: ["gids", "pc", "callback", "pcs"], //新焦点cpc
            12: ["actid", "ptype", "pi", "pc", "cgid", "areaid", "ch", "callback", "tpl", "pretime", "mscence", "exclarea", "options", "gbyarea"],
            13: ["rids", "mscence", "callback", "sn", "rt", "st", "cl"]
        };
        if (type == _DataType.MART || type == _DataType.MART_MUTI || type == _DataType.SECKILL || type == _DataType.RANKLIST) { //对于mmart或者multi_mart，需要为url补充特殊必须参数mscence（1-微信 2-手Q 3-浏览器 4-服务APP）
            url += "&mscence=" + (({
                "weixin": 1,
                "qq": 2,
                "jzyc": 4,
                "mobile": 3
            })[JD.device.scene] || 3);
        }
        var params = url.split("?")[1]; //获取参数部分
        var paramObj = {};
        var pairs = params.split("&"); //将Url中的参数分解成key=value这种形式的数组列表
        var keys = pairs.map(function(pair) { //获取参数名称列表,并构造参数对象列表
            var key = pair.split("=")[0];
            //新焦点对gids参数进行排序再生成容灾
            if(type == _DataType.CPC_NEW && key == "gids"){
                var gidsvalue = pair.split("=")[1];
                gidsvalue = gidsvalue.split("|");
                gidsvalue.sort(function(a, b) {
                    return a - b;
                });
                paramObj[key] = key+"="+gidsvalue.join("|");
            }else if(type == _DataType.CPC_NEW && key == "pcs"){
                var gidsvalue = pair.split("=")[1];
                gidsvalue = gidsvalue.split(",");
                gidsvalue.sort();
                paramObj[key] = key+"="+gidsvalue.join(",");
            }else{
                paramObj[key] = pair;
            }
            return key;
        });
        var validParams = validParamsMap[type];
        if (type === _DataType.MaterialQuery) { //素材详情接口，有两套容灾规则,有效参数白名单不一样，用参数中是否有pageindex来区分，Fuck!!!!!
            validParams = opt.param.pageindex ? validParams[1] : validParams[0];
        }
        keys = keys.filter(function(key) { //过滤掉不合法的参数
            return validParams.some(function(validKey) {
                return key == validKey;
            });
        });
        keys.sort(); //按照参数名称从小到大排序
        //typeKey为容灾文件所在目录,一般也是cgi所在的目录
        var typeKey = ({
            0: "mmart", //_DataType.MART
            1: "focuscpt", //_DataType.CPT
            2: "focusbi", //_DataType.CPC
            3: "focuscpt", //_DataType.CPT_WX
            4: "mmart", //_DataType.MART_MUTI
            6: "material", //_DataType.MaterialQuery
            7: "spematerial", //Spematerial
            9: "brandspecial", // Brandspecial
            10: "keyword", // Keywordsearch
            11: "focusbi", //CPC_NEW
            12: "seckill", //SECKILL
            13: "ranklist" //RANKLIST
        })[type];
        var cgiName = url.match(/\w+(?=\?)/)[0];
        var urlKey = keys.reduce(function(pre, cur, index) { //构造url和参数的key,用于生成md5值
            return pre + "_" + paramObj[cur].replace(/[,:;|\/=]/g, "_");
        }, "mcoss_" + typeKey + "_" + cgiName);

        console.log(urlKey);
        var md5Key = md5.getHash(urlKey); //计算md5值
        /*var actid = paramObj[({
            0: "actid", //_DataType.MART
            1: "id", //_DataType.CPT
            2: "gids", //_DataType.CPC
            3: "id", //_DataType.CPT_WX
            4: "pcs", //_DataType.MART_MUTI
            6: "gid", //_DataType.MaterialQuery
            7: "actid",//Spematerial
            9: "aid",// Brandspecial,
            10: "ruleid"// Keywordsearch
        })[type]].split("=")[1];*/
        var str = paramObj[({
            0: "actid", //_DataType.MART
            1: "id", //_DataType.CPT
            2: "gids", //_DataType.CPC
            3: "id", //_DataType.CPT_WX
            4: "pcs", //_DataType.MART_MUTI
            6: "gid", //_DataType.MaterialQuery
            7: "actid", //Spematerial
            9: "aid", // Brandspecial,
            10: "ruleid", // Keywordsearch
            11: "gids", //_DataType.CPC_NEW
            12: "actid", //_DataType.SECKILL  
            13: "rids" //_DataType.RANKLIST
        })[type]];
        if (!str) {
            return "";
        }
        var arr = str.split("=");
        if (arr.length) {
            var actid = arr[1];
        }
        //actid = type == _DataType.MART_MUTI ? actid.split(":")[0] : actid.split("|")[0]; //多个id时，比如gids=3472|3078|3091|3079，取第一个id作为path
        if (type == _DataType.MART_MUTI) {
            actid = actid.split(":")[0];
        } else if (type == _DataType.CPC_NEW) {
            var arr2 = actid.split("|");
            arr2.sort(function(a, b) {
                return a - b;
            });
            actid = arr2[0];
        }

        //素材详情接口，有两套容灾规则,路径参数比较特殊，用参数中是否有pageindex来区分，Fuck!!!!!
        return "//wqs.jd.com/data/coss/recovery/" + (type == _DataType.MaterialQuery && opt.param.pageindex ? "material2" : type == _DataType.Spematerial ? "specialmaterial" : typeKey) + "2/" + actid + "/" + md5Key + ".shtml" + "?" + params;
    }

    function getStaticUrl(opt) {
        var params = opt.param;
        //这个主要用于品牌二级页，不需要callback，所以callback的逻辑是多余的
        //var cbName =opt.dataType==_DataType.PPMS?opt.param.callback: getCBName(opt.param.callback,params);
        //callback如果没有指定，则通过参数组合而成；但是对于部分CGI接口，要固定，比如PPMS
        //params.callback = cbName;
        var cgi = getCGI(opt);
        //CGI路径用参数自由组合而成
        var url = cgi + (cgi.indexOf('?') > -1 ? '&' : '?') + getParamStr(params);
        //计算容灾静态地址
        var staticUrl = "";
        var strategy = JD.disasterRecovery;
        if (opt.dataType != _DataType.PPMS) { //除Ppms数据外的，其他的都有
            staticUrl = createStaticUrl(opt.dataType, url, opt);
        }
        return staticUrl || url;
    }

    //获取数据
    function fetchData(opt, cacheKey) {
        var func = arguments.callee,
            args = arguments,
            context = this;

        var params = $.extend({}, opt.param),
            // cbName = opt.param.pi ? (opt.param.callback||"cb" + opt.param.pi) : opt.param.callback;
            cbName = opt.dataType == _DataType.PPMS ? opt.param.callback : getCBName(opt.param.callback, params);
        //console.log("callback name...."+cbName);
        //cbName = getCBName(cbName,params);

        //callback如果没有指定，则通过参数组合而成；但是对于部分CGI接口，要固定，比如PPMS
        params.callback = cbName;
        var cgi = getCGI(opt);
        //CGI路径用参数自由组合而成
        var url = cgi + (cgi.indexOf('?') > -1 ? '&' : '?') + getParamStr(params);
        //计算容灾静态地址
        var staticUrl = "";
        var strategy = JD.disasterRecovery;


        if (opt.dataType == _DataType.MART && strategy.mart.useStaticUrl ||
            opt.dataType == _DataType.CPC && strategy.cpc.useStaticUrl ||
            opt.dataType == _DataType.CPT && strategy.cpt.useStaticUrl ||
            opt.dataType == _DataType.CPT_WX && strategy.cpt.useStaticUrl ||
            opt.dataType == _DataType.MaterialQuery && strategy.materialQuery.useStaticUrl ||
            opt.dataType == _DataType.MART_MUTI && strategy.multiMart.useStaticUrl ||
            opt.dataType == _DataType.Brandspecial && strategy.brandspecial.useStaticUrl ||
            opt.dataType == _DataType.Spematerial && strategy.spematerial.useStaticUrl ||
            opt.dataType == _DataType.Keywordsearch && strategy.keywordsearch.useStaticUrl ||
            opt.dataType == _DataType.CPC_NEW && strategy.cpcnew.useStaticUrl ||
            opt.dataType == _DataType.SECKILL && strategy.seckill.useStaticUrl ||
            opt.dataType == _DataType.RANKLIST && strategy.ranklist.useStaticUrl) {
            staticUrl = createStaticUrl(opt.dataType, url, opt);
        }
        //通过全局变量来判断是否加跨域标识，这个稍后看能否改进，用ajax方法获取数据
        window[cbName] = function(obj) {

            try {
                //对于PPMS返回的数据特殊处理，PPMS数据有pageId字段
                if (obj.pageId && !obj.errCode) {
                    opt.cb && opt.cb(obj);

                    storage.writeH5Data(cacheKey, obj, null, 5);

                } else if (obj.errCode == "0" || obj.retcode == "0") {
                    //判断是否容灾，只适用于CPT接口
                    if (obj.recovery && parseInt(obj.recovery) > 0) {
                        $.ajax({
                            type: 'get',
                            dataType: 'script',
                            url: obj.recoveryUrl,
                            error: function(e) {
                                JD.report.badJs(_url);
                                opt.handleError && opt.handleError(func, args, context);
                            }
                        })

                        return;
                    }
                    opt.cb && opt.cb(obj);
                    if (!useDebug) {
                        storage.writeH5Data(cacheKey, obj, null, 5);
                    }

                } else {
                    //系统错误
                    opt.utilFailed && reportUtil(ppmsData.utilFailed);
                    opt.handleError && opt.handleError(func, args, context, obj);

                }
            } catch (exp) {
                if (useDebug) {
                    console.log('wf-data-error-begin.............');
                    console.log(exp.message);
                    console.log(exp.stack);
                    console.log('..............wf-data-error-end');
                }
                opt.utilFailed && reportUtil(ppmsData.utilFailed);
                opt.handleError && opt.handleError(func, args, context, exp);
            }
        };
        if (!window.GLOBAL_CROSSORIGIN) {
            ls.loadScript({
                url: staticUrl || url,
                charset: 'utf-8',
                onError: function(msg, url, line, col, error) {
                    var errorObj = {
                        msg: msg,
                        url: url,
                        line: line,
                        col: col,
                        error: error
                    };
                    opt.handleError && opt.handleError(func, args, context, errorObj);
                }
            });
        } else {
            //如果采用跨域，则用jsonp方式请求时加上跨域标识
            JD.sendJsByDomain({
                url: staticUrl || url,
                defer: true,
                async: true,
                crossOrigin: true
            });
        }

    }

    /**
     * 私有方法：从CGI获取数据
     * @param  {对象} opt 传到CGI的参数集合+错误处理
     * @return {void}     没有返回数据采用回调方法
     */
    function getData(opt) {
        var cacheKey,
            notLoadFromCache = false; // 默认是false
        //2016.11.11期间0点期间不用缓存
        var now = JD.GLOBAL_CONFIG.NOW;
        if ((now > new Date('2016/11/10 23:55:00') && now < new Date('2016/11/11 00:10:00')) ||
            (now > new Date('2016/11/11 23:55:00') && now < new Date('2016/11/12 00:10:00'))) {
            JD.GLOBAL_CONFIG.MART_NOT_LOAD_FROM_CACHE = true;
        }
        if ((opt.dataType == _DataType.MART || opt.dataType == _DataType.MART_MUTI) && JD.GLOBAL_CONFIG.MART_NOT_LOAD_FROM_CACHE) {
            notLoadFromCache = true;
        }
        if (!useDebug && !notLoadFromCache) {
            cacheKey = opt.param.cacheKey || getParamStr(opt.param, true);
            storage.readH5Data(cacheKey, function(res, success) {
                if (!success || !res) {
                    fetchData(opt, cacheKey);
                    return;
                }
                //模拟异步, true代表是从缓存中获取数据
                window.setTimeout(function() {
                    opt.cb && opt.cb(res, true);
                }, 0);
            });
        } else {
            fetchData(opt, cacheKey);
        }
    }


    exports.getData = function(opt) {
        getData(opt);
    }
    exports.getStaticUrl = function(opt) {
        return getStaticUrl(opt);
    }
    exports.DataType = _DataType;
});