/**
* jsonp接口调用
* 
*/

var cache = require('../../legos_mod/cachev1'),
	loadJs = require('../../legos_mod/loadJs');

import getUniqueKey from '../util/getUniqueKey.js';
var queue = {}, 
	loadedData = {};
const RETRYTIME = 1;
function jsonToQuery(data){
	var r = [];
	for(var i in data){
		r.push(i + '=' + data[i]);
	}
	return r.join('&');
}

function getLink(url, data) {
	var _query = jsonToQuery(data);
	if(url.indexOf('?') > -1){
		url += '&';
	}else {
		url += '?';
	}
	return url + _query;
}

function jsonp(url, data, callback, onError, onTimeout) {
	if(!url || typeof url !== 'string' || !data){
		throw 'jsonp parameter error!';
	}
	var callback = callback || function(){},
		_cacheKey = getLink(url, data);
	var retried = 0;
	// 缓存中已存在结果
	var _cacheValue = cache.session.getItem(_cacheKey);

	if(_cacheValue){
		callback && callback(_cacheValue);
		return;
	}
	// 队列中已存在请求
	if(queue[_cacheKey]){
		queue[_cacheKey].push(callback);
		return;
	}

	queue[_cacheKey] = [callback];

	var _callbackName = data.callback || ('jsonp_' + getUniqueKey());
	data.callback = _callbackName;

	window[_callbackName] = function(r) {
		for(var i = 0;queue[_cacheKey][i]; i++){
			queue[_cacheKey][i] && queue[_cacheKey][i](r);
		}
		// 结果缓存于sessionStorage
		cache.session.setItem(_cacheKey, r);
		delete window[_callbackName];
		delete queue[_cacheKey];
	}
	function _load(){
		loadJs.loadScript({
			url: url,
			data: data,
			charset: "utf-8",
			onError: function(){
				if(retried < RETRYTIME){
					_load();
					retried ++;
					return;
				}
				delete window[_callbackName];
				delete queue[_cacheKey];
				onError && onError();
			},
			// 超时同出错处理
			onTimeout: function(){
				if(retried < RETRYTIME){
					_load();
					retried ++;
					return;
				}
				delete window[_callbackName];
				delete queue[_cacheKey];
				onTimeout && onTimeout();
			}
		})
	}
	_load();

}

export function loadJsonp(params, callback, handleError){
	callback = callback || function(){};
	handleError = handleError || function(){};
	jsonp(params.url, params.data, callback, handleError, handleError);
}
