/**
* wfdata支持预加载
* 卖快和焦点的数据
*
*/
var legos_wfdata = require('../../legos_mod/wfdata');

import clone from '../json/clone.js';
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
// 传参方案不变
function wfdatare(opts) {
	opts.param = opts.param || {};
	opts.cb = opts.cb || function(){};
	!opts.retried && (opts.retried = 0);
	var _cacheKey = opts.param.cacheKey || jsonToQuery(opts.param);

	// 队列中存在请求
	if(queue[_cacheKey]){
		queue[_cacheKey]['cb'].push(opts.cb);
		queue[_cacheKey]['handleError'].push(opts.handleError);
		return;
	}
	queue[_cacheKey] = {
		cb: [opts.cb],
		handleError: [opts.handleError]
	};
	opts.cb = function(r){
		for(var i = 0;i < queue[_cacheKey]['cb'].length; i++){
			queue[_cacheKey]['cb'][i] && queue[_cacheKey]['cb'][i](r);
		}
		delete queue[_cacheKey];
	}
	opts.handleError = function(r){
		// 失败重试
		if(opts.retried < RETRYTIME){
			legos_wfdata.getData(opts);
			opts.retried++;
			return;
		}
		for(var i = 0;queue[_cacheKey] && queue[_cacheKey]['handleError'][i]; i++){
			queue[_cacheKey]['handleError'][i] && queue[_cacheKey]['handleError'][i](r);
		}
		delete queue[_cacheKey];
	}
	legos_wfdata.getData(opts);
}

// 改版后的
export function loadWfdata(params, callback, handleError) {
	params.dataType = legos_wfdata.DataType[params.dataType];
	params.cb = callback || function(){};
	params.handleError = handleError || function(){};
	wfdatare(params);
}

