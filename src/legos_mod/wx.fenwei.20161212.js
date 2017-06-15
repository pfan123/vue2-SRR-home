define('wx.fenwei.20161212', function (require, exports, module){
'use strict';
var draw = require("./wq.lib.active.draw.new");
var checknewuser = require('./wq.lib.checknewuser');
var loadJs = require('./loadJs');
var login = require('./login');
var ui = require('./ui');

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}
if (!Array.prototype.every)
{
  Array.prototype.every = function(fun /*, thisArg */)
  {
    'use strict';

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== 'function')
        throw new TypeError();

    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
      if (i in t && !fun.call(thisArg, t[i], i, t))
        return false;
    }

    return true;
  };
}

function filterData(data) {
	return data.find(function (item) {
		return item.guanqu && window.location.href.includes(item.guanqu);
	}) || {}; //window.location.pathname
}

function filterDate(data) {
	var computedData = [];
	data.forEach(function (item) {
		var now = new Date();
		var begin = item.begin ? new Date(item.begin) : new Date('1900/01/01 00:00:00');
		var end = item.end ? new Date(item.end) : new Date('2099/12/31 00:00:00');
		if (now >= begin && now <= end) {
			computedData.push(item);
		}
	});
	return computedData;
}

function filterDate2(data) {
	var now = new Date();
	return data.find(function (item) {
		var begin = item.begin ? new Date(item.begin) : new Date('1900/01/01 00:00:00');
		var end = item.end ? new Date(item.end) : new Date('2099/12/31 00:00:00');

		return now >= begin && now <= end;
	}) || {};
}

exports.init = function (bannerContainerId, iJianhuoContainerId, newerAdContainer) {

	renderBanner(bannerContainerId);
	renderIJianhuo(iJianhuoContainerId);
	renderNewerAd(newerAdContainer);	


};

exports.isShowBanner = function () {
	var temp1 = filterData(headerData);
	if (temp1 && temp1.data && temp1.data.length) {
		console.log(!!filterDate2(temp1.data[0].active).image);
		return !!filterDate2(temp1.data[0].active).image;
	} else {
		console.log('isShowBanner', false);
		return false;
	}
};

function renderBanner(container) {
	var itemsTemplate = '',
	    bannerTemplate = void 0,
	    backgroundColor = void 0;
	var computedData = filterData(headerData).data;
	console.log(headerData, computedData);
	if (computedData && computedData.length) {
		computedData.forEach(function (item, index) {
			if (index !== 0 && filterDate2(item.active).image) {
				var _filterDate = filterDate2(item.active),
				    title = _filterDate.title,
				    image = _filterDate.image,
				    description = _filterDate.description,
				    url = _filterDate.url;

				var descriptions = void 0;
				if (description) {
					descriptions = description.split('|');
				}
				var colors = ['1547a2', '6c56d1', 'de500a', 'ec2819', 'c85cd0', '8919ae'];
				var itemTemplate = '\n\t\t\t\t<a href="' + url + '" class="theme1212_item" style="background-image: url(' + image + ');">\n\t\t\t\t  <dl style="color: #' + colors[index - 1] + '">\n\t\t\t\t    <dt>' + title + '</dt>\n\t\t\t\t    <dd>' + (descriptions ? descriptions[0] : '') + '</dd>\n\t\t\t\t    ' + (descriptions && descriptions[1] ? '<dd>' + descriptions[1] + '</dd>' : '') + '\n\t\t\t\t  </dl>\n\t\t\t\t</a>\n\t\t\t\t';
				itemsTemplate += itemTemplate;
			} else if (item.active.length && filterDate2(item.active).image) {
				var _filterDate2 = filterDate2(item.active),
				    color = _filterDate2.color,
				    _image = _filterDate2.image,
				    _url = _filterDate2.url;

				backgroundColor = color;
				bannerTemplate = '\n\t\t\t\t\t<a href="' + _url + '" class="theme1212_banner">\n\t\t\t\t\t\t<img src="' + _image + '">\n\t\t\t\t\t</a>\n\t\t\t\t\t';
			}
			var containerElement = typeof container === 'string' ? document.querySelector(container) : container;
			// const hide = document.querySelector(hideElement)
			if (containerElement && bannerTemplate) {
				containerElement.style.backgroundColor = backgroundColor;
				console.log(containerElement, backgroundColor);
				containerElement.className = 'theme1212';
				var tempTemplate = '\n\t\t\t\t\t<div class="theme1212_items">' + itemsTemplate + '</div>\n\t\t\t\t\t';
				containerElement.innerHTML = bannerTemplate + tempTemplate;
				// let timer = setInterval(function() {	
				// 	if (hide) {
				// 		clearInterval(timer)
				// 		hide.style.display = 'none'
				// 	}
				// }, 500)					
			}
		});
	}
}

function renderIJianhuo(container) {
	function initSlider(wrapSelector) {
		!function (window, undefined) {
			var _transitionEnd = 'onwebkittransitionend' in window ? "webkitTransitionEnd" : 'transitionend';

			function Slide(opt) {
				this.wrap = opt.wrap, this.speed = opt.speed || 2000, this.moveIndex = 0, this.index = 1, this.timer, this.init();
			}
			Slide.prototype = {
				constructor: "Slide",
				automove: function automove() {
					var self = this;
					self.hidedom = self.wrap.children[0];
					var moveY = self.hidedom.getBoundingClientRect().height;
					self.wrap.style.cssText = "-webkit-transition:-webkit-transform 0.5s;transition:transform 0.5s;transform:translateY(-" + moveY + "px);-webkit-transform:translateY(-" + moveY + "px);";
				},
				init: function init() {
					var self = this;
					self.timer = setInterval(function () {
						self.automove();
					}, self.speed);
					self.wrap.addEventListener(_transitionEnd, function () {
						self.wrap.style.cssText = "-webkit-transform:translateY(0);transform:translateY(0);transition:none;-webkit-transition:none";
						self.wrap.removeChild(self.hidedom);
						self.wrap.appendChild(self.hidedom);
					}, false);
				}
			};
			window.Slide = Slide;
		}(window);
		var wrap = document.querySelector(wrapSelector);
		var slide = new Slide({
			"wrap": wrap,
			"speed": 4000
		});
	}
	var computedData = filterData(headlineData);
	var containerElement = document.querySelector(container);
	var items = [];
	if (computedData.data) {
		items = filterDate(computedData.data);
	}
	if (items.length && containerElement) {
		var iconTemplate = '\n\t\t    <img class="theme1212_i_icon" style="width: 90px" src="' + computedData.image + '">\n\t\t    ';
		var itemsTemplate = '';
		console.log(computedData);
		items.forEach(function (data) {
			var itemTemplate = '\n\t\t      <li class="theme1212_i_item">\n\t\t      \t<a href="' + (data.url ? data.url : '#') + '">\n\t\t\t        <p class="theme1212_i_title">\n\t\t\t          </p><div class="mod_sign_tip"><b>' + data.label + '</b></div>' + data.title + '\n\t\t\t        <p class="theme1212_i_des">' + data.description + '</p>\n\t\t\t    </a>\n\t\t      </li>\n\t\t      ';
			itemsTemplate += itemTemplate;
		});
		var itemsElement = '\n\t\t    <ul class="theme1212_i_list" style="transform: translate3d(0,0px,0);">\n\t\t      ' + itemsTemplate + '\n\t\t    </ul>';
		var template = '\n\t\t    <div class="theme1212_i">\n\t\t      ' + iconTemplate + '\n\t\t      ' + itemsElement + '\n\t\t    </div>';
		containerElement.innerHTML = template;
		if (items.length > 1) {
			initSlider('.theme1212_i_list');
		}
		// const numbers = items.length
		// let index = 0
		// setInterval(function () {
		//   index = index + 1 >= numbers ? 0 : index + 1
		//   ulElement.style.transform = `translate3d(0,-${50 * index}px,0)`
		// }, 4000)
	}
}

function renderNewerAd(container) {
	var computedData = filterData(filterDate(newUserActiveData));
	var elementContainer = document.querySelector(container);
	console.log('新人入口', container, computedData);
	window.newUserActiveEntry = function (json) {
		if (json.haveorder && json.haveorder.every(function (item) {
			return item.flag == 0;
		})) {
			showElement();
		}
	};
	window.getCouponCB = function (json) {
		ui.info({
			msg: json.code == 999 ? '领券成功' : json.message
		});
	};
	window.blindUserEntry = function (json) {
		var errcode = json.errcode,
		    state = json.state,
		    url = json.url;

		if (errcode === 1000) {
			login.login();
		} else if (state === 1 || state === 2 || state === 3 && json.defaultFlag == '1' || state === 4) {
			var tempWord = ['完善', '绑定', '切换', '绑定'];
			var msg = '\u60A8\u5F53\u524D\u767B\u5F55\u7684\u5E10\u53F7\u4FE1\u606F\u4E0D\u5B8C\u5584\uFF0C\u8BF7\u5148' + tempWord[state - 1] + '\u5E10\u53F7\u5E76\u5B8C\u6210\u5B9E\u540D\u8BA4\u8BC1\u3002';
			ui.alert({
				msg: msg,
				onConfirm: function onConfirm() {
					window.location.href = url; //进入绑定流程
				}
			});
		} else {
			//是京东会员的操作
			getCoupon();
		}
	};

	function getCoupon() {
		if (computedData.sign) {
			var myDraw = draw.init();
			myDraw.setDraw({}, computedData.levelid, computedData.sign);
		} else if (computedData.dongurl) {
			loadJs.loadScript({
				url: computedData.dongurl + '&callback=getCouponCB'
			});
		}
	}

	function showElement() {
		if (computedData.url && computedData.image) {
			var template = '\n\t\t\t\t<a href="' + computedData.url + '" class="theme1212_imagelink">\n\t\t\t      <img src="' + computedData.image + '">\n\t\t\t    </a>\n\t\t\t\t';
			elementContainer.innerHTML = template;
		} else if (computedData.image && (computedData.dongurl || computedData.sign)) {
			var element = document.createElement('a');
			element.className = 'theme1212_imagelink';
			element.innerHTML = '<img src="' + computedData.image + '">';
			elementContainer.appendChild(element);
			element.addEventListener('click', function () {
				if (computedData.isBinding == '1') {
					loadJs.loadScript({
						url: 'http://wq.jd.com/pinbind/QueryPinStatus?callback=blindUserEntry&source=2&rurl=' + encodeURIComponent(window.location.href),
						charset: "utf-8"
					});
				} else {
					getCoupon();
				}
			});
		}
	}
	if (computedData && elementContainer) {
		switch (computedData.range) {
			case '1':
				// 全站可见
				showElement();
				break;
			case '2':
				// 新用户可见
				console.log('新用户可见');
				checknewuser.isNewUser(function (json) {
					console.log('checknewuser', json);
					if (json.newuserflag == 1) {
						showElement();
					}
				});
				break;
			case '3':
				// 类目新用户可见
				var url = '//wq.jd.com/mcoss/checknewusr/HaveOrderInCategory?callback=newUserActiveEntry&mscence=1&category=' + computedData.rangeid;
				loadJs.loadScript({
					url: url,
					charset: "utf-8"
				});
		}
	}
}


})