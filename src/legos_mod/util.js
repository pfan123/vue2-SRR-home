define('util', function(require, exports, module) {
	var _cacheThisModule_;
	var $ = require('./zepto'),
		ls = require('./loadJs');

	/**
	 * [checkInScreen 检查元素是否在屏幕内/上方/下方]
	 * @param  {[type]} dom    [dom元素, zepto包装]
	 * @param  {[type]} offset [偏移量，对元素的顶部进行偏移计算]
	 * @param  {[type]} type   [检测类型, 
	 *                          up:元素完全在屏幕上方，
	 *                          down:元素完全在屏幕下方，
	 *                          partup: 元素有在屏幕上的部分, 
	 *                          partdown: 元素有在屏幕下方的部分，
	 *                          不填或为其它值：元素在屏幕内]
	 * @return {[type]}        [description]
	 */
	function checkInScreen(dom, offset, type) {
		var pageHeight = document.documentElement.clientHeight,
			pageTop = $(document.body).scrollTop(),
			pageBottom = pageHeight + pageTop,
			dis = offset || 0,
			size = dom.offset(),
			itemTop = size.top - dis,
			itemBottom = itemTop + size.height,
			checkType = type || '';
		if (checkType === 'up') {
			if (itemBottom < pageTop) {
				return true;
			}
		} else if (checkType === 'down') {
			if (itemTop > pageBottom) {
				return true;
			}
		} else if(checkType === 'partup'){
			if(itemTop < pageTop){
				return true;
			}
		} else if(checkType === 'partdown'){
			if(itemBottom > pageBottom){
				return true;
			}
		} else {
			if ((itemTop < pageBottom && itemTop > pageTop) || (itemBottom < pageBottom && itemBottom > pageTop)) {
				return true;
			} else if (itemTop < pageTop && itemBottom > pageBottom) {
				return true;
			}
		}
		return false;
	}

	function delay(f, t) {
		var now = Date.now,
			last = 0,
			ctx, args,
			exec = function() {
				last = now();
				f.apply(ctx, args)
			};
		return function() {
			cur = now();
			ctx = this, args = arguments;
			if (cur - last > t) {
				exec();
			}
		}
	}

	function delegateMove() {
		var sy, direction, delegateFunc = [];
		this.listen = function(func) {
			if (typeof func === 'function') {
				delegateFunc.push(func);
			}
		};
		this.remove = function(func) {
			if (typeof func !== 'function') return;
			for (var i = 0, l = delegateFunc.length; i < l; i++) {
				if (func === delegateFunc[i]) {
					delegateFunc.splice(i, 1);
				}
			}
		};
		document.addEventListener('touchstart', function(e) {
			var touches = e.touches[0];
			sy = touches.clientY;
		});
		document.addEventListener('touchmove', function(e) {
			var touches = e.changedTouches[0],
				endTy = touches.clientY;
			if (endTy - sy > 0) {
				direction = 'up';
			} else if (sy - endTy > 0) {
				direction = 'down';
			}
		});
		document.addEventListener('touchend', delay(function() {
			fireFunc(direction);
		}, 80));
		document.addEventListener('scroll', delay(function() {
			fireFunc(direction);
		}, 80));

		function fireFunc(d) {
			for (var i = 0, l = delegateFunc.length; i < l; i++) {
				delegateFunc[i].apply(null, [d]);
			}
		}
	}

	function isDate(d) {
		try {
			var d = new Date(d);
			d = null;
			return true;
		} catch (e) {
			return false;
		}
	}

	function format(s) {
		var re = /{\d+}/g,
			args = Array.prototype.slice.call(arguments, 1),
			r = s.toString();
		return r.replace(re, function(v) {
			var vi = v.substr(1, v.length - 2);
			return typeof args[vi] === 'undefined' ? v : args[vi];
		});
	}

	/**
	 * itil上报
	 */
	function itilReport(option) {
		var opt = {
			bid: "1", //业务id(后台分配)
			mid: "01", //页面id(后台分配)
			res: [], //页面监控业务的结果数组(
			onBeforeReport: null, //上报前回调函数
			delay: 5000 //延迟上报时间(ms)
		}
		for (var k in option) {
			opt[k] = option[k];
		}
		if (opt.res.length > 0) {
			//设置itil上报空回调，减少badjs
			window.reportWebInfo = function(json) {};
			//页面加载5s后上报
			window.setTimeout(function() {
				opt.onBeforeReport && opt.onBeforeReport(opt);
				var pstr = opt.bid + opt.mid + "-" + opt.res.join("|");
				var url = "http://bases.wanggou.com/mcoss/webreport/ReportWebInfo?report=" + pstr + "&t=" + new Date() / 1000;
				ls.loadScript({
					url: url
				});
			}, opt.delay);
		}
	}

	/**
	 * 查询url中的参数
	 */
	function getQuery(name, url) {
		//参数：变量名，url为空则表从当前页面的url中取
		var u = arguments[1] || window.location.search,
			reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"),
			r = u.substr(u.indexOf("\?") + 1).match(reg);
		return r != null ? r[2] : "";
	}

	/**
	 * 添加url中的参数
	 */
	function setQuery(json, url){
		var hash = url ? url.match(/#.*/)&&url.match(/#.*/)[0]||"" : location.hash,
			search = url ? url.replace(/#.*/,"").match(/\?.*/)&&url.replace(/#.*/,"").match(/\?.*/)[0]||"" : location.search,
			path = url ? url.replace(/#.*/,"").replace(/\?.*/,"") : location.protocol+"//"+location.host+location.pathname;
		for(var i in json){
			var query = i+"="+json[i],
				oldValue = getQuery(i, search);
			if(oldValue){
				search = search.replace(i+"="+oldValue,i+"="+json[i]);
			}else{
				search = (search.length>0)?search +"&"+ query:"?"+query;
			}
		}
		return path+search+hash;
	}

	/**
	 * 读取COOKIE
	 */
	function getCookie(name) {
		var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"), val = document.cookie.match(reg);
		return val ? (val[2] ? unescape(val[2]).replace(/(^")|("$)/g,"") : "") : null;
	}
	/**
	 * 写入COOKIES
	 */
	function setCookie(name, value, expires, path, domain, secure) {
		var exp = new Date(), expires = arguments[2] || null, path = arguments[3] || "/", domain = arguments[4] || null, secure = arguments[5] || false;
		expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
		document.cookie = name + '=' + escape(value) + ( expires ? ';expires=' + exp.toGMTString() : '') + ( path ? ';path=' + path : '') + ( domain ? ';domain=' + domain : '') + ( secure ? ';secure' : '');
	}

	/**
	 * 获取指定hash值
	 * 如 #key=xxx
	 */
	function getHash(name) {
		var u = arguments[1] || location.hash;
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = u.substr(u.indexOf("#") + 1).match(reg);
		if (r != null) {
			return r[2];
		}
		return "";
	}

	function htmlDecode(str){
		return typeof(str) != "string" ? "" : str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&nbsp;/g, " ").replace(/&#39;/g,"'").replace(/&amp;/g, "&");
	}

	function htmlEncode(str){
		return typeof(str) != "string" ? "" : str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;").replace(/ /g, "&nbsp;");
	}

	function strSubGB(str,start,len,flag){
		//进行字符长度验证，如果超过长度则返回截断后的字符串
		var total = strLenGB(str);
		if(total > (len-start)){
			var flag=flag||"";
			var strTemp=str.replace(/[\u00FF-\uFFFF]/g, "@-").substr(start,len);
			var subLen =strTemp.match(/@-/g)?strTemp.match(/@-/g).length:0;
			return str.substring(0,len-subLen)+flag;
		}
		return str;
	}
	function strLenGB(v){
		//一个中文按照两个字节算，返回长度
		return v.replace(/[\u00FF-\uFFFF]/g,"  ").length;
	}

	/**
	 * 判断是否是微信5.0以上(5.0以上支持微信支付)
	 */
	function canWxPay() {
		var ua = navigator.userAgent.toLowerCase();
		return ua.match(/micromessenger/) ? true : false;
	}

	// 清除缓存记录
	function removeStorage(key) {
		window.localStorage.removeItem(key);
	}
	/**
	 * 保存本地缓存信息
	 * @param key       保存的key
	 * @param value     需要保存的值
	 * @param isJson    是否是json格式数据
	 */
	function saveStorage(key, value, isJson) {
		window.localStorage.setItem(key, isJson ? JSON.stringify(value) : value);
	}
	/**
	 * 通过key获取对应的值
	 * @param key
	 * @return {*}
	 */
	function getStorage(key) {
		return window.localStorage.getItem(key);
	}

	/**
	 * 判断是否支持本地缓存
	 */
	function isSupportStorage() {
		if (!window.localStorage) {
			return false;
		}
		//safari的隐私模式不支持缓存
		try {
			window.localStorage.setItem("test", true);
			window.localStorage.removeItem("test");
			return true;
		} catch(e) {
			return false;
		}
	}

	//判断是不是手机QQ浏览器
	function isSQ() {
		var cid = getCookie('cid');
		if(cid == 2) return true;
		if(/qq\/([\d\.]+)*/i.test(navigator.userAgent)){
			return true;
		}
		return false;
	}
	//判断是不是手机微信浏览器
	function isWX() {
		var cid = getCookie('cid');
		if(cid == 1) return true;
		if(/MicroMessenger/i.test(navigator.userAgent)){
			return true;
		}
		return false;
	}

	// 在弹出浮层后阻止页面继续滑动
	function preventPageScroll(node) {
		node[0].ontouchstart = handleStart;
		function handleStart(e) {
			node[0].ontouchmove = handleMove;
		}

		function handleMove(evt) {
			evt.preventDefault();
			node[0].ontouchend = handleEnd;
		}

		function handleEnd() {
			node[0].ontouchend = null;
			node[0].ontouchmove = null;
		}
	}

	//登陆跳转
	function loginLocation(url){
		if(getCookie('wg_uin') && getCookie('wg_skey')){  //简单判断登陆
			location.href = url;
		}
		else{
			login(url);
		}
	}
	//登陆
	function login(reUrl) {
		//http://party.wanggou.com/tws64/m/lt/Logout?domain=1  退出
		reUrl = reUrl || location.href;
		if (isWX()) {
			window.location.href = 'http://party.wanggou.com/tws64/m/wxv2/Login?appid=1&rurl=' + encodeURIComponent(reUrl);
		} else {
			window.location.href = 'http://party.wanggou.com/tws64/m/h5v1/cpLogin?rurl=' + encodeURIComponent(reUrl) + '&sid=' + getCookie('sid') + '&uk=' + getCookie('uk');
		}
	}

	function addRd(url, rd) {
		url = url.replace(/？/g, "?");//异常处理
		var reg = /ptag[=,]\d+\.\d+\.\d+/i,//有两种情况，PTAG=20219.28.10和PTAG,20219.28.10（网购搜索特有）
			hasQuery = /\?/.test(url);
		hasAnchor = url.indexOf('#')>-1;
		if(reg.test(url)){//已经有rd的情况,则进行替换
			url = url.replace(reg, "PTAG=" + rd);
		}else{//没有rd，则进行追加
			url = hasAnchor?url.replace("#",(hasQuery?"&":"?")+"PTAG="+rd+"#"):(url+(hasQuery?"&":"?")+"PTAG="+rd);
		}
		return url;
	}
	
	//移除数组中重复的值
	function arrayUniq(arr){
		var returnArr=[];
		for (var i=0,len=arr.length;i<len;i++){
			((","+returnArr+",").indexOf(","+arr[i]+",")<0)?returnArr.push(arr[i]):'';
		};
		return returnArr;	
	}

	/* *****
	 * 执行一次函数
	 * eg : var one = util.once(function(){
	 *           // do some thing
	 *      });
	 *
	 *      one();
	 *      one();
	 * *****
	 */
	function once(fn){
		var run = false;
		return function(){
			!run && (run = !run, typeof fn === 'function' && fn.call());
		}
	}

	// latitude 纬度 longitude 经度
	function getMyLocation(callback) {
	    var cookiecoores, res;
	    function mysave(coords) {
	        if (coords && coords.longitude) {
	            var val = JSON.stringify(coords);
	            JD.cookie.set('coords', val, 60, '/', 'jd.com');
	        }
	    }
	    function myget() {
	        var coords;
	        coords = JD.cookie.get('coords');
	        coords = JSON.parse(coords);
	        if (!coords || !coords.longitude || !coords.latitude) {
	            coords = false;
	            JD.cookie.del('coords', '/', 'jd.com');
	        }
	        return coords;
	    }
	    function isMQQUserAgent() {
	        if (/qq\/([\d\.]+)*/.test(navigator.userAgent.toLowerCase())) {
	            return true;
	        }
	        return false;
	    }
	    function isWxUserAgent() {
	        if (navigator.userAgent.indexOf('MicroMessenger') > 0) {
	            return true;
	        }
	        return false;
	    }
	    cookiecoores = myget();
	    if (cookiecoores) {
	        callback && callback(cookiecoores);
	    } else {
	        if (isWxUserAgent()) {
	            JD.wxapi.ready(function (config) {
	                config.beta = true;
	                wx.getLocation({
	                    type: 'gcj02', // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
	                    success: function (position) {
	                        res = {
	                            'latitude': position.latitude,
	                            'longitude': position.longitude
	                        };
	                        mysave(res);
	                        callback && callback(res);
	                    }
	                });
	            });
	        } else if (isMQQUserAgent()) {
	            mqq.sensor.getLocation(function (retCode, latitude, longitude) {
	                res = {
	                    'latitude': latitude,
	                    'longitude': longitude
	                };
	                mysave(res);
	                callback && callback(res);
	            });
	        } else if (navigator.geolocation) {
	            navigator.geolocation.getCurrentPosition(function (position) {
	                res = {
	                    'latitude': position.coords.latitude,
	                    'longitude': position.coords.longitude
	                }
	                mysave(res);
	                callback && callback(res);
	            });
	        }
	    }
	}

	return {
		checkInScreen: checkInScreen,
		delay: delay,
		delegateMove: delegateMove,
		isDate: isDate,
		format: format,
		itilReport : itilReport,
		getQuery : getQuery,
		setQuery : setQuery,
		getCookie : getCookie,
		setCookie : setCookie,
		getHash : getHash,
		htmlDecode : htmlDecode,
		htmlEncode : htmlEncode,
		strSubGB : strSubGB,
		strLenGB : strLenGB,
		canWxPay : canWxPay,
		isSupportStorage : isSupportStorage,
		isSQ : isSQ,
		isWX : isWX,
		saveStorage : saveStorage,
		getStorage : getStorage,
		removeStorage : removeStorage,
		preventPageScroll : preventPageScroll,
		loginLocation : loginLocation,
		login : login,
		addRd:addRd,
		arrayUniq: arrayUniq,
		once: once,
		getMyLocation: getMyLocation
	};
});