define('time', function(require, exports, module) {
	var __cacheThisModule__;
	var cLs = require('./loadJs'),

		servertime = 0, //单位 : 毫秒
		serverOffsetTime = 0,  //服务器时间 - 本地时间
		heart = 0,
		heartEvents = [],
		callback,
		// 获取服务端时间的接口
		timeCgi = '//wq.jd.com/mcoss/servertime/getservertime?callback=GTSTime';

	function heartBeat() {
		if (!heart) {
			heart = setInterval(function() {
				if (servertime) {
					servertime += 1000;
				}
				doHeartBeat();
			}, 1000);
		}
	}

	function doHeartBeat() {
		if (heartEvents.length) {
			for (var i = 0; i < heartEvents.length; i++) {
				try {
					heartEvents[i]();
				} catch (e) {}
			}
		}
	}

	function hasHeartBeat(key) {
		return heartEvents.some(function(v) {
			return v.evtid && v.evtid === key;
		});
	}

	function removeHeartBeat(key, byGroup) {
		var v;
		if (heartEvents.length) {
			for (var i = 0; i < heartEvents.length; i++) {
				v = heartEvents[i];
				if (v && v.evtid) {
					if (!byGroup && v.evtid === key) {
						heartEvents.splice(i--, 1);
					} else if (byGroup && (new RegExp(key).test(v.evtid.toString()))) {
						heartEvents.splice(i--, 1);
					}
				}
			}
		}
	}

	function startHeartBeat(st) {
		if (!servertime && st > 0) {
			servertime = st * 1;
			heartBeat();
		}
	}

	/**
	 * [getYMD 获取年月日字符串]
	 * @param  {[Date]} d [要计算的日期]
	 * @return {[String]}   [年月日字符串]
	 */
	function getYMD(d) {
		return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
	}

	/**
	 * [floorHour 时间按小时取整]
	 * @param  {[Date]} d [要计算的日期]
	 * @return {[Int]}   [整点小时的秒数]
	 */
	function floorHour(d){
		return new Date(getYMD(d)+' '+d.getHours()+':00:00').getTime() / 1000;
	}

	~function init() {
		serverOffsetTime = window.sessionStorage.getItem("JD_serverOffsetTime") || false;
		if(serverOffsetTime){  //有缓存时间差
			serverOffsetTime = parseInt(serverOffsetTime,10);
			startHeartBeat(new Date().getTime() + serverOffsetTime);
			typeof callback === 'function' && callback(servertime);
		}else{  //没有缓存，接口拉取
			var requestTime = new Date().getTime();  //请求时时间
			window['GTSTime'] = function(json){
				var responseTime = new Date().getTime();  //请求返回时时间
				if (json.errCode === '0') {
					var _serverTime = new Date(json.data[0].serverTime).getTime() + parseInt((responseTime - requestTime)/2,10);
					serverOffsetTime = _serverTime - responseTime;
					window.sessionStorage.setItem("JD_serverOffsetTime",serverOffsetTime);
					startHeartBeat(_serverTime);
					typeof callback === 'function' && callback(servertime);
				}else{
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				}
			};
			cLs.loadScript({
				url: timeCgi+'&t='+Math.random(),
				charset: 'utf-8',
				onError:function(){
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				},
	            onTimeout:function(){
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				}
			});
		}
	}();

	return {
		getServerTime: function(){
			if(servertime == 0){
				return (new Date().getTime());
			}else{
				return servertime;
			}
		},
		getServerOffsetTime:function(){
			return serverOffsetTime;
		},
		listen: function(evt){
			heartEvents.push(evt);
		},
		done: function(func){
			if(servertime){
				setTimeout(function(){
					func(servertime);
				},0);
			}else{
				callback = func;
			}
		},
		getYMD: getYMD,
		floorHour: floorHour,
		start: startHeartBeat,
		has: hasHeartBeat,
		remove: removeHeartBeat
	};
});