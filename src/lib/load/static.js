/**
* 异步静态资源加载
* localstorage缓存配置
* 跨域问题，暂时无法启用缓存
*
*/

var $ = require('../../legos_mod/zepto'),
	cache = require('../../legos_mod/cachev1');

import URL from '../URL.js';
function parseURL(url){
    var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'];
    var results = parse_url.exec(url);
    var that = {};
    for (var i = 0, len = names.length; i < len; i += 1) {
        that[names[i]] = results[i] || '';
    }
    return that;
};
var wait = {},
	callbacks  = {};

export function getJs(opts){
	var conf = {
		url: '',
		cache: false,
		expire: 7 * 24 * 60 * 60,
		delay: 0,
		wait: false,
		type: 'js',
		callback: function(){}
	},
	opts = opts || {};
	for(var i in opts){
		conf[i] != undefined && (conf[i] = opts[i]);
	}
	if(conf.wait){
		var key = conf.wait;
			conf.wait = false;
		!wait[key] && (wait[key] = []);
		wait[key].push(conf);
		// 特殊处理保留字段
		if(key == 'firstScreenEnd'){
			setTimeout(function(){
				triggerLoad('firstScreenEnd');
			},1000);
		}
		return;
	}

	var urlParse = URL(conf.url);
	var urlPath = urlParse.urlInfo.path,
		urlV    = urlParse.getParam('_v');

	var _cache = cache.local.getItem(urlPath);
	if(_cache && urlV && _cache._v == urlV){
		try{
			window.eval(_cache.con);
		}catch(e){}
		conf.callback(_cache.con);
		return;
	}
	setTimeout(function(){
		var script = document.createElement('script');
			script.type = 'text/javascript';
			script.charset = 'utf-8';
			script.onload = function(){
				conf.callback();
			}
			script.src = conf.url;
			document.getElementsByTagName('head')[0].appendChild(script);
	}, conf.delay);
	
}
export function triggerLoad(key){
	if(wait[key]){
		wait[key].forEach(function(o, i){
			if(o.type == 'css'){
				getCss(o);
			}else {
				getJs(o);
			}
		})
		delete wait[key];
	}

	if(callbacks[key]){
		callbacks[key].forEach(function(o, i){
			typeof o == 'function' && o();
		})
		delete callbacks[key];
	}
}
export function onLoad(key, cb){
	!callbacks[key] && (callbacks[key] = []);
	callbacks[key].push(cb);
}
export function getCss(opts){
	var conf = {
		url: '',
		cache: false,
		expire: 7 * 24 * 60 * 60,
		delay: 0,
		wait: false,
		type: 'css',
		callback: function(){}
	},
	opts = opts || {};
	for(var i in opts){
		conf[i] != undefined && (conf[i] = opts[i]);
	}
	if(conf.wait){
		var key = conf.wait;
			conf.wait = null;
		!wait[key] && (wait[key] = []);
		wait[key].push(conf);
		return;
	}
	var urlParse = URL(conf.url);
	var urlPath = urlParse.urlInfo.path,
		urlV    = urlParse.getParam('_v') || -1;

	var _link = document.createElement('link');
		_link.type = 'text/css';
		_link.rel = 'stylesheet';
	_link.onload = function(){
		conf.callback();
	}
	document.head.appendChild(_link);
	_link.href = opts.url;
	
}