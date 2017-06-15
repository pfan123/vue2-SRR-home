/**
* externals的方式挂载公用库，避免每次build
*
*/
window.$ = require('../legos_mod/zepto');

/**
* 常用模块
* 
*/
var lazyLoad = require('../legos_mod/lazyLoad'),
	wfdata = require('../legos_mod/wfdata'),
	cache = require('../legos_mod/cachev1'),
	loopScroll = require('../legos_mod/loopScroll'),
	cUI = require('../legos_mod/ui'),
	cUtil = require('../legos_mod/util'),
	cLogin = require('../legos_mod/login'),
	cTime = require('../legos_mod/time'),
	wxpopmenu = require('../legos_mod/wq.wx.menu'),
	sidenav = require('../legos_mod/wq.lib.sidenav'),
	loadJs = require('../legos_mod/loadJs'),
	addToCart = require('../legos_mod/addToCart'),
	cookie = require('../legos_mod/cookie');

// 双十二氛围
var fenwei = require('../legos_mod/wx.fenwei.20161212');

// 加载组件
import { loadJsonp} from '../lib/load/jsonp.js';
import { loadWfdata } from '../lib/load/wfdatare.js';
import { getJs, triggerLoad, onLoad } from '../lib/load/static.js';
import { listener } from '../lib/util/listener.js';

// debug
import { log } from './resource/debug.js';

window.JDK = {
	lazyLoad,
	wfdata,
	cache,
	loopScroll,
	cUI,
	cUtil,
	cLogin,
	cTime,
	wxpopmenu,
	sidenav,
	loadJs,
	load: {
		loadJsonp,
		loadWfdata,
		getJs,
		triggerLoad,
		onLoad
	},
	listener,
	debug: {
		log
	},
	// 氛围
	fenwei,
	addToCart,
	cookie
};