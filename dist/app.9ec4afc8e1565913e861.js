webpackJsonp([0],[
/* 0 */,
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_;
    var ck = __webpack_require__(7);
    /*cgi302报告*/
    var callbackNameCount = {},
        letterMap = ['Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    function transToLetter(num) {
        //某些接口回调函数不能有数字，真是坑爹
        var arr = (num + '').split(''),
            v = [];
        for (var i = 0; i < arr.length; i++) {
            v.push(letterMap[arr[i]]);
        }
        return v.join('');
    }
    function callbackNameUnique(str) {
        if (!callbackNameCount[str]) {
            callbackNameCount[str] = 1;
        } else {
            callbackNameCount[str] += 1;
        }
        return str + transToLetter(callbackNameCount[str]);
    }
    function ignoreUrl(url) {
        //文案系统特殊，不作此监测，滤掉
        //wqs.jd.com下的静态容灾文件滤掉
        //卖块接口做容灾期望回调名参数不要频繁变化，也过滤掉
        return url.indexOf('wq.360buyimg.com') > -1 || url.indexOf('wqs.jd.com') > -1 || url.indexOf("wq.jd.com/mcoss/mmart/show") > -1 || url.indexOf("wq.jd.com/mcoss/mmart/mshow") > -1 || url.indexOf("wq.jd.com/mcoss/spematerial/spematerialshow") > -1 || url.indexOf("wq.jd.com/mcoss/keyword/keywordsearch") > -1 || url.indexOf("wq.jd.com/mcoss/focusbi/show") > -1 || url.indexOf("wq.jd.com/mcoss/brandspecial/show") > -1 || url.indexOf("btshow.jd.com/queryBtPlanInfo.do") > -1;
    }
    /*cgi302报告*/
    function sendJs(url, opt) {
        var option = {
            onLoad: null, //成功时回调函数
            onError: null, //加载错误时回调函数
            onTimeout: null, //超时时回调函数
            timeout: 8000, //超时时间
            isToken: true, //是否需要token，默认需要
            keepProtocol: false, //是否需要保留协议前缀，默认不需要
            charset: "utf-8", //默认字符集
            setReportUrl: "" //设置上报url，应该定义为一个function，返回值就是接口出时候的上报url，默认取当前url，并且通过window.CGI302ReportKeepUrl控制当前页是否需要去除接口中的参数
        };
        var timer;
        var clear = function () {
            if (!el) {
                return;
            }
            timer && clearTimeout(timer);
            el.onload = el.onreadystatechange = el.onerror = null;
            el.parentNode && el.parentNode.removeChild(el);
            el = null;
        };
        if (arguments.length == 1) {
            if (typeof arguments[0] == "object") {
                //只有一个参数，且参数为json对象的情况
                opt = arguments[0];
                url = opt.url;
            } else {
                //只有一个参数，且参数字符串(url地址)的情况
                opt = {};
            }
        }
        /*增加键值对data参数支持*/
        if (typeof opt.data == 'object') {
            var param = [];
            for (var k in opt.data) {
                param.push(k + '=' + opt.data[k]);
            }
            if (param.length > 0) {
                param = param.join('&');
                url += (url.indexOf('?') > 0 ? '&' : '?') + param;
            }
        }
        /*增加键值对data参数支持*/
        for (var i in opt) {
            if (opt.hasOwnProperty(i)) {
                option[i] = opt[i];
            }
        }
        var el = document.createElement("script");
        el.charset = option.charset || "utf-8";
        var needCheck = false; //是否需要上报接口调用异常
        var cgiLoadOK = false; //接口是否加载完成
        var reportUrl = ""; //接口上报的url

        if (opt.setReportUrl && typeof opt.setReportUrl == "function") {
            //自定义上报url的钩子函数，这个钩子函数需要返回一个字符串，就是当前的上报url
            reportUrl = opt.setReportUrl(); //执行钩子函数，返回上报url
            !reportUrl && (reportUrl = url); //兼容钩子函数返回异常的情况
        } else {
            //window.CGI302ReportKeepUrl控制页面的所有请求是需要上报完整的url，还是说仅仅路径部分,不设置的情况下仅仅上报路径部分
            reportUrl = window.CGI302ReportKeepUrl ? url : url.replace(/\?.*/, '');
        }
        el.onload = el.onreadystatechange = function () {
            if (/loaded|complete/i.test(this.readyState) || navigator.userAgent.toLowerCase().indexOf("msie") == -1) {
                option.onLoad && option.onLoad(); //加载成功之后的回调
                if (needCheck && !cgiLoadOK) {
                    //接口302到error也会onload触发，但是cgiLoadOK仍为false
                    if (window.JD) {
                        JD.report.umpBiz({ bizid: 24, operation: 3, result: "1", source: 0, message: reportUrl });
                    }
                    window.onerror('', '', '', '', { stack: 'servererror:' + reportUrl });
                    console.log('loadJs Failed:' + url);
                }
                clear();
            }
        };
        el.onerror = function () {
            option.onError && option.onError(); //加载错误时的回调
            clear();
        };
        var targetUrl = option.isToken ? addToken(url, "ls") : url;
        /*cgi302报告*/
        if (!ignoreUrl(targetUrl)) {
            var originFunctionName;
            var newFunctionName;
            var originFunction;
            var newUrl = targetUrl.replace(/callback=([^&]+)/, function (a, b) {
                originFunctionName = b;
                newFunctionName = callbackNameUnique(originFunctionName);
                return 'callback=' + newFunctionName;
            });
            if (originFunctionName && window[originFunctionName]) {
                needCheck = true;
                targetUrl = newUrl;
                originFunction = window[originFunctionName];
                window[newFunctionName] = function (d) {
                    //cgi正确完成，不是302到error.html,会先跑完callback，再出发script onLoad,
                    //如果在onload事件里cgiLoadOK还是false，则说明是接口返回不对,对于那些不支持callback参数的接口，这里就管不到了
                    cgiLoadOK = true;
                    originFunction(d);
                };
            }
        }
        //通过通用代理接口中转请求，需要配置白名单
        targetUrl = huidu(targetUrl);
        el.src = option.keepProtocol ? targetUrl : targetUrl.replace(/^http(s?):/, "");
        document.getElementsByTagName('head')[0].appendChild(el);
        if (typeof option.onTimeout == "function") {
            timer = setTimeout(function () {
                option.onTimeout();
            }, option.timeout);
        }
        console.log('loadJs request:' + el.src);
    };
    function huidu(url) {
        var posturl = url;
        if (window.huidu_cgi && window.huidu_cgi.length > 0) {
            var filtercgi = window.huidu_cgi.filter(function (el) {
                return window.location.href.indexOf(el.pageUrl) >= 0 && window.location.href.indexOf(el.pageUrl) < 10;
            });
            if (filtercgi.length > 0 && (filtercgi[0].isAll == '1' || filtercgi[0].cgiList.filter(function (el) {
                return url.indexOf(el.cgi) >= 0 && url.indexOf(el.cgi) < 10;
            }).length > 0)) {
                var uin = ck.get("wq_uin") || ck.get('wg_uin'),
                    tmp = (uin || '0').substr(-3);

                if (parseInt(tmp) < parseInt(filtercgi[0].ratio) || filtercgi[0].whitelist.split(';').indexOf(uin) >= 0) {
                    posturl = '//wq.jd.com/httpsproxy/showinfo?url=' + encodeURIComponent(location.protocol + url.replace(/^http(s?):/, ""));
                    posturl = addToken(posturl, "ls");
                }
            }
        }
        return posturl;
    }
    function addToken(url, type) {
        //type标识请求的方式,ls表loadscript，j132标识jquery，j126标识base，lk标识普通链接,fr标识form表单,ow打开新窗口
        var token = getToken();
        //只支持http和https协议，当url中无协议头的时候，应该检查当前页面的协议头
        if (url == "" || (url.indexOf("://") < 0 ? location.href : url).indexOf("http") != 0) {
            return url;
        }
        if (url.indexOf("#") != -1) {
            var f1 = url.match(/\?.+\#/);
            if (f1) {
                var t = f1[0].split("#"),
                    newPara = [t[0], "&g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
                return url.replace(f1[0], newPara);
            } else {
                var t = url.split("#");
                return [t[0], "?g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
            }
        }
        //无论如何都把g_ty带上，用户服务器端判断请求的类型
        return token == "" ? url + (url.indexOf("?") != -1 ? "&" : "?") + "g_ty=" + type : url + (url.indexOf("?") != -1 ? "&" : "?") + "g_tk=" + token + "&g_ty=" + type;
    };

    function getToken() {
        var skey = ck.get("wq_skey"),
            token = skey == null ? "" : time33(skey);
        return token;
    };

    function time33(str) {
        //哈希time33算法
        for (var i = 0, len = str.length, hash = 5381; i < len; ++i) {
            hash += (hash << 5) + str.charAt(i).charCodeAt();
        }
        return hash & 0x7fffffff;
    }

    /**
        延时执行sendJs，延时发出请求，确保部分callback函数定义在请求后面的情况，也能在逻辑中捕捉到calback名字
    */
    exports.loadScript = function (url, opt) {
        var args = [].slice.call(arguments);
        setTimeout(function () {
            sendJs.apply(null, args);
        }, 0);
    };
    exports.addToken = addToken;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
  var _cacheThisModule_;
  /* Zepto 1.2.0 - zepto event ajax form ie detect assets data deferred callbacks selector touch gesture stack ios3 - zeptojs.com/license */

  var Zepto = function () {
    var undefined,
        key,
        $,
        classList,
        emptyArray = [],
        concat = emptyArray.concat,
        filter = emptyArray.filter,
        slice = emptyArray.slice,
        document = window.document,
        elementDisplay = {},
        classCache = {},
        cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1 },
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,
        capitalRE = /([A-Z])/g,


    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
        readyRE = /complete|loaded|interactive/,
        simpleSelectorRE = /^[\w-]*$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize,
        uniq,
        tempParent = document.createElement('div'),
        propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
        isArray = Array.isArray || function (object) {
      return object instanceof Array;
    };

    zepto.matches = function (element, selector) {
      if (!selector || !element || element.nodeType !== 1) return false;
      var matchesSelector = element.matches || element.webkitMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector || element.matchesSelector;
      if (matchesSelector) return matchesSelector.call(element, selector);
      // fall back to performing a selector:
      var match,
          parent = element.parentNode,
          temp = !parent;
      if (temp) (parent = tempParent).appendChild(element);
      match = ~zepto.qsa(parent, selector).indexOf(element);
      temp && tempParent.removeChild(element);
      return match;
    };

    function type(obj) {
      return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
    }

    function isFunction(value) {
      return type(value) == "function";
    }
    function isWindow(obj) {
      return obj != null && obj == obj.window;
    }
    function isDocument(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    }
    function isObject(obj) {
      return type(obj) == "object";
    }
    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function likeArray(obj) {
      var length = !!obj && 'length' in obj && obj.length,
          type = $.type(obj);

      return 'function' != type && !isWindow(obj) && ('array' == type || length === 0 || typeof length == 'number' && length > 0 && length - 1 in obj);
    }

    function compact(array) {
      return filter.call(array, function (item) {
        return item != null;
      });
    }
    function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array;
    }
    camelize = function (str) {
      return str.replace(/-+(.)?/g, function (match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    };
    function dasherize(str) {
      return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/_/g, '-').toLowerCase();
    }
    uniq = function (array) {
      return filter.call(array, function (item, idx) {
        return array.indexOf(item) == idx;
      });
    };

    function classRE(name) {
      return name in classCache ? classCache[name] : classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)');
    }

    function maybeAddPx(name, value) {
      return typeof value == "number" && !cssNumber[dasherize(name)] ? value + "px" : value;
    }

    function defaultDisplay(nodeName) {
      var element, display;
      if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName);
        document.body.appendChild(element);
        display = getComputedStyle(element, '').getPropertyValue("display");
        element.parentNode.removeChild(element);
        display == "none" && (display = "block");
        elementDisplay[nodeName] = display;
      }
      return elementDisplay[nodeName];
    }

    function children(element) {
      return 'children' in element ? slice.call(element.children) : $.map(element.childNodes, function (node) {
        if (node.nodeType == 1) return node;
      });
    }

    function Z(dom, selector) {
      var i,
          len = dom ? dom.length : 0;
      for (i = 0; i < len; i++) this[i] = dom[i];
      this.length = len;
      this.selector = selector || '';
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overridden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function (html, name, properties) {
      var dom, nodes, container;

      // A special case optimization for a single tag
      if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1));

      if (!dom) {
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>");
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1;
        if (!(name in containers)) name = '*';

        container = containers[name];
        container.innerHTML = '' + html;
        dom = $.each(slice.call(container.childNodes), function () {
          container.removeChild(this);
        });
      }

      if (isPlainObject(properties)) {
        nodes = $(dom);
        $.each(properties, function (key, value) {
          if (methodAttributes.indexOf(key) > -1) nodes[key](value);else nodes.attr(key, value);
        });
      }

      return dom;
    };

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. This method can be overridden in plugins.
    zepto.Z = function (dom, selector) {
      return new Z(dom, selector);
    };

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overridden in plugins.
    zepto.isZ = function (object) {
      return object instanceof zepto.Z;
    };

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overridden in plugins.
    zepto.init = function (selector, context) {
      var dom;
      // If nothing given, return an empty Zepto collection
      if (!selector) return zepto.Z();
      // Optimize for string selectors
      else if (typeof selector == 'string') {
          selector = selector.trim();
          // If it's a html fragment, create nodes from it
          // Note: In both Chrome 21 and Firefox 15, DOM error 12
          // is thrown if the fragment doesn't begin with <
          if (selector[0] == '<' && fragmentRE.test(selector)) dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
          // If there's a context, create a collection on that context first, and select
          // nodes from there
          else if (context !== undefined) return $(context).find(selector);
            // If it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector);
        }
        // If a function is given, call it when the DOM is ready
        else if (isFunction(selector)) return $(document).ready(selector);
          // If a Zepto collection is given, just return it
          else if (zepto.isZ(selector)) return selector;else {
              // normalize array if an array of nodes is given
              if (isArray(selector)) dom = compact(selector);
              // Wrap DOM nodes.
              else if (isObject(selector)) dom = [selector], selector = null;
                // If it's a html fragment, create nodes from it
                else if (fragmentRE.test(selector)) dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
                  // If there's a context, create a collection on that context first, and select
                  // nodes from there
                  else if (context !== undefined) return $(context).find(selector);
                    // And last but no least, if it's a CSS selector, use it to select nodes.
                    else dom = zepto.qsa(document, selector);
            }
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector);
    };

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function (selector, context) {
      return zepto.init(selector, context);
    };

    function extend(target, source, deep) {
      for (key in source) if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {};
        if (isArray(source[key]) && !isArray(target[key])) target[key] = [];
        extend(target[key], source[key], deep);
      } else if (source[key] !== undefined) target[key] = source[key];
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function (target) {
      var deep,
          args = slice.call(arguments, 1);
      if (typeof target == 'boolean') {
        deep = target;
        target = args.shift();
      }
      args.forEach(function (arg) {
        extend(target, arg, deep);
      });
      return target;
    };

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overridden in plugins.
    zepto.qsa = function (element, selector) {
      var found,
          maybeID = selector[0] == '#',
          maybeClass = !maybeID && selector[0] == '.',
          nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
          // Ensure that a 1 char tag name still gets checked
      isSimple = simpleSelectorRE.test(nameOnly);
      return element.getElementById && isSimple && maybeID ? // Safari DocumentFragment doesn't have getElementById
      (found = element.getElementById(nameOnly)) ? [found] : [] : element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11 ? [] : slice.call(isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
      maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
      element.getElementsByTagName(selector) : // Or a tag
      element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      );
    };

    function filtered(nodes, selector) {
      return selector == null ? $(nodes) : $(nodes).filter(selector);
    }

    $.contains = document.documentElement.contains ? function (parent, node) {
      return parent !== node && parent.contains(node);
    } : function (parent, node) {
      while (node && (node = node.parentNode)) if (node === parent) return true;
      return false;
    };

    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg;
    }

    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value) {
      var klass = node.className || '',
          svg = klass && klass.baseVal !== undefined;

      if (value === undefined) return svg ? klass.baseVal : klass;
      svg ? klass.baseVal = value : node.className = value;
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
      try {
        return value ? value == "true" || (value == "false" ? false : value == "null" ? null : +value + "" == value ? +value : /^[\[\{]/.test(value) ? $.parseJSON(value) : value) : value;
      } catch (e) {
        return value;
      }
    }

    $.type = type;
    $.isFunction = isFunction;
    $.isWindow = isWindow;
    $.isArray = isArray;
    $.isPlainObject = isPlainObject;

    $.isEmptyObject = function (obj) {
      var name;
      for (name in obj) return false;
      return true;
    };

    $.isNumeric = function (val) {
      var num = Number(val),
          type = typeof val;
      return val != null && type != 'boolean' && (type != 'string' || val.length) && !isNaN(num) && isFinite(num) || false;
    };

    $.inArray = function (elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i);
    };

    $.camelCase = camelize;
    $.trim = function (str) {
      return str == null ? "" : String.prototype.trim.call(str);
    };

    // plugin compatibility
    $.uuid = 0;
    $.support = {};
    $.expr = {};
    $.noop = function () {};

    $.map = function (elements, callback) {
      var value,
          values = [],
          i,
          key;
      if (likeArray(elements)) for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i);
        if (value != null) values.push(value);
      } else for (key in elements) {
        value = callback(elements[key], key);
        if (value != null) values.push(value);
      }
      return flatten(values);
    };

    $.each = function (elements, callback) {
      var i, key;
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) if (callback.call(elements[i], i, elements[i]) === false) return elements;
      } else {
        for (key in elements) if (callback.call(elements[key], key, elements[key]) === false) return elements;
      }

      return elements;
    };

    $.grep = function (elements, callback) {
      return filter.call(elements, callback);
    };

    if (window.JSON) $.parseJSON = JSON.parse;

    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
      class2type["[object " + name + "]"] = name.toLowerCase();
    });

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
      constructor: zepto.Z,
      length: 0,

      // Because a collection acts like an array
      // copy over these useful array functions.
      forEach: emptyArray.forEach,
      reduce: emptyArray.reduce,
      push: emptyArray.push,
      sort: emptyArray.sort,
      splice: emptyArray.splice,
      indexOf: emptyArray.indexOf,
      concat: function () {
        var i,
            value,
            args = [];
        for (i = 0; i < arguments.length; i++) {
          value = arguments[i];
          args[i] = zepto.isZ(value) ? value.toArray() : value;
        }
        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args);
      },

      // `map` and `slice` in the jQuery API work differently
      // from their array counterparts
      map: function (fn) {
        return $($.map(this, function (el, i) {
          return fn.call(el, i, el);
        }));
      },
      slice: function () {
        return $(slice.apply(this, arguments));
      },

      ready: function (callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body element
        if (readyRE.test(document.readyState) && document.body) callback($);else document.addEventListener('DOMContentLoaded', function () {
          callback($);
        }, false);
        return this;
      },
      get: function (idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
      },
      toArray: function () {
        return this.get();
      },
      size: function () {
        return this.length;
      },
      remove: function () {
        return this.each(function () {
          if (this.parentNode != null) this.parentNode.removeChild(this);
        });
      },
      each: function (callback) {
        emptyArray.every.call(this, function (el, idx) {
          return callback.call(el, idx, el) !== false;
        });
        return this;
      },
      filter: function (selector) {
        if (isFunction(selector)) return this.not(this.not(selector));
        return $(filter.call(this, function (element) {
          return zepto.matches(element, selector);
        }));
      },
      add: function (selector, context) {
        return $(uniq(this.concat($(selector, context))));
      },
      is: function (selector) {
        return this.length > 0 && zepto.matches(this[0], selector);
      },
      not: function (selector) {
        var nodes = [];
        if (isFunction(selector) && selector.call !== undefined) this.each(function (idx) {
          if (!selector.call(this, idx)) nodes.push(this);
        });else {
          var excludes = typeof selector == 'string' ? this.filter(selector) : likeArray(selector) && isFunction(selector.item) ? slice.call(selector) : $(selector);
          this.forEach(function (el) {
            if (excludes.indexOf(el) < 0) nodes.push(el);
          });
        }
        return $(nodes);
      },
      has: function (selector) {
        return this.filter(function () {
          return isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size();
        });
      },
      eq: function (idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
      },
      first: function () {
        var el = this[0];
        return el && !isObject(el) ? el : $(el);
      },
      last: function () {
        var el = this[this.length - 1];
        return el && !isObject(el) ? el : $(el);
      },
      find: function (selector) {
        var result,
            $this = this;
        if (!selector) result = $();else if (typeof selector == 'object') result = $(selector).filter(function () {
          var node = this;
          return emptyArray.some.call($this, function (parent) {
            return $.contains(parent, node);
          });
        });else if (this.length == 1) result = $(zepto.qsa(this[0], selector));else result = this.map(function () {
          return zepto.qsa(this, selector);
        });
        return result;
      },
      closest: function (selector, context) {
        var nodes = [],
            collection = typeof selector == 'object' && $(selector);
        this.each(function (_, node) {
          while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector))) node = node !== context && !isDocument(node) && node.parentNode;
          if (node && nodes.indexOf(node) < 0) nodes.push(node);
        });
        return $(nodes);
      },
      parents: function (selector) {
        var ancestors = [],
            nodes = this;
        while (nodes.length > 0) nodes = $.map(nodes, function (node) {
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node;
          }
        });
        return filtered(ancestors, selector);
      },
      parent: function (selector) {
        return filtered(uniq(this.pluck('parentNode')), selector);
      },
      children: function (selector) {
        return filtered(this.map(function () {
          return children(this);
        }), selector);
      },
      contents: function () {
        return this.map(function () {
          return this.contentDocument || slice.call(this.childNodes);
        });
      },
      siblings: function (selector) {
        return filtered(this.map(function (i, el) {
          return filter.call(children(el.parentNode), function (child) {
            return child !== el;
          });
        }), selector);
      },
      empty: function () {
        return this.each(function () {
          this.innerHTML = '';
        });
      },
      // `pluck` is borrowed from Prototype.js
      pluck: function (property) {
        return $.map(this, function (el) {
          return el[property];
        });
      },
      show: function () {
        return this.each(function () {
          this.style.display == "none" && (this.style.display = '');
          if (getComputedStyle(this, '').getPropertyValue("display") == "none") this.style.display = defaultDisplay(this.nodeName);
        });
      },
      replaceWith: function (newContent) {
        return this.before(newContent).remove();
      },
      wrap: function (structure) {
        var func = isFunction(structure);
        if (this[0] && !func) var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1;

        return this.each(function (index) {
          $(this).wrapAll(func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom);
        });
      },
      wrapAll: function (structure) {
        if (this[0]) {
          $(this[0]).before(structure = $(structure));
          var children;
          // drill down to the inmost element
          while ((children = structure.children()).length) structure = children.first();
          $(structure).append(this);
        }
        return this;
      },
      wrapInner: function (structure) {
        var func = isFunction(structure);
        return this.each(function (index) {
          var self = $(this),
              contents = self.contents(),
              dom = func ? structure.call(this, index) : structure;
          contents.length ? contents.wrapAll(dom) : self.append(dom);
        });
      },
      unwrap: function () {
        this.parent().each(function () {
          $(this).replaceWith($(this).children());
        });
        return this;
      },
      clone: function () {
        return this.map(function () {
          return this.cloneNode(true);
        });
      },
      hide: function () {
        return this.css("display", "none");
      },
      toggle: function (setting) {
        return this.each(function () {
          var el = $(this);(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide();
        });
      },
      prev: function (selector) {
        return $(this.pluck('previousElementSibling')).filter(selector || '*');
      },
      next: function (selector) {
        return $(this.pluck('nextElementSibling')).filter(selector || '*');
      },
      html: function (html) {
        return 0 in arguments ? this.each(function (idx) {
          var originHtml = this.innerHTML;
          $(this).empty().append(funcArg(this, html, idx, originHtml));
        }) : 0 in this ? this[0].innerHTML : null;
      },
      text: function (text) {
        return 0 in arguments ? this.each(function (idx) {
          var newText = funcArg(this, text, idx, this.textContent);
          this.textContent = newText == null ? '' : '' + newText;
        }) : 0 in this ? this.pluck('textContent').join("") : null;
      },
      attr: function (name, value) {
        var result;
        return typeof name == 'string' && !(1 in arguments) ? 0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined : this.each(function (idx) {
          if (this.nodeType !== 1) return;
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key]);else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
        });
      },
      removeAttr: function (name) {
        return this.each(function () {
          this.nodeType === 1 && name.split(' ').forEach(function (attribute) {
            setAttribute(this, attribute);
          }, this);
        });
      },
      prop: function (name, value) {
        name = propMap[name] || name;
        return 1 in arguments ? this.each(function (idx) {
          this[name] = funcArg(this, value, idx, this[name]);
        }) : this[0] && this[0][name];
      },
      removeProp: function (name) {
        name = propMap[name] || name;
        return this.each(function () {
          delete this[name];
        });
      },
      data: function (name, value) {
        var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();

        var data = 1 in arguments ? this.attr(attrName, value) : this.attr(attrName);

        return data !== null ? deserializeValue(data) : undefined;
      },
      val: function (value) {
        if (0 in arguments) {
          if (value == null) value = "";
          return this.each(function (idx) {
            this.value = funcArg(this, value, idx, this.value);
          });
        } else {
          return this[0] && (this[0].multiple ? $(this[0]).find('option').filter(function () {
            return this.selected;
          }).pluck('value') : this[0].value);
        }
      },
      offset: function (coordinates) {
        if (coordinates) return this.each(function (index) {
          var $this = $(this),
              coords = funcArg(this, coordinates, index, $this.offset()),
              parentOffset = $this.offsetParent().offset(),
              props = {
            top: coords.top - parentOffset.top,
            left: coords.left - parentOffset.left
          };

          if ($this.css('position') == 'static') props['position'] = 'relative';
          $this.css(props);
        });
        if (!this.length) return null;
        if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0])) return { top: 0, left: 0 };
        var obj = this[0].getBoundingClientRect();
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        };
      },
      css: function (property, value) {
        if (arguments.length < 2) {
          var element = this[0];
          if (typeof property == 'string') {
            if (!element) return;
            return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property);
          } else if (isArray(property)) {
            if (!element) return;
            var props = {};
            var computedStyle = getComputedStyle(element, '');
            $.each(property, function (_, prop) {
              props[prop] = element.style[camelize(prop)] || computedStyle.getPropertyValue(prop);
            });
            return props;
          }
        }

        var css = '';
        if (type(property) == 'string') {
          if (!value && value !== 0) this.each(function () {
            this.style.removeProperty(dasherize(property));
          });else css = dasherize(property) + ":" + maybeAddPx(property, value);
        } else {
          for (key in property) if (!property[key] && property[key] !== 0) this.each(function () {
            this.style.removeProperty(dasherize(key));
          });else css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
        }

        return this.each(function () {
          this.style.cssText += ';' + css;
        });
      },
      index: function (element) {
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
      },
      hasClass: function (name) {
        if (!name) return false;
        return emptyArray.some.call(this, function (el) {
          return this.test(className(el));
        }, classRE(name));
      },
      addClass: function (name) {
        if (!name) return this;
        return this.each(function (idx) {
          if (!('className' in this)) return;
          classList = [];
          var cls = className(this),
              newName = funcArg(this, name, idx, cls);
          newName.split(/\s+/g).forEach(function (klass) {
            if (!$(this).hasClass(klass)) classList.push(klass);
          }, this);
          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "));
        });
      },
      removeClass: function (name) {
        return this.each(function (idx) {
          if (!('className' in this)) return;
          if (name === undefined) return className(this, '');
          classList = className(this);
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
            classList = classList.replace(classRE(klass), " ");
          });
          className(this, classList.trim());
        });
      },
      toggleClass: function (name, when) {
        if (!name) return this;
        return this.each(function (idx) {
          var $this = $(this),
              names = funcArg(this, name, idx, className(this));
          names.split(/\s+/g).forEach(function (klass) {
            (when === undefined ? !$this.hasClass(klass) : when) ? $this.addClass(klass) : $this.removeClass(klass);
          });
        });
      },
      scrollTop: function (value) {
        if (!this.length) return;
        var hasScrollTop = 'scrollTop' in this[0];
        if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
        return this.each(hasScrollTop ? function () {
          this.scrollTop = value;
        } : function () {
          this.scrollTo(this.scrollX, value);
        });
      },
      scrollLeft: function (value) {
        if (!this.length) return;
        var hasScrollLeft = 'scrollLeft' in this[0];
        if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset;
        return this.each(hasScrollLeft ? function () {
          this.scrollLeft = value;
        } : function () {
          this.scrollTo(value, this.scrollY);
        });
      },
      position: function () {
        if (!this.length) return;

        var elem = this[0],

        // Get *real* offsetParent
        offsetParent = this.offsetParent(),

        // Get correct offsets
        offset = this.offset(),
            parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

        // Subtract element margins
        // note: when an element has margin: auto the offsetLeft and marginLeft
        // are the same in Safari causing offset.left to incorrectly be 0
        offset.top -= parseFloat($(elem).css('margin-top')) || 0;
        offset.left -= parseFloat($(elem).css('margin-left')) || 0;

        // Add offsetParent borders
        parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0;
        parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0;

        // Subtract the two offsets
        return {
          top: offset.top - parentOffset.top,
          left: offset.left - parentOffset.left
        };
      },
      offsetParent: function () {
        return this.map(function () {
          var parent = this.offsetParent || document.body;
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static") parent = parent.offsetParent;
          return parent;
        });
      }
    };

    // for now
    $.fn.detach = $.fn.remove

    // Generate the `width` and `height` functions
    ;['width', 'height'].forEach(function (dimension) {
      var dimensionProperty = dimension.replace(/./, function (m) {
        return m[0].toUpperCase();
      });

      $.fn[dimension] = function (value) {
        var offset,
            el = this[0];
        if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] : isDocument(el) ? el.documentElement['scroll' + dimensionProperty] : (offset = this.offset()) && offset[dimension];else return this.each(function (idx) {
          el = $(this);
          el.css(dimension, funcArg(this, value, idx, el[dimension]()));
        });
      };
    });

    function traverseNode(node, fun) {
      fun(node);
      for (var i = 0, len = node.childNodes.length; i < len; i++) traverseNode(node.childNodes[i], fun);
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function (operator, operatorIndex) {
      var inside = operatorIndex % 2; //=> prepend, append

      $.fn[operator] = function () {
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        var argType,
            nodes = $.map(arguments, function (arg) {
          var arr = [];
          argType = type(arg);
          if (argType == "array") {
            arg.forEach(function (el) {
              if (el.nodeType !== undefined) return arr.push(el);else if ($.zepto.isZ(el)) return arr = arr.concat(el.get());
              arr = arr.concat(zepto.fragment(el));
            });
            return arr;
          }
          return argType == "object" || arg == null ? arg : zepto.fragment(arg);
        }),
            parent,
            copyByClone = this.length > 1;
        if (nodes.length < 1) return this;

        return this.each(function (_, target) {
          parent = inside ? target : target.parentNode;

          // convert all methods to a "before" operation
          target = operatorIndex == 0 ? target.nextSibling : operatorIndex == 1 ? target.firstChild : operatorIndex == 2 ? target : null;

          var parentInDocument = $.contains(document.documentElement, parent);

          nodes.forEach(function (node) {
            if (copyByClone) node = node.cloneNode(true);else if (!parent) return $(node).remove();

            parent.insertBefore(node, target);
            if (parentInDocument) traverseNode(node, function (el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' && (!el.type || el.type === 'text/javascript') && !el.src) {
                var target = el.ownerDocument ? el.ownerDocument.defaultView : window;
                target['eval'].call(target, el.innerHTML);
              }
            });
          });
        });
      };

      // after    => insertAfter
      // prepend  => prependTo
      // before   => insertBefore
      // append   => appendTo
      $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
        $(html)[operator](this);
        return this;
      };
    });

    zepto.Z.prototype = Z.prototype = $.fn;

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq;
    zepto.deserializeValue = deserializeValue;
    $.zepto = zepto;

    return $;
  }();

  window.Zepto = Zepto;
  window.$ === undefined && (window.$ = Zepto);(function ($) {
    var _zid = 1,
        undefined,
        slice = Array.prototype.slice,
        isFunction = $.isFunction,
        isString = function (obj) {
      return typeof obj == 'string';
    },
        handlers = {},
        specialEvents = {},
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' };

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

    function zid(element) {
      return element._zid || (element._zid = _zid++);
    }
    function findHandlers(element, event, fn, selector) {
      event = parse(event);
      if (event.ns) var matcher = matcherFor(event.ns);
      return (handlers[zid(element)] || []).filter(function (handler) {
        return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector);
      });
    }
    function parse(event) {
      var parts = ('' + event).split('.');
      return { e: parts[0], ns: parts.slice(1).sort().join(' ') };
    }
    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
    }

    function eventCapture(handler, captureSetting) {
      return handler.del && !focusinSupported && handler.e in focus || !!captureSetting;
    }

    function realEvent(type) {
      return hover[type] || focusinSupported && focus[type] || type;
    }

    function add(element, events, fn, data, selector, delegator, capture) {
      var id = zid(element),
          set = handlers[id] || (handlers[id] = []);
      events.split(/\s/).forEach(function (event) {
        if (event == 'ready') return $(document).ready(fn);
        var handler = parse(event);
        handler.fn = fn;
        handler.sel = selector;
        // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function (e) {
          var related = e.relatedTarget;
          if (!related || related !== this && !$.contains(this, related)) return handler.fn.apply(this, arguments);
        };
        handler.del = delegator;
        var callback = delegator || fn;
        handler.proxy = function (e) {
          e = compatible(e);
          if (e.isImmediatePropagationStopped()) return;
          e.data = data;
          var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
          if (result === false) {
            e.preventDefault(), e.stopPropagation();
          }
          return result;
        };
        handler.i = set.length;
        set.push(handler);
        if ('addEventListener' in element) element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
      });
    }
    function remove(element, events, fn, selector, capture) {
      var id = zid(element);(events || '').split(/\s/).forEach(function (event) {
        findHandlers(element, event, fn, selector).forEach(function (handler) {
          delete handlers[id][handler.i];
          if ('removeEventListener' in element) element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
        });
      });
    }

    $.event = { add: add, remove: remove };

    $.proxy = function (fn, context) {
      var args = 2 in arguments && slice.call(arguments, 2);
      if (isFunction(fn)) {
        var proxyFn = function () {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
        };
        proxyFn._zid = zid(fn);
        return proxyFn;
      } else if (isString(context)) {
        if (args) {
          args.unshift(fn[context], fn);
          return $.proxy.apply(null, args);
        } else {
          return $.proxy(fn[context], fn);
        }
      } else {
        throw new TypeError("expected function");
      }
    };

    $.fn.bind = function (event, data, callback) {
      return this.on(event, data, callback);
    };
    $.fn.unbind = function (event, callback) {
      return this.off(event, callback);
    };
    $.fn.one = function (event, selector, data, callback) {
      return this.on(event, selector, data, callback, 1);
    };

    var returnTrue = function () {
      return true;
    },
        returnFalse = function () {
      return false;
    },
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
        eventMethods = {
      preventDefault: 'isDefaultPrevented',
      stopImmediatePropagation: 'isImmediatePropagationStopped',
      stopPropagation: 'isPropagationStopped'
    };

    function compatible(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event);

        $.each(eventMethods, function (name, predicate) {
          var sourceMethod = source[name];
          event[name] = function () {
            this[predicate] = returnTrue;
            return sourceMethod && sourceMethod.apply(source, arguments);
          };
          event[predicate] = returnFalse;
        });

        event.timeStamp || (event.timeStamp = Date.now());

        if (source.defaultPrevented !== undefined ? source.defaultPrevented : 'returnValue' in source ? source.returnValue === false : source.getPreventDefault && source.getPreventDefault()) event.isDefaultPrevented = returnTrue;
      }
      return event;
    }

    function createProxy(event) {
      var key,
          proxy = { originalEvent: event };
      for (key in event) if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key];

      return compatible(proxy, event);
    }

    $.fn.delegate = function (selector, event, callback) {
      return this.on(event, selector, callback);
    };
    $.fn.undelegate = function (selector, event, callback) {
      return this.off(event, selector, callback);
    };

    $.fn.live = function (event, callback) {
      $(document.body).delegate(this.selector, event, callback);
      return this;
    };
    $.fn.die = function (event, callback) {
      $(document.body).undelegate(this.selector, event, callback);
      return this;
    };

    $.fn.on = function (event, selector, data, callback, one) {
      var autoRemove,
          delegator,
          $this = this;
      if (event && !isString(event)) {
        $.each(event, function (type, fn) {
          $this.on(type, selector, data, fn, one);
        });
        return $this;
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false) callback = data, data = selector, selector = undefined;
      if (callback === undefined || data === false) callback = data, data = undefined;

      if (callback === false) callback = returnFalse;

      return $this.each(function (_, element) {
        if (one) autoRemove = function (e) {
          remove(element, e.type, callback);
          return callback.apply(this, arguments);
        };

        if (selector) delegator = function (e) {
          var evt,
              match = $(e.target).closest(selector, element).get(0);
          if (match && match !== element) {
            evt = $.extend(createProxy(e), { currentTarget: match, liveFired: element });
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
          }
        };

        add(element, event, callback, data, selector, delegator || autoRemove);
      });
    };
    $.fn.off = function (event, selector, callback) {
      var $this = this;
      if (event && !isString(event)) {
        $.each(event, function (type, fn) {
          $this.off(type, selector, fn);
        });
        return $this;
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false) callback = selector, selector = undefined;

      if (callback === false) callback = returnFalse;

      return $this.each(function () {
        remove(this, event, callback, selector);
      });
    };

    $.fn.trigger = function (event, args) {
      event = isString(event) || $.isPlainObject(event) ? $.Event(event) : compatible(event);
      event._args = args;
      return this.each(function () {
        // handle focus(), blur() by calling them directly
        if (event.type in focus && typeof this[event.type] == "function") this[event.type]();
        // items in the collection might not be DOM elements
        else if ('dispatchEvent' in this) this.dispatchEvent(event);else $(this).triggerHandler(event, args);
      });
    };

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function (event, args) {
      var e, result;
      this.each(function (i, element) {
        e = createProxy(isString(event) ? $.Event(event) : event);
        e._args = args;
        e.target = element;
        $.each(findHandlers(element, event.type || event), function (i, handler) {
          result = handler.proxy(e);
          if (e.isImmediatePropagationStopped()) return false;
        });
      });
      return result;
    }

    // shortcut methods for `.bind(event, fn)` for each event type
    ;('focusin focusout focus blur load resize scroll unload click dblclick ' + 'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' + 'change select keydown keypress keyup error').split(' ').forEach(function (event) {
      $.fn[event] = function (callback) {
        return 0 in arguments ? this.bind(event, callback) : this.trigger(event);
      };
    });

    $.Event = function (type, props) {
      if (!isString(type)) props = type, type = props.type;
      var event = document.createEvent(specialEvents[type] || 'Events'),
          bubbles = true;
      if (props) for (var name in props) name == 'bubbles' ? bubbles = !!props[name] : event[name] = props[name];
      event.initEvent(type, bubbles, true);
      return compatible(event);
    };
  })(Zepto);(function ($) {
    var jsonpID = +new Date(),
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a');

    originAnchor.href = window.location.href;

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
      var event = $.Event(eventName);
      $(context).trigger(event, data);
      return !event.isDefaultPrevented();
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
      if (settings.global) return triggerAndReturn(context || document, eventName, data);
    }

    // Number of active Ajax requests
    $.active = 0;

    function ajaxStart(settings) {
      if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart');
    }
    function ajaxStop(settings) {
      if (settings.global && ! --$.active) triggerGlobal(settings, null, 'ajaxStop');
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
      var context = settings.context;
      if (settings.beforeSend.call(context, xhr, settings) === false || triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) return false;

      triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    }
    function ajaxSuccess(data, xhr, settings, deferred) {
      var context = settings.context,
          status = 'success';
      settings.success.call(context, data, status, xhr);
      if (deferred) deferred.resolveWith(context, [data, status, xhr]);
      triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
      ajaxComplete(status, xhr, settings);
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
      var context = settings.context;
      settings.error.call(context, xhr, type, error);
      if (deferred) deferred.rejectWith(context, [xhr, type, error]);
      triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
      ajaxComplete(type, xhr, settings);
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
      var context = settings.context;
      settings.complete.call(context, xhr, status);
      triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
      ajaxStop(settings);
    }

    function ajaxDataFilter(data, type, settings) {
      if (settings.dataFilter == empty) return data;
      var context = settings.context;
      return settings.dataFilter.call(context, data, type);
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function (options, deferred) {
      if (!('type' in options)) return $.ajax(options);

      var _callbackName = options.jsonpCallback,
          callbackName = ($.isFunction(_callbackName) ? _callbackName() : _callbackName) || 'Zepto' + jsonpID++,
          script = document.createElement('script'),
          originalCallback = window[callbackName],
          responseData,
          abort = function (errorType) {
        $(script).triggerHandler('error', errorType || 'abort');
      },
          xhr = { abort: abort },
          abortTimeout;

      if (deferred) deferred.promise(xhr);

      $(script).on('load error', function (e, errorType) {
        clearTimeout(abortTimeout);
        $(script).off().remove();

        if (e.type == 'error' || !responseData) {
          ajaxError(null, errorType || 'error', xhr, options, deferred);
        } else {
          ajaxSuccess(responseData[0], xhr, options, deferred);
        }

        window[callbackName] = originalCallback;
        if (responseData && $.isFunction(originalCallback)) originalCallback(responseData[0]);

        originalCallback = responseData = undefined;
      });

      if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort');
        return xhr;
      }

      window[callbackName] = function () {
        responseData = arguments;
      };

      script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
      document.head.appendChild(script);

      if (options.timeout > 0) abortTimeout = setTimeout(function () {
        abort('timeout');
      }, options.timeout);

      return xhr;
    };

    $.ajaxSettings = {
      // Default type of request
      type: 'GET',
      // Callback that is executed before request
      beforeSend: empty,
      // Callback that is executed if the request succeeds
      success: empty,
      // Callback that is executed the the server drops error
      error: empty,
      // Callback that is executed on request complete (both: error and success)
      complete: empty,
      // The context for the callbacks
      context: null,
      // Whether to trigger "global" Ajax events
      global: true,
      // Transport
      xhr: function () {
        return new window.XMLHttpRequest();
      },
      // MIME types mapping
      // IIS returns Javascript as "application/x-javascript"
      accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
      },
      // Whether the request is to another domain
      crossDomain: false,
      // Default timeout
      timeout: 0,
      // Whether data should be serialized to string
      processData: true,
      // Whether the browser should be allowed to cache GET responses
      cache: true,
      //Used to handle the raw response data of XMLHttpRequest.
      //This is a pre-filtering function to sanitize the response.
      //The sanitized response should be returned
      dataFilter: empty
    };

    function mimeToDataType(mime) {
      if (mime) mime = mime.split(';', 2)[0];
      return mime && (mime == htmlType ? 'html' : mime == jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml') || 'text';
    }

    function appendQuery(url, query) {
      if (query == '') return url;
      return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
      if (options.processData && options.data && $.type(options.data) != "string") options.data = $.param(options.data, options.traditional);
      if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType)) options.url = appendQuery(options.url, options.data), options.data = undefined;
    }

    $.ajax = function (options) {
      var settings = $.extend({}, options || {}),
          deferred = $.Deferred && $.Deferred(),
          urlAnchor,
          hashIndex;
      for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key];

      ajaxStart(settings);

      if (!settings.crossDomain) {
        urlAnchor = document.createElement('a');
        urlAnchor.href = settings.url;
        // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
        urlAnchor.href = urlAnchor.href;
        settings.crossDomain = originAnchor.protocol + '//' + originAnchor.host !== urlAnchor.protocol + '//' + urlAnchor.host;
      }

      if (!settings.url) settings.url = window.location.toString();
      if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex);
      serializeData(settings);

      var dataType = settings.dataType,
          hasPlaceholder = /\?.+=\?/.test(settings.url);
      if (hasPlaceholder) dataType = 'jsonp';

      if (settings.cache === false || (!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType)) settings.url = appendQuery(settings.url, '_=' + Date.now());

      if ('jsonp' == dataType) {
        if (!hasPlaceholder) settings.url = appendQuery(settings.url, settings.jsonp ? settings.jsonp + '=?' : settings.jsonp === false ? '' : 'callback=?');
        return $.ajaxJSONP(settings, deferred);
      }

      var mime = settings.accepts[dataType],
          headers = {},
          setHeader = function (name, value) {
        headers[name.toLowerCase()] = [name, value];
      },
          protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
          xhr = settings.xhr(),
          nativeSetHeader = xhr.setRequestHeader,
          abortTimeout;

      if (deferred) deferred.promise(xhr);

      if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest');
      setHeader('Accept', mime || '*/*');
      if (mime = settings.mimeType || mime) {
        if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
        xhr.overrideMimeType && xhr.overrideMimeType(mime);
      }
      if (settings.contentType || settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET') setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');

      if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
      xhr.setRequestHeader = setHeader;

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;
          clearTimeout(abortTimeout);
          var result,
              error = false;
          if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || xhr.status == 0 && protocol == 'file:') {
            dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));

            if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob') result = xhr.response;else {
              result = xhr.responseText;

              try {
                // http://perfectionkills.com/global-eval-what-are-the-options/
                // sanitize response accordingly if data filter callback provided
                result = ajaxDataFilter(result, dataType, settings);
                if (dataType == 'script') (1, eval)(result);else if (dataType == 'xml') result = xhr.responseXML;else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result);
              } catch (e) {
                error = e;
              }

              if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred);
            }

            ajaxSuccess(result, xhr, settings, deferred);
          } else {
            ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred);
          }
        }
      };

      if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort();
        ajaxError(null, 'abort', xhr, settings, deferred);
        return xhr;
      }

      var async = 'async' in settings ? settings.async : true;
      xhr.open(settings.type, settings.url, async, settings.username, settings.password);

      if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

      for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

      if (settings.timeout > 0) abortTimeout = setTimeout(function () {
        xhr.onreadystatechange = empty;
        xhr.abort();
        ajaxError(null, 'timeout', xhr, settings, deferred);
      }, settings.timeout);

      // avoid sending empty string (#319)
      xhr.send(settings.data ? settings.data : null);
      return xhr;
    };

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
      if ($.isFunction(data)) dataType = success, success = data, data = undefined;
      if (!$.isFunction(success)) dataType = success, success = undefined;
      return {
        url: url,
        data: data,
        success: success,
        dataType: dataType
      };
    }

    $.get = function () /* url, data, success, dataType */{
      return $.ajax(parseArguments.apply(null, arguments));
    };

    $.post = function () /* url, data, success, dataType */{
      var options = parseArguments.apply(null, arguments);
      options.type = 'POST';
      return $.ajax(options);
    };

    $.getJSON = function () /* url, data, success */{
      var options = parseArguments.apply(null, arguments);
      options.dataType = 'json';
      return $.ajax(options);
    };

    $.fn.load = function (url, data, success) {
      if (!this.length) return this;
      var self = this,
          parts = url.split(/\s/),
          selector,
          options = parseArguments(url, data, success),
          callback = options.success;
      if (parts.length > 1) options.url = parts[0], selector = parts[1];
      options.success = function (response) {
        self.html(selector ? $('<div>').html(response.replace(rscript, "")).find(selector) : response);
        callback && callback.apply(self, arguments);
      };
      $.ajax(options);
      return this;
    };

    var escape = encodeURIComponent;

    function serialize(params, obj, traditional, scope) {
      var type,
          array = $.isArray(obj),
          hash = $.isPlainObject(obj);
      $.each(obj, function (key, value) {
        type = $.type(value);
        if (scope) key = traditional ? scope : scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']';
        // handle data in serializeArray() format
        if (!scope && array) params.add(value.name, value.value);
        // recurse into nested objects
        else if (type == "array" || !traditional && type == "object") serialize(params, value, traditional, key);else params.add(key, value);
      });
    }

    $.param = function (obj, traditional) {
      var params = [];
      params.add = function (key, value) {
        if ($.isFunction(value)) value = value();
        if (value == null) value = "";
        this.push(escape(key) + '=' + escape(value));
      };
      serialize(params, obj, traditional);
      return params.join('&').replace(/%20/g, '+');
    };
  })(Zepto);(function ($) {
    $.fn.serializeArray = function () {
      var name,
          type,
          result = [],
          add = function (value) {
        if (value.forEach) return value.forEach(add);
        result.push({ name: name, value: value });
      };
      if (this[0]) $.each(this[0].elements, function (_, field) {
        type = field.type, name = field.name;
        if (name && field.nodeName.toLowerCase() != 'fieldset' && !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' && (type != 'radio' && type != 'checkbox' || field.checked)) add($(field).val());
      });
      return result;
    };

    $.fn.serialize = function () {
      var result = [];
      this.serializeArray().forEach(function (elm) {
        result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value));
      });
      return result.join('&');
    };

    $.fn.submit = function (callback) {
      if (0 in arguments) this.bind('submit', callback);else if (this.length) {
        var event = $.Event('submit');
        this.eq(0).trigger(event);
        if (!event.isDefaultPrevented()) this.get(0).submit();
      }
      return this;
    };
  })(Zepto);(function () {
    // getComputedStyle shouldn't freak out when called
    // without a valid element as argument
    try {
      getComputedStyle(undefined);
    } catch (e) {
      var nativeGetComputedStyle = getComputedStyle;
      window.getComputedStyle = function (element, pseudoElement) {
        try {
          return nativeGetComputedStyle(element, pseudoElement);
        } catch (e) {
          return null;
        }
      };
    }
  })();(function ($) {
    function detect(ua, platform) {
      var os = this.os = {},
          browser = this.browser = {},
          webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
          android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
          osx = !!ua.match(/\(Macintosh\; Intel /),
          ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
          ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
          iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
          webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
          win = /Win\d{2}|Windows/.test(platform),
          wp = ua.match(/Windows Phone ([\d.]+)/),
          touchpad = webos && ua.match(/TouchPad/),
          kindle = ua.match(/Kindle\/([\d.]+)/),
          silk = ua.match(/Silk\/([\d._]+)/),
          blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
          bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
          rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
          playbook = ua.match(/PlayBook/),
          chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
          firefox = ua.match(/Firefox\/([\d.]+)/),
          firefoxos = ua.match(/\((?:Mobile|Tablet); rv:([\d.]+)\).*Firefox\/[\d.]+/),
          ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
          webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
          safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/);

      // Todo: clean this up with a better OS/browser seperation:
      // - discern (more) between multiple browsers on android
      // - decide if kindle fire in silk mode is android or not
      // - Firefox on Android doesn't specify the Android version
      // - possibly devide in os, device and browser hashes

      if (browser.webkit = !!webkit) browser.version = webkit[1];

      if (android) os.android = true, os.version = android[2];
      if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.');
      if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.');
      if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
      if (wp) os.wp = true, os.version = wp[1];
      if (webos) os.webos = true, os.version = webos[2];
      if (touchpad) os.touchpad = true;
      if (blackberry) os.blackberry = true, os.version = blackberry[2];
      if (bb10) os.bb10 = true, os.version = bb10[2];
      if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2];
      if (playbook) browser.playbook = true;
      if (kindle) os.kindle = true, os.version = kindle[1];
      if (silk) browser.silk = true, browser.version = silk[1];
      if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true;
      if (chrome) browser.chrome = true, browser.version = chrome[1];
      if (firefox) browser.firefox = true, browser.version = firefox[1];
      if (firefoxos) os.firefoxos = true, os.version = firefoxos[1];
      if (ie) browser.ie = true, browser.version = ie[1];
      if (safari && (osx || os.ios || win)) {
        browser.safari = true;
        if (!os.ios) browser.version = safari[1];
      }
      if (webview) browser.webview = true;

      os.tablet = !!(ipad || playbook || android && !ua.match(/Mobile/) || firefox && ua.match(/Tablet/) || ie && !ua.match(/Phone/) && ua.match(/Touch/));
      os.phone = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 || chrome && ua.match(/Android/) || chrome && ua.match(/CriOS\/([\d.]+)/) || firefox && ua.match(/Mobile/) || ie && ua.match(/Touch/)));
    }

    detect.call($, navigator.userAgent, navigator.platform);
    // make available to unit tests
    $.__detect = detect;
  })(Zepto);(function ($) {
    var cache = [],
        timeout;

    $.fn.remove = function () {
      return this.each(function () {
        if (this.parentNode) {
          if (this.tagName === 'IMG') {
            cache.push(this);
            this.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(function () {
              cache = [];
            }, 60000);
          }
          this.parentNode.removeChild(this);
        }
      });
    };
  })(Zepto);(function ($) {
    var data = {},
        dataAttr = $.fn.data,
        camelize = $.camelCase,
        exp = $.expando = 'Zepto' + +new Date(),
        emptyArray = [];

    // Get value from node:
    // 1. first try key as given,
    // 2. then try camelized key,
    // 3. fall back to reading "data-*" attribute.
    function getData(node, name) {
      var id = node[exp],
          store = id && data[id];
      if (name === undefined) return store || setData(node);else {
        if (store) {
          if (name in store) return store[name];
          var camelName = camelize(name);
          if (camelName in store) return store[camelName];
        }
        return dataAttr.call($(node), name);
      }
    }

    // Store value under camelized key on node
    function setData(node, name, value) {
      var id = node[exp] || (node[exp] = ++$.uuid),
          store = data[id] || (data[id] = attributeData(node));
      if (name !== undefined) store[camelize(name)] = value;
      return store;
    }

    // Read all "data-*" attributes from a node
    function attributeData(node) {
      var store = {};
      $.each(node.attributes || emptyArray, function (i, attr) {
        if (attr.name.indexOf('data-') == 0) store[camelize(attr.name.replace('data-', ''))] = $.zepto.deserializeValue(attr.value);
      });
      return store;
    }

    $.fn.data = function (name, value) {
      return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ? this.each(function (i, node) {
        $.each(name, function (key, value) {
          setData(node, key, value);
        });
      }) :
      // get value from first element
      0 in this ? getData(this[0], name) : undefined :
      // set value on all elements
      this.each(function () {
        setData(this, name, value);
      });
    };

    $.data = function (elem, name, value) {
      return $(elem).data(name, value);
    };

    $.hasData = function (elem) {
      var id = elem[exp],
          store = id && data[id];
      return store ? !$.isEmptyObject(store) : false;
    };

    $.fn.removeData = function (names) {
      if (typeof names == 'string') names = names.split(/\s+/);
      return this.each(function () {
        var id = this[exp],
            store = id && data[id];
        if (store) $.each(names || store, function (key) {
          delete store[names ? camelize(this) : key];
        });
      });
    }

    // Generate extended `remove` and `empty` functions
    ;['remove', 'empty'].forEach(function (methodName) {
      var origFn = $.fn[methodName];
      $.fn[methodName] = function () {
        var elements = this.find('*');
        if (methodName === 'remove') elements = elements.add(this);
        elements.removeData();
        return origFn.call(this);
      };
    });
  })(Zepto);(function ($) {
    var slice = Array.prototype.slice;

    function Deferred(func) {
      var tuples = [
      // action, add listener, listener list, final state
      ["resolve", "done", $.Callbacks({ once: 1, memory: 1 }), "resolved"], ["reject", "fail", $.Callbacks({ once: 1, memory: 1 }), "rejected"], ["notify", "progress", $.Callbacks({ memory: 1 })]],
          state = "pending",
          promise = {
        state: function () {
          return state;
        },
        always: function () {
          deferred.done(arguments).fail(arguments);
          return this;
        },
        then: function () /* fnDone [, fnFailed [, fnProgress]] */{
          var fns = arguments;
          return Deferred(function (defer) {
            $.each(tuples, function (i, tuple) {
              var fn = $.isFunction(fns[i]) && fns[i];
              deferred[tuple[1]](function () {
                var returned = fn && fn.apply(this, arguments);
                if (returned && $.isFunction(returned.promise)) {
                  returned.promise().done(defer.resolve).fail(defer.reject).progress(defer.notify);
                } else {
                  var context = this === promise ? defer.promise() : this,
                      values = fn ? [returned] : arguments;
                  defer[tuple[0] + "With"](context, values);
                }
              });
            });
            fns = null;
          }).promise();
        },

        promise: function (obj) {
          return obj != null ? $.extend(obj, promise) : promise;
        }
      },
          deferred = {};

      $.each(tuples, function (i, tuple) {
        var list = tuple[2],
            stateString = tuple[3];

        promise[tuple[1]] = list.add;

        if (stateString) {
          list.add(function () {
            state = stateString;
          }, tuples[i ^ 1][2].disable, tuples[2][2].lock);
        }

        deferred[tuple[0]] = function () {
          deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments);
          return this;
        };
        deferred[tuple[0] + "With"] = list.fireWith;
      });

      promise.promise(deferred);
      if (func) func.call(deferred, deferred);
      return deferred;
    }

    $.when = function (sub) {
      var resolveValues = slice.call(arguments),
          len = resolveValues.length,
          i = 0,
          remain = len !== 1 || sub && $.isFunction(sub.promise) ? len : 0,
          deferred = remain === 1 ? sub : Deferred(),
          progressValues,
          progressContexts,
          resolveContexts,
          updateFn = function (i, ctx, val) {
        return function (value) {
          ctx[i] = this;
          val[i] = arguments.length > 1 ? slice.call(arguments) : value;
          if (val === progressValues) {
            deferred.notifyWith(ctx, val);
          } else if (! --remain) {
            deferred.resolveWith(ctx, val);
          }
        };
      };

      if (len > 1) {
        progressValues = new Array(len);
        progressContexts = new Array(len);
        resolveContexts = new Array(len);
        for (; i < len; ++i) {
          if (resolveValues[i] && $.isFunction(resolveValues[i].promise)) {
            resolveValues[i].promise().done(updateFn(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFn(i, progressContexts, progressValues));
          } else {
            --remain;
          }
        }
      }
      if (!remain) deferred.resolveWith(resolveContexts, resolveValues);
      return deferred.promise();
    };

    $.Deferred = Deferred;
  })(Zepto);(function ($) {
    // Create a collection of callbacks to be fired in a sequence, with configurable behaviour
    // Option flags:
    //   - once: Callbacks fired at most one time.
    //   - memory: Remember the most recent context and arguments
    //   - stopOnFalse: Cease iterating over callback list
    //   - unique: Permit adding at most one instance of the same callback
    $.Callbacks = function (options) {
      options = $.extend({}, options);

      var memory,
          // Last fire value (for non-forgettable lists)
      fired,
          // Flag to know if list was already fired
      firing,
          // Flag to know if list is currently firing
      firingStart,
          // First callback to fire (used internally by add and fireWith)
      firingLength,
          // End of the loop when firing
      firingIndex,
          // Index of currently firing callback (modified by remove if needed)
      list = [],
          // Actual callback list
      stack = !options.once && [],
          // Stack of fire calls for repeatable lists
      fire = function (data) {
        memory = options.memory && data;
        fired = true;
        firingIndex = firingStart || 0;
        firingStart = 0;
        firingLength = list.length;
        firing = true;
        for (; list && firingIndex < firingLength; ++firingIndex) {
          if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
            memory = false;
            break;
          }
        }
        firing = false;
        if (list) {
          if (stack) stack.length && fire(stack.shift());else if (memory) list.length = 0;else Callbacks.disable();
        }
      },
          Callbacks = {
        add: function () {
          if (list) {
            var start = list.length,
                add = function (args) {
              $.each(args, function (_, arg) {
                if (typeof arg === "function") {
                  if (!options.unique || !Callbacks.has(arg)) list.push(arg);
                } else if (arg && arg.length && typeof arg !== 'string') add(arg);
              });
            };
            add(arguments);
            if (firing) firingLength = list.length;else if (memory) {
              firingStart = start;
              fire(memory);
            }
          }
          return this;
        },
        remove: function () {
          if (list) {
            $.each(arguments, function (_, arg) {
              var index;
              while ((index = $.inArray(arg, list, index)) > -1) {
                list.splice(index, 1);
                // Handle firing indexes
                if (firing) {
                  if (index <= firingLength) --firingLength;
                  if (index <= firingIndex) --firingIndex;
                }
              }
            });
          }
          return this;
        },
        has: function (fn) {
          return !!(list && (fn ? $.inArray(fn, list) > -1 : list.length));
        },
        empty: function () {
          firingLength = list.length = 0;
          return this;
        },
        disable: function () {
          list = stack = memory = undefined;
          return this;
        },
        disabled: function () {
          return !list;
        },
        lock: function () {
          stack = undefined;
          if (!memory) Callbacks.disable();
          return this;
        },
        locked: function () {
          return !stack;
        },
        fireWith: function (context, args) {
          if (list && (!fired || stack)) {
            args = args || [];
            args = [context, args.slice ? args.slice() : args];
            if (firing) stack.push(args);else fire(args);
          }
          return this;
        },
        fire: function () {
          return Callbacks.fireWith(this, arguments);
        },
        fired: function () {
          return !!fired;
        }
      };

      return Callbacks;
    };
  })(Zepto);(function ($) {
    var zepto = $.zepto,
        oldQsa = zepto.qsa,
        oldMatches = zepto.matches;

    function visible(elem) {
      elem = $(elem);
      return !!(elem.width() || elem.height()) && elem.css("display") !== "none";
    }

    // Implements a subset from:
    // http://api.jquery.com/category/selectors/jquery-selector-extensions/
    //
    // Each filter function receives the current index, all nodes in the
    // considered set, and a value if there were parentheses. The value
    // of `this` is the node currently being considered. The function returns the
    // resulting node(s), null, or undefined.
    //
    // Complex selectors are not supported:
    //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
    //   ul.inner:first > li
    var filters = $.expr[':'] = {
      visible: function () {
        if (visible(this)) return this;
      },
      hidden: function () {
        if (!visible(this)) return this;
      },
      selected: function () {
        if (this.selected) return this;
      },
      checked: function () {
        if (this.checked) return this;
      },
      parent: function () {
        return this.parentNode;
      },
      first: function (idx) {
        if (idx === 0) return this;
      },
      last: function (idx, nodes) {
        if (idx === nodes.length - 1) return this;
      },
      eq: function (idx, _, value) {
        if (idx === value) return this;
      },
      contains: function (idx, _, text) {
        if ($(this).text().indexOf(text) > -1) return this;
      },
      has: function (idx, _, sel) {
        if (zepto.qsa(this, sel).length) return this;
      }
    };

    var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
        childRe = /^\s*>/,
        classTag = 'Zepto' + +new Date();

    function process(sel, fn) {
      // quote the hash in `a[href^=#]` expression
      sel = sel.replace(/=#\]/g, '="#"]');
      var filter,
          arg,
          match = filterRe.exec(sel);
      if (match && match[2] in filters) {
        filter = filters[match[2]], arg = match[3];
        sel = match[1];
        if (arg) {
          var num = Number(arg);
          if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '');else arg = num;
        }
      }
      return fn(sel, filter, arg);
    }

    zepto.qsa = function (node, selector) {
      return process(selector, function (sel, filter, arg) {
        try {
          var taggedParent;
          if (!sel && filter) sel = '*';else if (childRe.test(sel))
            // support "> *" child queries by tagging the parent node with a
            // unique class and prepending that classname onto the selector
            taggedParent = $(node).addClass(classTag), sel = '.' + classTag + ' ' + sel;

          var nodes = oldQsa(node, sel);
        } catch (e) {
          console.error('error performing selector: %o', selector);
          throw e;
        } finally {
          if (taggedParent) taggedParent.removeClass(classTag);
        }
        return !filter ? nodes : zepto.uniq($.map(nodes, function (n, i) {
          return filter.call(n, i, nodes, arg);
        }));
      });
    };

    zepto.matches = function (node, selector) {
      return process(selector, function (sel, filter, arg) {
        return (!sel || oldMatches(node, sel)) && (!filter || filter.call(node, null, arg) === node);
      });
    };
  })(Zepto);(function ($) {
    var touch = {},
        touchTimeout,
        tapTimeout,
        swipeTimeout,
        longTapTimeout,
        longTapDelay = 750,
        gesture;

    function swipeDirection(x1, x2, y1, y2) {
      return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? x1 - x2 > 0 ? 'Left' : 'Right' : y1 - y2 > 0 ? 'Up' : 'Down';
    }

    function longTap() {
      longTapTimeout = null;
      if (touch.last) {
        touch.el.trigger('longTap');
        touch = {};
      }
    }

    function cancelLongTap() {
      if (longTapTimeout) clearTimeout(longTapTimeout);
      longTapTimeout = null;
    }

    function cancelAll() {
      if (touchTimeout) clearTimeout(touchTimeout);
      if (tapTimeout) clearTimeout(tapTimeout);
      if (swipeTimeout) clearTimeout(swipeTimeout);
      if (longTapTimeout) clearTimeout(longTapTimeout);
      touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
      touch = {};
    }

    function isPrimaryTouch(event) {

      return (event.pointerType == 'touch' || event.pointerType == event.MSPOINTER_TYPE_TOUCH) && event.isPrimary;
    }

    function isPointerEventType(e, type) {
      return e.type == 'pointer' + type || e.type.toLowerCase() == 'mspointer' + type;
    }

    $(document).ready(function () {
      var now,
          delta,
          deltaX = 0,
          deltaY = 0,
          firstTouch,
          _isPointerType;

      if ('MSGesture' in window) {
        gesture = new MSGesture();
        gesture.target = document.body;
      }

      $(document).bind('MSGestureEnd', function (e) {
        var swipeDirectionFromVelocity = e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
        if (swipeDirectionFromVelocity) {
          touch.el.trigger('swipe');
          touch.el.trigger('swipe' + swipeDirectionFromVelocity);
        }
      }).on('touchstart MSPointerDown pointerdown', function (e) {
        if ((_isPointerType = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)) return;
        firstTouch = _isPointerType ? e : e.touches[0];
        if (e.touches && e.touches.length === 1 && touch.x2) {
          // Clear out touch movement data if we have it sticking around
          // This can occur if touchcancel doesn't fire due to preventDefault, etc.
          touch.x2 = undefined;
          touch.y2 = undefined;
        }
        now = Date.now();
        delta = now - (touch.last || now);
        touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
        touchTimeout && clearTimeout(touchTimeout);
        touch.x1 = firstTouch.pageX;
        touch.y1 = firstTouch.pageY;
        if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
        touch.last = now;
        longTapTimeout = setTimeout(longTap, longTapDelay);
        // adds the current touch contact for IE gesture recognition
        if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
      }).on('touchmove MSPointerMove pointermove', function (e) {

        if ((_isPointerType = isPointerEventType(e, 'move')) && !isPrimaryTouch(e)) return;
        firstTouch = _isPointerType ? e : e.touches[0];
        cancelLongTap();
        touch.x2 = firstTouch.pageX;
        touch.y2 = firstTouch.pageY;

        deltaX += Math.abs(touch.x1 - touch.x2);
        deltaY += Math.abs(touch.y1 - touch.y2);
      }).on('touchend MSPointerUp pointerup', function (e) {
        if ((_isPointerType = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)) return;
        cancelLongTap();

        // swipe
        if (touch.x2 && Math.abs(touch.x1 - touch.x2) > 30 || touch.y2 && Math.abs(touch.y1 - touch.y2) > 30) swipeTimeout = setTimeout(function () {
          if (touch.el) {
            touch.el.trigger('swipe');
            touch.el.trigger('swipe' + swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2));
          }
          touch = {};
        }, 0);

        // normal tap
        else if ('last' in touch)
            // don't fire tap when delta position changed by more than 30 pixels,
            // for instance when moving to a point and back to origin
            if (deltaX < 30 && deltaY < 30) {
              // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
              // ('tap' fires before 'scroll')
              tapTimeout = setTimeout(function () {

                // trigger universal 'tap' with the option to cancelTouch()
                // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                var event = $.Event('tap');
                event.pageX = touch.x2 || touch.x1 || 0;
                event.pageY = touch.y2 || touch.y1 || 0;
                event.cancelTouch = cancelAll;
                // [by paper] fix -> "TypeError: 'undefined' is not an object (evaluating 'touch.el.trigger'), when double tap
                if (touch.el) touch.el.trigger(event);

                // trigger double tap immediately
                if (touch.isDoubleTap) {
                  if (touch.el) touch.el.trigger('doubleTap');
                  touch = {};
                }

                // trigger single tap after 250ms of inactivity
                else {
                    touchTimeout = setTimeout(function () {
                      touchTimeout = null;
                      if (touch.el) touch.el.trigger('singleTap');
                      touch = {};
                    }, 250);
                  }
              }, 0);
            } else {
              touch = {};
            }
        deltaX = deltaY = 0;
      })
      // when the browser window loses focus,
      // for example when a modal dialog is shown,
      // cancel all ongoing events
      .on('touchcancel MSPointerCancel pointercancel', cancelAll);

      // scrolling the window indicates intention of the user
      // to scroll, not tap or swipe, so cancel all ongoing events
      $(window).on('scroll', cancelAll);
    });['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function (eventName) {
      $.fn[eventName] = function (callback) {
        return this.on(eventName, callback);
      };
    });
  })(Zepto);(function ($) {
    if ($.os.ios) {
      var gesture = {},
          gestureTimeout;

      function parentIfText(node) {
        return 'tagName' in node ? node : node.parentNode;
      }

      $(document).bind('gesturestart', function (e) {
        var now = Date.now(),
            delta = now - (gesture.last || now);
        gesture.target = parentIfText(e.target);
        gestureTimeout && clearTimeout(gestureTimeout);
        gesture.e1 = e.scale;
        gesture.last = now;
      }).bind('gesturechange', function (e) {
        gesture.e2 = e.scale;
      }).bind('gestureend', function (e) {
        if (gesture.e2 > 0) {
          Math.abs(gesture.e1 - gesture.e2) != 0 && $(gesture.target).trigger('pinch') && $(gesture.target).trigger('pinch' + (gesture.e1 - gesture.e2 > 0 ? 'In' : 'Out'));
          gesture.e1 = gesture.e2 = gesture.last = 0;
        } else if ('last' in gesture) {
          gesture = {};
        }
      });['pinch', 'pinchIn', 'pinchOut'].forEach(function (m) {
        $.fn[m] = function (callback) {
          return this.bind(m, callback);
        };
      });
    }
  })(Zepto);(function ($) {
    $.fn.end = function () {
      return this.prevObject || $();
    };

    $.fn.andSelf = function () {
      return this.add(this.prevObject || $());
    };

    'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function (property) {
      var fn = $.fn[property];
      $.fn[property] = function () {
        var ret = fn.apply(this, arguments);
        ret.prevObject = this;
        return ret;
      };
    });
  })(Zepto);(function (undefined) {
    if (String.prototype.trim === undefined) // fix for iOS 3.2
      String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
      };

    // For iOS 3.x
    // from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
    if (Array.prototype.reduce === undefined) Array.prototype.reduce = function (fun) {
      if (this === void 0 || this === null) throw new TypeError();
      var t = Object(this),
          len = t.length >>> 0,
          k = 0,
          accumulator;
      if (typeof fun != 'function') throw new TypeError();
      if (len == 0 && arguments.length == 1) throw new TypeError();

      if (arguments.length >= 2) accumulator = arguments[1];else do {
        if (k in t) {
          accumulator = t[k++];
          break;
        }
        if (++k >= len) throw new TypeError();
      } while (true);

      while (k < len) {
        if (k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t);
        k++;
      }
      return accumulator;
    };
  })();
  return module.exports = exports = Zepto;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 3 */,
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * storage操作
 * @author xingzhizhou
 * @version v2016/08/17
 * @description storage相关操作，包括sessionStorage和localStorage，可以对客户端缓存设置过期时间，单位s。localStorage必须设置过期时间
 */
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    /**
     * var cache = require("./cachev1");
     * localStorage
     * 保存到localStorage
     * 保存到localStorage必须设置过期时间
     * 设置过期时间 单位 s
     * cache.setItem(key, value, true, 3600)
     * 增加失败回调， ret 0 成功 ，非 0 失败
     * cache.setItem(key, value, true, 3600, function(ret, message){})
     * cache.getItem(key, true)
     * cache.removeItem(key, true)
     *
     * 或者
     * cache.local.setItem(key, value, 3600);
     * cache.local.setItem(key, value, 3600, function(ret){})
     * cache.local.getItem(key)
     * cache.local.removeItem(key)
     *
     * sessionStorage
     * 保存到sessionStorage
     * cache.setItem(key, value);
     * 设置过期时间 单位 s
     * cache.setItem(key, value, 3600)
     * 增加失败回调， ret 0 成功 ，非 0 失败
     * cache.setItem(key, value, 3600, function(ret, message){})
     * cache.getItem(key)
     * cache.removeItem(key)
     *
     * 或者
     * cache.session.setItem(key, value);
     * cache.session.setItem(key, value, 3600, function(ret){})
     * cache.session.getItem(key)
     * cache.session.removeItem(key)
     *
     * 测试页面连接 http://wqs.jd.com/my/cachetest.shtml
     */

    var _cacheThisModule_;

    //sessionStorage是否可用
    var _isSessionAble = true;
    //localStorage是否可用
    var _isLocalAble = true;
    var checkStorage = function (o) {
        var key = "WXSQ_STOARGE_TEST",
            value;
        try {
            o.setItem(key, 1);
            value = o.getItem(key);
            o.removeItem(key);
            return value == 1;
        } catch (e) {
            return false;
        }
    };

    try {
        //兼容IOS7 中禁用cookie的情况：出现localStorage或者sessionStorage就会异常
        _isSessionAble = checkStorage(window.sessionStorage);
        _isLocalAble = checkStorage(window.localStorage);
    } catch (e) {
        _isSessionAble = false;
        _isLocalAble = false;
    }

    //cache不可用
    if (!_isSessionAble || !_isLocalAble) {
        JD.report.umpBiz({ bizid: 45, operation: 1, result: 2, source: 0, message: "session " + _isSessionAble + "|local " + _isLocalAble });
    }

    var isArray = Array.isArray || function (object) {
        return object instanceof Array;
    };
    function isWindow(obj) {
        return obj != null && obj == obj.window;
    }
    function isObject(obj) {
        return obj != null && typeof obj == "object";
    }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }
    function extend(target, source, deep) {
        for (key in source) if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
            if (isPlainObject(source[key]) && !isPlainObject(target[key])) target[key] = {};
            if (isArray(source[key]) && !isArray(target[key])) target[key] = [];
            extend(target[key], source[key], deep);
        } else if (source[key] !== undefined) target[key] = source[key];

        return target;
    }

    function parseJSON(data) {
        if (!data || typeof data != "string") {
            return data;
        }
        data = data.replace(/^\s+|\s+$/g, "");
        if (!data) return data;

        try {
            data = JSON.parse(data);
        } catch (e) {}
        return data;
    };

    /**
     * 本地存储操作接口
     * localStorage和sessionStorage的统一调用接口，当不支持这两个特性时则不会发生写入操作，也不会出现异常，所以这是一个非安全的存储方式
     */
    var storage = function () {
        var jdStorage = window.sessionStorage;
        var keyPrefix = "WQ_";

        /**
         * 设置本地缓存
         * @param key
         * @param value
         * @param expire 过期时间，单位 s
         * @param callback 回调
         * @private
         */
        var _setItem = function (key, value, merge, expire, callback) {
            var o = parseJSON(getItem(keyPrefix + key));
            if (o && (merge && isPlainObject(value) && isPlainObject(o.v) || isArray(value) && isArray(o.v))) {
                value = extend(o.v, value, true);
            }

            var v = { v: value, "t": new Date().getTime(), "e": typeof expire != "number" ? "" : expire };
            _flush(keyPrefix + key, v, callback);
        };

        /**
         * 获取本地存储信息，如果过期返回空
         * @param key
         * @returns {*}
         * @private
         */
        var _getItem = function (key) {
            var o = jdStorage.getItem(keyPrefix + key);
            if (!o) return jdStorage.getItem(key);
            o = parseJSON(o);
            var e = o && o.e;
            //检查是否过期
            if (e === 0 || e && new Date() - o.t >= e * 1000) {
                _removeItem(key);
                return "";
            }

            return o.v;
        };

        /**
         * 删除本地存储信息
         * @param key
         * @private
         */
        var _removeItem = function (key) {
            try {
                jdStorage.removeItem(keyPrefix + key);
            } catch (e) {
                //JD.report.umpBiz({bizid: 45, operation: 1, result: 3, source: 0, message: e.message});
            }
        };

        /**
         * 将新的缓存信息写到本地存储
         * @param key
         * @param value
         * @param callback callback(0) 成功 callback(1, message) 失败
         * @returns {boolean} true 成功 false 失败
         * @private
         */
        var _flush = function (key, value, callback) {
            var v = "";
            try {
                v = JSON.stringify(value);
            } catch (e) {
                throw new Error("JSON数据格式异常：" + e.message);
            }

            try {
                jdStorage.setItem(key, v);
                callback && callback(0);
            } catch (e) {
                //清除过期数据，重试一次
                _clearOut();
                try {
                    jdStorage.setItem(key, v);
                    callback && callback(0);
                } catch (e) {
                    callback && callback(1, e.message);

                    //设置失败上报ump
                    JD.report.umpBiz({ bizid: 45, operation: 1, result: 1, source: 0, message: key + "|" + e.message });
                    return false;
                }
            }

            return true;
        };

        /**
         * localStorage还是sessionStorage
         * 读取记录本地缓存过期信息的cache
         * @param p true localStorage false sessionStorage
         * @private
         */
        var _persistence = function (p) {
            jdStorage = p ? window.localStorage : window.sessionStorage;
        };

        /**
         * 清除本地过期存储
         * @private
         */
        var _clearOut = function () {
            var key = "";
            for (var i = jdStorage.length - 1; i >= 0; i--) {
                key = jdStorage.key(i);
                key.indexOf(keyPrefix) == 0 && _getItem(key.slice(keyPrefix.length));
            }
        };

        return {
            setItem: _setItem,
            getItem: _getItem,
            removeItem: _removeItem,
            persistence: _persistence,
            clearOut: _clearOut
        };
    }();

    /**
     * 根据key获取本地存储
     * @param key
     */
    function getItem(key) {
        var v = "";
        try {
            v = storage.getItem(key);
        } catch (e) {}
        return v;
    }

    /**
     * 设置缓存
     * @param key
     * @param value
     * @param force true 使用localStorage  false sessionStorage
     * @param merge true 如果是对象或者数组，就合并
     * @param expire 过期时间 单位：s
     * @param callback 回调方法 callback(0) 成功 callback(1, message) 设置失败 message 失败原因
     * @returns {boolean}
     */
    function setItem(key, value, force, merge, expire, callback) {
        typeof expire == "function" && (callback = expire, expire = false);
        typeof merge == "number" && (expire = merge, merge = false);
        typeof merge == "function" && (callback = merge, merge = false);
        typeof force == "function" && (callback = force, force = false);
        typeof force == "number" && (expire = force, force = false);

        //localStorage强制设置过期时间
        if (force && (!expire || typeof expire != "number")) {
            throw new Error("请设置过期时间");
            return false;
        }

        storage.persistence(!!force);
        storage.setItem(key, value, merge, expire, callback);
    }

    /**
     * 删除指定的session缓存
     * @param  key 删除的键值
     */
    function removeItem(key) {
        storage.removeItem(key);
    }

    return { //默认sessionStorage， force  true  localStorage
        getItem: function (key, force) {
            storage.persistence(!!force);
            return getItem(key);
        },
        setItem: function (key, value, force, merge, expire, callback) {
            return setItem(key, value, force, merge, expire, callback);
        },
        removeItem: function (key, force) {
            storage.persistence(!!force);
            return removeItem(key);
        },
        clearOut: function (force) {
            storage.persistence(!!force);
            storage.clearOut();
        },
        session: { //sessionStorage
            getItem: function (key) {
                storage.persistence(false);
                return getItem(key);
            },
            setItem: function (key, value, merge, expire, callback) {
                return setItem(key, value, false, merge, expire, callback);
            },
            removeItem: function (key) {
                storage.persistence(false);
                return removeItem(key);
            },
            clearOut: function () {
                storage.persistence(false);
                storage.clearOut();
            }
        },
        local: { //localStorage
            getItem: function (key) {
                storage.persistence(true);
                return getItem(key);
            },
            setItem: function (key, value, merge, expire, callback) {
                return setItem(key, value, true, merge, expire, callback);
            },
            removeItem: function (key) {
                storage.persistence(true);
                return removeItem(key);
            },
            clearOut: function () {
                storage.persistence(true);
                storage.clearOut();
            }
        }
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_;
    exports.get = getCookie;
    exports.set = setCookie;
    exports.del = delCookie;

    function getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
            val = document.cookie.match(reg);
        if (!val || !val[2]) {
            return "";
        }
        var res = val[2];
        try {
            if (/(%[0-9A-F]{2}){2,}/.test(res)) {
                //utf8编码
                return decodeURIComponent(res);
            } else {
                //unicode编码
                return unescape(res);
            }
        } catch (e) {
            return unescape(res);
        }
    }

    function setCookie(name, value, expires, path, domain, secure) {
        //写入COOKIES
        var exp = new Date(),
            expires = arguments[2] || null,
            path = arguments[3] || "/",
            domain = arguments[4] || null,
            secure = arguments[5] || false;
        expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
        document.cookie = name + '=' + escape(value) + (expires ? ';expires=' + exp.toGMTString() : '') + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
    }

    function delCookie(name, path, domain, secure) {
        //删除cookie
        var value = getCookie(name);
        if (value != null) {
            var exp = new Date();
            exp.setMinutes(exp.getMinutes() - 1000);
            path = path || "/";
            document.cookie = name + '=;expires=' + exp.toGMTString() + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
        }
    }
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * 登陆组件
 * @version 20160622
 * @author boatxing
 * @description 登录，支持手Q、微信、精致衣橱两种环境的登陆
 * 判断登陆
 * login.isLogin()  return Boolean
 * login.validateLogin() 会调用后台接口校验登陆态
 *
 * 登录
 * login.login();
 *
 * 测试页面：http://wqs.jd.com/my/login-test.html
 */
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_;
    /**
     * 判断客户端是否登陆
     */
    exports.isLogin = isLogin;

    /**
     * 调用后台接口校验登陆态
     * @param callback 校验成功后的回调
     */
    exports.validateLogin = function (callback) {
        if (!isLogin()) {
            callback(false);
            return true;
        }
        validateLogin(callback);
    };

    /**
     * 登陆
     */
    exports.login = login;

    //判断是否登录
    function isLogin() {
        return getWqUin() && getWqSkey();
    }

    /**
     * 调用后台接口校验登陆态
     * @param callback 校验成功后的回调
     */
    function validateLogin(callback) {
        window.validateLoginCallback = function (data) {
            callback(data.iRet != 9999);
        };

        JD.sendJs("//wq.jd.com/mlogin/wxv3/LoginCheckJsonp?callback=validateLoginCallback&_t=" + Math.random());
    }

    /**
     * 登陆
     * @param opt: bj 是否调用北京登陆接口  env 微信or手Q  rurl 回跳链接
     */
    function login(opt) {
        var option = {
            env: getEnv(), //wx,qq,h5
            scope: false, //是否进行授权
            rurl: location.href //回跳链接
        };
        for (var i in opt) {
            option[i] = opt[i];
        }
        //检查不合法回跳链接
        if (!/^\/\/|^http(?:s?):\/\//.test(option.rurl)) {
            option.rurl = location.href;
        }
        //回跳链接加上http或者https头部
        option.rurl = option.rurl.replace(/^http(?:s?):\/\//, "//");
        option.rurl = location.protocol + option.rurl;

        //微信登录
        if (option.env == "weixin") {
            var rurl = "//wq.jd.com/mlogin/wxv3/login_BJ?rurl=" + encodeURIComponent(option.rurl) + "&appid=1" + (option.scope ? "&scope=snsapi_userinfo" : "");
            location.href = rurl;

            //防止登陆跳转失败
            setTimeout(function () {
                location.href = rurl;
            }, 1000);
            return true;
        } else if (window.WQAPI && option.env == "ycapp") {
            WQAPI.user.login(function () {
                if (option.rurl) {
                    if (option.rurl == location.href) {
                        location.reload();
                    } else {
                        location.href = option.rurl.replace(/^http(s?):/, "");
                    }
                }
            });
        }
        //京东APP
        else if (option.env == "jdapp") {
                var rurl = "//wq.jd.com/mlogin/mpage/Login?rurl=" + encodeURIComponent(option.rurl);
                location.href = rurl;
                //防止登陆跳转失败
                setTimeout(function () {
                    location.href = rurl;
                }, 1000);
            } else {
                var rurl = "//wq.jd.com/mlogin/h5v1/cpLogin_BJ?rurl=" + encodeURIComponent(option.rurl);
                location.href = rurl;
                //防止登陆跳转失败
                setTimeout(function () {
                    location.href = rurl;
                }, 1000);
            }
    }

    function getWqUin() {
        return getCookie("wq_uin");
    }

    function getWqSkey() {
        return getCookie("wq_skey");
    }

    function getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
            val = document.cookie.match(reg);
        return val ? val[2] ? unescape(val[2]) : "" : null;
    }

    function getEnv() {
        var ua = navigator.userAgent.toLowerCase();
        if (/micromessenger(\/[\d\.]+)*/.test(ua)) {
            return "weixin";
        } else if (/qq\/(\/[\d\.]+)*/.test(ua) || /qzone\//.test(ua)) {
            return "qq";
        } else if (/jzyc/.test(ua)) {
            return "ycapp";
        } else if (/jdapp;/.test(ua)) {
            return "jdapp";
        } else {
            return "h5";
        }
    }
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;//2014-11-07 alert时增减 禁止touchmove参数
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    /*
    demo 地址 ：http://static.paipaiimg.com/wx/html/common/mod_alert.html?t=1411459215227
    demo 构建：williamsli 
    全部为但
    */
    var _cacheThisModule_,
        container = document.querySelector(".wx_wrap") || document.body;
    var bInit1111Tips = false;
    var goLink = "//wqs.jd.com/my/mywx1111.shtml?p=my1111Record";

    /*alert蒙层*/
    var alertCoverDiv = document.createElement('div');
    alertCoverDiv.style.cssText = "position: fixed; width: 100%; height: 100%; top: 0px; left: 0px; z-index: 109; background: rgba(0, 0, 0, 0.3);";

    function notNeedLoadCss() {
        var uiCSSUrl2 = 'base/gb/css/gb.min_',
            uiCSSUrl3 = 'wx/gb/css/gb.min_',
            uiCSSUrl4 = 'sq/gb/css/gb.min_',
            uiCSSUrl5 = 'mod_alert.min',

        //uiCSSUrl = 'base.s.min',
        links = document.getElementsByTagName('link'),
            isHave = false;
        for (var i = 0, l = links.length; i < l; i++) {
            if (links[i].rel == 'stylesheet' && (links[i].href.indexOf(uiCSSUrl2) >= 0 || links[i].href.indexOf(uiCSSUrl3) >= 0 || links[i].href.indexOf(uiCSSUrl4) >= 0 || links[i].href.indexOf(uiCSSUrl5) >= 0)) {
                isHave = true;
                break;
            }
        }
        return isHave;
    }
    /*alert蒙层*/

    function loadCss(url) {
        if (notNeedLoadCss()) {
            return;
        }
        var l = document.createElement('link');
        l.setAttribute('type', 'text/css');
        l.setAttribute('rel', 'stylesheet');
        l.setAttribute('href', url);
        document.getElementsByTagName("head")[0].appendChild(l);
    };

    /*
    title:文字提示，默认操作成功
    t:倒计时消失秒数，默认2秒
    classname:默认g_small_tips
    */
    function showTip(obj) {
        if (!obj) return;
        var className = obj.className || 'g_small_tips',
            tips = document.querySelector("." + className),
            t = obj.t || 2000,
            title = obj.title || '操作成功!';
        //判断是否存在tips，如果不存在，则新加一个节点
        if (!tips) {
            tips = document.createElement('div');
            tips.className = className;
            document.body.appendChild(tips);
        }
        tips.innerText = title;
        tips.style.display = 'block'; //显示tips
        //展示后自动消失
        setTimeout(function () {
            tips.style.display = 'none'; //隐藏tips
        }, t);
    }

    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    /*
     * opts {object}
     *      msg:提示消息，必传参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function info(opts) {
        var option = {
            msg: "", //提示消息
            icon: "none", //图标类型，none,info,fail,success
            delay: 2000 //倒计时消失秒数，默认2秒
        };
        opts = opts || {};
        extend(option, opts);
        var el = document.createElement('div');
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.icon != 'none' ? '<i class="icon' + (option.icon != 'info' ? ' icon_' + option.icon : '') + '"></i>' : '') + '<p>' + option.msg + '</p>';
        container.appendChild(el);
        setTimeout(function () {
            el.style.display = 'none';
            container.removeChild(el);
        }, option.delay);
    }

    /*
     * msg:提示消息，必传参数
     * opts 参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function alert(opts) {
        var option = {
            showClose: false,
            msg: "", //提示消息
            confirmText: '确认', // 确认按钮文案
            icon: "none", //图标类型，none,info,fail,success
            onConfirm: null, //点击“确认按钮”时的回调
            stopMove: false,
            btnClass: 'btn_1'
        },
            stopMove = function (e) {
            e.preventDefault();
        },
            el = document.createElement('div');
        opts = opts || {};
        extend(option, opts);
        container = opts.container || container;
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.showClose ? '<span class="close"></span>' : '') + (option.icon != 'none' ? '<i class="icon' + (option.icon != 'info' ? ' icon_' + option.icon : '') + '"></i>' : '') + '<p>' + option.msg + '</p>' + (option.subMsg ? '<p class="small">' + option.subMsg + '</p>' : '') + '<p class="btns"><a href="javascript:;" class="btn ' + option.btnClass + '">' + option.confirmText + '</a></p>';
        container.appendChild(el);
        option.showClose && (el.querySelector(".close").onclick = function (e) {
            //option.onCancel && option.onCancel();
            this.onclick = null;
            clear();
        });

        //禁止滑动
        el.querySelector(".btn").onclick = function (e) {
            /*alert蒙层*/

            /*alert蒙层*/
            option.onConfirm && option.onConfirm();
            //el.style.display = 'none';
            this.onclick = null;
            clear();
            //释放 禁止滑动事件

        };
        /*alert蒙层*/
        document.body.appendChild(alertCoverDiv);
        option.stopMove && document.addEventListener("touchmove", stopMove, false);

        function clear() {
            document.body.removeChild(alertCoverDiv);
            el.style.display = 'none';
            container.removeChild(el);
            option.stopMove && document.removeEventListener("touchmove", stopMove, false);
        }
    }

    /*
     * msg:提示消息，必传参数
     * opts 参数
     *      icon 图片类型，默认没有图片
     *      delay 倒计时消失时间
     */
    function confirm(opts) {
        var option = {
            msg: "", //提示消息
            icon: "none", //图标类型，none,info,fail,success
            okText: "确定",
            cancelText: "取消",
            onConfirm: null, //点击“确认按钮”时的回调
            onCancel: null, //点击“确认按钮”时的回调
            onClearCb: null //清除后的操作
        };
        opts = opts || {};
        extend(option, opts);
        container = opts.container || container;
        var el = document.createElement('div');
        el.className = "mod_alert show fixed";
        el.innerHTML = (option.icon != 'none' ? '<i class="icon' + (option.icon != 'info' ? ' icon_' + option.icon : '') + '"></i>' : '') + '<p>' + option.msg + '</p>' + (option.subMsg ? '<p class="small">' + option.subMsg + '</p>' : '') + '<p class="btns"><a href="javascript:;" id="ui_btn_confirm" class="btn btn_1">' + option.okText + '</a><a href="javascript:;" id="ui_btn_cancel" class="btn btn_1">' + option.cancelText + '</a></p>';
        container.appendChild(el);
        /*alert蒙层*/
        document.body.appendChild(alertCoverDiv);
        /*alert蒙层*/
        el.querySelector("#ui_btn_cancel").onclick = function (e) {
            option.onCancel && option.onCancel();
            clear();
        };
        el.querySelector("#ui_btn_confirm").onclick = function (e) {
            option.onConfirm && option.onConfirm();
            clear();
        };

        function clear() {
            el.style.display = 'none';
            container.removeChild(el);
            document.body.removeChild(alertCoverDiv);
            option.onClearCb && option.onClearCb();
        }
    }

    /*
    type:类型
    result:/
    */
    loadCss("//wq.360buyimg.com/fd/h5/base/gb/css/mod_alert.min_79c590c3.css");

    module.exports = {
        showTip: showTip,
        info: info,
        alert: alert,
        confirm: confirm

    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_,
        $ = __webpack_require__(2),
        ls = __webpack_require__(1),
        useDebug = JD.url.getUrlParam("mdebug") ? true : false,
        storage = __webpack_require__(57),
        md5 = __webpack_require__(56),
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
    myDomain + '/mcoss/material/query', myDomain + '/mcoss/spematerial/spematerialshow', //手Q惠品牌新特卖接口//wq.jd.com/mcoss/brandspecial/show?
    myDomain + '/mcoss/mportal/show', //mportal接口，目前用于微信女装馆
    myDomain + '/mcoss/brandspecial/show', //手Q惠品牌新 拉取mid 接口 //wq.jd.com/mcoss/spematerial/spematerialshow?requestParam 
    myDomain + '/mcoss/keyword/keywordsearch', //金手指关键词
    myDomain + '/mcoss/focusbi/show_new', myDomain + '/mcoss/seckill/show', //秒杀接口
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
            6: [["mids", "gid", "callback"], ["showtype", "gid", "callback", "category", "pageindex", "pagesize"]], //获取素材详情
            7: ["aid", "actid", "pagesize", "pageindex", "callback", "showtype", "category"], //品牌特卖素材详情接口
            9: ["aid", "pagesize", "pageindex", "callback", "showtype", "category"], //品牌特卖列表接口
            10: ["ruleid", "pi", "pc", "tpl", "sorttype", "callback", "options", "cgid1", "cgid2", "cgid3"], //品牌特卖列表接口ruleid,pi,pc,tpl,sorttype,callback,options,cgid1,cgid2,cgid3
            11: ["gids", "pc", "callback", "pcs"], //新焦点cpc
            12: ["actid", "ptype", "pi", "pc", "cgid", "areaid", "ch", "callback", "tpl", "pretime", "mscence", "exclarea", "options", "gbyarea"],
            13: ["rids", "mscence", "callback", "sn", "rt", "st", "cl"]
        };
        if (type == _DataType.MART || type == _DataType.MART_MUTI || type == _DataType.SECKILL || type == _DataType.RANKLIST) {
            //对于mmart或者multi_mart，需要为url补充特殊必须参数mscence（1-微信 2-手Q 3-浏览器 4-服务APP）
            url += "&mscence=" + ({
                "weixin": 1,
                "qq": 2,
                "jzyc": 4,
                "mobile": 3
            }[JD.device.scene] || 3);
        }
        var params = url.split("?")[1]; //获取参数部分
        var paramObj = {};
        var pairs = params.split("&"); //将Url中的参数分解成key=value这种形式的数组列表
        var keys = pairs.map(function (pair) {
            //获取参数名称列表,并构造参数对象列表
            var key = pair.split("=")[0];
            //新焦点对gids参数进行排序再生成容灾
            if (type == _DataType.CPC_NEW && key == "gids") {
                var gidsvalue = pair.split("=")[1];
                gidsvalue = gidsvalue.split("|");
                gidsvalue.sort(function (a, b) {
                    return a - b;
                });
                paramObj[key] = key + "=" + gidsvalue.join("|");
            } else if (type == _DataType.CPC_NEW && key == "pcs") {
                var gidsvalue = pair.split("=")[1];
                gidsvalue = gidsvalue.split(",");
                gidsvalue.sort();
                paramObj[key] = key + "=" + gidsvalue.join(",");
            } else {
                paramObj[key] = pair;
            }
            return key;
        });
        var validParams = validParamsMap[type];
        if (type === _DataType.MaterialQuery) {
            //素材详情接口，有两套容灾规则,有效参数白名单不一样，用参数中是否有pageindex来区分，Fuck!!!!!
            validParams = opt.param.pageindex ? validParams[1] : validParams[0];
        }
        keys = keys.filter(function (key) {
            //过滤掉不合法的参数
            return validParams.some(function (validKey) {
                return key == validKey;
            });
        });
        keys.sort(); //按照参数名称从小到大排序
        //typeKey为容灾文件所在目录,一般也是cgi所在的目录
        var typeKey = {
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
        }[type];
        var cgiName = url.match(/\w+(?=\?)/)[0];
        var urlKey = keys.reduce(function (pre, cur, index) {
            //构造url和参数的key,用于生成md5值
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
        var str = paramObj[{
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
        }[type]];
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
            arr2.sort(function (a, b) {
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
        if (opt.dataType != _DataType.PPMS) {
            //除Ppms数据外的，其他的都有
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

        if (opt.dataType == _DataType.MART && strategy.mart.useStaticUrl || opt.dataType == _DataType.CPC && strategy.cpc.useStaticUrl || opt.dataType == _DataType.CPT && strategy.cpt.useStaticUrl || opt.dataType == _DataType.CPT_WX && strategy.cpt.useStaticUrl || opt.dataType == _DataType.MaterialQuery && strategy.materialQuery.useStaticUrl || opt.dataType == _DataType.MART_MUTI && strategy.multiMart.useStaticUrl || opt.dataType == _DataType.Brandspecial && strategy.brandspecial.useStaticUrl || opt.dataType == _DataType.Spematerial && strategy.spematerial.useStaticUrl || opt.dataType == _DataType.Keywordsearch && strategy.keywordsearch.useStaticUrl || opt.dataType == _DataType.CPC_NEW && strategy.cpcnew.useStaticUrl || opt.dataType == _DataType.SECKILL && strategy.seckill.useStaticUrl || opt.dataType == _DataType.RANKLIST && strategy.ranklist.useStaticUrl) {
            staticUrl = createStaticUrl(opt.dataType, url, opt);
        }
        //通过全局变量来判断是否加跨域标识，这个稍后看能否改进，用ajax方法获取数据
        window[cbName] = function (obj) {

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
                            error: function (e) {
                                JD.report.badJs(_url);
                                opt.handleError && opt.handleError(func, args, context);
                            }
                        });

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
                onError: function (msg, url, line, col, error) {
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
        if (now > new Date('2016/11/10 23:55:00') && now < new Date('2016/11/11 00:10:00') || now > new Date('2016/11/11 23:55:00') && now < new Date('2016/11/12 00:10:00')) {
            JD.GLOBAL_CONFIG.MART_NOT_LOAD_FROM_CACHE = true;
        }
        if ((opt.dataType == _DataType.MART || opt.dataType == _DataType.MART_MUTI) && JD.GLOBAL_CONFIG.MART_NOT_LOAD_FROM_CACHE) {
            notLoadFromCache = true;
        }
        if (!useDebug && !notLoadFromCache) {
            cacheKey = opt.param.cacheKey || getParamStr(opt.param, true);
            storage.readH5Data(cacheKey, function (res, success) {
                if (!success || !res) {
                    fetchData(opt, cacheKey);
                    return;
                }
                //模拟异步, true代表是从缓存中获取数据
                window.setTimeout(function () {
                    opt.cb && opt.cb(res, true);
                }, 0);
            });
        } else {
            fetchData(opt, cacheKey);
        }
    }

    exports.getData = function (opt) {
        getData(opt);
    };
    exports.getStaticUrl = function (opt) {
        return getStaticUrl(opt);
    };
    exports.DataType = _DataType;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	var _cacheThisModule_;
	var _formatJson_cache = {};

	$formatJson = function (str, data) {
		/* 模板替换,str:模板id或者内容，data:数据内容
  \W：匹配任何非单词字符。等价于 '[^A-Za-z0-9_]'。 
  如果是id,并且cache中有值，直接返回，否则获取innerHTML，再次解析；
  如果不是id，解析并存入cache
  */
		var fn = !/\W/.test(str) ? _formatJson_cache[str] = _formatJson_cache[str] || $formatJson(document.getElementById(str).innerHTML) : new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str.replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'") + "');}return p.join('');");
		return data ? fn(data) : fn;
	};

	exports.formatJson = $formatJson;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Created by jackyfnag on 2014/07/09.
 *based on iScroll v5.1.3
参数：
croe options.useTransform    是否使用 CSS3 的 Transform 属性    true
options.useTransition   是否使用 CSS3 的 Transition 属性，否则使用 requestAnimationFram 代替  true
options.HWCompositing   是否启用硬件加速    true
options.bounce  是否启用弹力动画效果，关掉可以加速   true
options.disableMouse    是否关闭鼠标事件探测。如知道运行在哪个平台，可以开启它来加速。 false
options.disablePointer  是否关闭指针事件探测。如知道运行在哪个平台，可以开启它来加速。 false
options.disableTouch    是否关闭触摸事件探测。如知道运行在哪个平台，可以开启它来加速。 false
options.eventPassthrough    使用 IScroll 的横轴滚动时，如想使用系统立轴滚动并在横轴上生效，请开启。 event passthrough demo false
options.freeScroll  主要在上下左右滚动都生效时使用，可以向任意方向滚动。 2D scroll demo   false
options.keyBindings 绑定按键事件。 Key bindings    false
options.invertWheelDirection    反向鼠标滚轮。 false
options.momentum    是否开启动量动画，关闭可以提升效率。  true
options.mouseWheel  是否监听鼠标滚轮事件。 false
options.preventDefault  是否屏蔽默认事件。   true
options.scrollbars  是否显示默认滚动条   false
options.scrollXoptions.scrollY  可以设置 IScroll 滚动的初始位置    0
options.tap 是否启用自定义的 tap 事件 可以自定义 tap 事件名   false
滚动条Scrollbars   options.scrollbars  是否显示默认滚动条   false
options.fadeScrollbars  是否渐隐滚动条，关掉可以加速  true
options.interactiveScrollbars   用户是否可以拖动滚动条 false
options.resizeScrollbars    是否固定滚动条大小，建议自定义滚动条时可开启。 false
options.shrinkScrollbars    滚动超出滚动边界时，是否收缩滚动条。‘clip’：裁剪超出的滚动条
‘scale’: 按比例的收缩滚动条（占用 CPU 资源）

false: 不收缩，
scrollToElement(el, time, offsetX, offsetY, easing) 滚动到某个元素。 el 为必须的参数 offsetX/offsetY ：相对于 el 元素的位移。设为 true 即为屏幕中心
 */

!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {

    var $ = __webpack_require__(2);
    /* var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };*/
    var _cacheThisModule_ = '';

    /*! iScroll v5.1.3 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license */

    var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };

    var utils = function () {
        var me = {};

        var _elementStyle = document.createElement('div').style;
        var _vendor = function () {
            var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
                transform,
                i = 0,
                l = vendors.length;

            for (; i < l; i++) {
                transform = vendors[i] + 'ransform';
                if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
            }

            return false;
        }();

        function _prefixStyle(style) {
            if (_vendor === false) return false;
            if (_vendor === '') return style;
            return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
        }

        me.getTime = Date.now || function getTime() {
            return new Date().getTime();
        };

        me.extend = function (target, obj) {
            for (var i in obj) {
                target[i] = obj[i];
            }
        };

        me.addEvent = function (el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        };

        me.removeEvent = function (el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        };

        me.prefixPointerEvent = function (pointerEvent) {
            return window.MSPointerEvent ? 'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) : pointerEvent;
        };

        me.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration) {
            var distance = current - start,
                speed = Math.abs(distance) / time,
                destination,
                duration;

            deceleration = deceleration === undefined ? 0.0006 : deceleration;

            destination = current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
            duration = speed / deceleration;

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - wrapperSize / 2.5 * (speed / 8) : lowerMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if (destination > 0) {
                destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
                distance = Math.abs(current) + destination;
                duration = distance / speed;
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        };

        var _transform = _prefixStyle('transform');

        me.extend(me, {
            hasTransform: _transform !== false,
            hasPerspective: _prefixStyle('perspective') in _elementStyle,
            hasTouch: 'ontouchstart' in window,
            hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
            hasTransition: _prefixStyle('transition') in _elementStyle
        });

        // This should find all Android browsers lower than build 535.19 (both stock browser and webview)
        me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !/Chrome\/\d/.test(window.navigator.appVersion);

        me.extend(me.style = {}, {
            transform: _transform,
            transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
            transitionDuration: _prefixStyle('transitionDuration'),
            transitionDelay: _prefixStyle('transitionDelay'),
            transformOrigin: _prefixStyle('transformOrigin')
        });

        me.hasClass = function (e, c) {
            var re = new RegExp("(^|\\s)" + c + "(\\s|$)");
            return re.test(e.className);
        };

        me.addClass = function (e, c) {
            if (me.hasClass(e, c)) {
                return;
            }

            var newclass = e.className.split(' ');
            newclass.push(c);
            e.className = newclass.join(' ');
        };

        me.removeClass = function (e, c) {
            if (!me.hasClass(e, c)) {
                return;
            }

            var re = new RegExp("(^|\\s)" + c + "(\\s|$)", 'g');
            e.className = e.className.replace(re, ' ');
        };

        me.offset = function (el) {
            var left = -el.offsetLeft,
                top = -el.offsetTop;

            // jshint -W084
            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop;
            }
            // jshint +W084

            return {
                left: left,
                top: top
            };
        };

        me.preventDefaultException = function (el, exceptions) {
            for (var i in exceptions) {
                if (exceptions[i].test(el[i])) {
                    return true;
                }
            }

            return false;
        };

        me.extend(me.eventType = {}, {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,

            mousedown: 2,
            mousemove: 2,
            mouseup: 2,

            pointerdown: 3,
            pointermove: 3,
            pointerup: 3,

            MSPointerDown: 3,
            MSPointerMove: 3,
            MSPointerUp: 3
        });

        me.extend(me.ease = {}, {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function (k) {
                    return k * (2 - k);
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function (k) {
                    return Math.sqrt(1 - --k * k);
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function (k) {
                    var b = 4;
                    return (k = k - 1) * k * ((b + 1) * k + b) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function (k) {
                    if ((k /= 1) < 1 / 2.75) {
                        return 7.5625 * k * k;
                    } else if (k < 2 / 2.75) {
                        return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
                    } else if (k < 2.5 / 2.75) {
                        return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
                    } else {
                        return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function (k) {
                    var f = 0.22,
                        e = 0.4;

                    if (k === 0) {
                        return 0;
                    }
                    if (k == 1) {
                        return 1;
                    }

                    return e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1;
                }
            }
        });

        me.tap = function (e, eventName) {
            var ev = document.createEvent('Event');
            ev.initEvent(eventName, true, true);
            ev.pageX = e.pageX;
            ev.pageY = e.pageY;
            e.target.dispatchEvent(ev);
        };

        me.click = function (e) {
            var target = e.target,
                ev;

            if (!/(SELECT|INPUT|TEXTAREA)/i.test(target.tagName)) {
                ev = document.createEvent('MouseEvents');
                ev.initMouseEvent('click', true, true, e.view, 1, target.screenX, target.screenY, target.clientX, target.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, 0, null);

                ev._constructed = true;
                target.dispatchEvent(ev);
            }
        };

        return me;
    }();

    function IScroll(el, options) {
        this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
        this.scroller = this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style; // cache style for better performance

        this.options = {

            // INSERT POINT: OPTIONS 

            startX: 0,
            startY: 0,
            scrollY: true,
            directionLockThreshold: 5,
            momentum: true,

            bounce: true,
            bounceTime: 600,
            bounceEasing: '',

            preventDefault: true,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
            },

            HWCompositing: true,
            useTransition: true,
            useTransform: true
        };

        for (var i in options) {
            this.options[i] = options[i];
        }

        // Normalize options
        this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

        this.options.useTransition = utils.hasTransition && this.options.useTransition;
        this.options.useTransform = utils.hasTransform && this.options.useTransform;

        this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
        this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

        // If you want eventPassthrough I have to lock one of the axes
        this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
        this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

        // With eventPassthrough we also need lockDirection mechanism
        this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
        this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

        this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

        this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

        if (this.options.tap === true) {
            this.options.tap = 'tap';
        }

        // INSERT POINT: NORMALIZATION

        // Some defaults    
        this.x = 0;
        this.y = 0;
        this.directionX = 0;
        this.directionY = 0;
        this._events = {};

        // INSERT POINT: DEFAULTS

        this._init();
        this.refresh();

        this.scrollTo(this.options.startX, this.options.startY);
        this.enable();
    }

    IScroll.prototype = {
        version: '5.1.3',

        _init: function () {
            this._initEvents();

            // INSERT POINT: _init
        },

        destroy: function () {
            this._initEvents(true);

            this._execEvent('destroy');
        },

        _transitionEnd: function (e) {
            if (e.target != this.scroller || !this.isInTransition) {
                return;
            }

            this._transitionTime();
            if (!this.resetPosition(this.options.bounceTime)) {
                this.isInTransition = false;
                this._execEvent('scrollEnd');
            }
        },

        _start: function (e) {
            // React to left mouse button only
            if (utils.eventType[e.type] != 1) {
                if (e.button !== 0) {
                    return;
                }
            }

            if (!this.enabled || this.initiated && utils.eventType[e.type] !== this.initiated) {
                return;
            }

            if (this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            this.initiated = utils.eventType[e.type];
            this.moved = false;
            this.distX = 0;
            this.distY = 0;
            this.directionX = 0;
            this.directionY = 0;
            this.directionLocked = 0;

            this._transitionTime();

            this.startTime = utils.getTime();

            if (this.options.useTransition && this.isInTransition) {
                this.isInTransition = false;
                pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this._execEvent('scrollEnd');
            } else if (!this.options.useTransition && this.isAnimating) {
                this.isAnimating = false;
                this._execEvent('scrollEnd');
            }

            this.startX = this.x;
            this.startY = this.y;
            this.absStartX = this.x;
            this.absStartY = this.y;
            this.pointX = point.pageX;
            this.pointY = point.pageY;

            this._execEvent('beforeScrollStart');
        },

        _move: function (e) {
            if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
                return;
            }

            if (this.options.preventDefault) {
                // increases performance on Android? TODO: check!
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                deltaX = point.pageX - this.pointX,
                deltaY = point.pageY - this.pointY,
                timestamp = utils.getTime(),
                newX,
                newY,
                absDistX,
                absDistY;

            this.pointX = point.pageX;
            this.pointY = point.pageY;

            this.distX += deltaX;
            this.distY += deltaY;
            absDistX = Math.abs(this.distX);
            absDistY = Math.abs(this.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if (timestamp - this.endTime > 300 && absDistX < 10 && absDistY < 10) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if (!this.directionLocked && !this.options.freeScroll) {
                if (absDistX > absDistY + this.options.directionLockThreshold) {
                    this.directionLocked = 'h'; // lock horizontally
                } else if (absDistY >= absDistX + this.options.directionLockThreshold) {
                    this.directionLocked = 'v'; // lock vertically
                } else {
                    this.directionLocked = 'n'; // no lock
                }
            }

            if (this.directionLocked == 'h') {
                if (this.options.eventPassthrough == 'vertical') {
                    e.preventDefault();
                } else if (this.options.eventPassthrough == 'horizontal') {
                    this.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if (this.directionLocked == 'v') {
                if (this.options.eventPassthrough == 'horizontal') {
                    e.preventDefault();
                } else if (this.options.eventPassthrough == 'vertical') {
                    this.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < this.maxScrollX) {
                newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
            }
            if (newY > 0 || newY < this.maxScrollY) {
                newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
            }

            this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (!this.moved) {
                this._execEvent('scrollStart');
            }

            this.moved = true;

            this._translate(newX, newY);

            /* REPLACE START: _move */

            if (timestamp - this.startTime > 300) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;
            }

            /* REPLACE END: _move */
        },

        _end: function (e) {
            if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
                return;
            }

            if (this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
                e.preventDefault();
            }

            var point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX,
                momentumY,
                duration = utils.getTime() - this.startTime,
                newX = Math.round(this.x),
                newY = Math.round(this.y),
                distanceX = Math.abs(newX - this.startX),
                distanceY = Math.abs(newY - this.startY),
                time = 0,
                easing = '';

            this.isInTransition = 0;
            this.initiated = 0;
            this.endTime = utils.getTime();

            // reset if we are outside of the boundaries
            if (this.resetPosition(this.options.bounceTime)) {
                return;
            }

            this.scrollTo(newX, newY); // ensures that the last position is rounded

            // we scrolled less than 10 pixels
            if (!this.moved) {
                if (this.options.tap) {
                    utils.tap(e, this.options.tap);
                }

                if (this.options.click) {
                    utils.click(e);
                }

                this._execEvent('scrollCancel');
                return;
            }

            if (this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100) {
                this._execEvent('flick');
                return;
            }

            // start momentum animation if needed
            if (this.options.momentum && duration < 300) {
                momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
                    destination: newX,
                    duration: 0
                };
                momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
                    destination: newY,
                    duration: 0
                };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }

            // INSERT POINT: _end

            if (newX != this.x || newY != this.y) {
                // change easing function when scroller goes out of the boundaries
                if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
                    easing = utils.ease.quadratic;
                }

                this.scrollTo(newX, newY, time, easing);
                return;
            }

            this._execEvent('scrollEnd');
        },

        _resize: function () {
            var that = this;

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(function () {
                that.refresh();
            }, this.options.resizePolling);
        },

        resetPosition: function (time) {
            var x = this.x,
                y = this.y;

            time = time || 0;

            if (!this.hasHorizontalScroll || this.x > 0) {
                x = 0;
            } else if (this.x < this.maxScrollX) {
                x = this.maxScrollX;
            }

            if (!this.hasVerticalScroll || this.y > 0) {
                y = 0;
            } else if (this.y < this.maxScrollY) {
                y = this.maxScrollY;
            }

            if (x == this.x && y == this.y) {
                return false;
            }

            this.scrollTo(x, y, time, this.options.bounceEasing);

            return true;
        },

        disable: function () {
            this.enabled = false;
        },

        enable: function () {
            this.enabled = true;
        },

        refresh: function () {
            var rf = this.wrapper.offsetHeight; // Force reflow

            this.wrapperWidth = this.wrapper.clientWidth;
            this.wrapperHeight = this.wrapper.clientHeight;

            /* REPLACE START: refresh */

            this.scrollerWidth = this.scroller.offsetWidth;
            this.scrollerHeight = this.scroller.offsetHeight;

            this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
            this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

            /* REPLACE END: refresh */

            this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
            this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;

            if (!this.hasHorizontalScroll) {
                this.maxScrollX = 0;
                this.scrollerWidth = this.wrapperWidth;
            }

            if (!this.hasVerticalScroll) {
                this.maxScrollY = 0;
                this.scrollerHeight = this.wrapperHeight;
            }

            this.endTime = 0;
            this.directionX = 0;
            this.directionY = 0;

            this.wrapperOffset = utils.offset(this.wrapper);

            this._execEvent('refresh');

            this.resetPosition();

            // INSERT POINT: _refresh
        },

        on: function (type, fn) {
            if (!this._events[type]) {
                this._events[type] = [];
            }

            this._events[type].push(fn);
        },

        off: function (type, fn) {
            if (!this._events[type]) {
                return;
            }

            var index = this._events[type].indexOf(fn);

            if (index > -1) {
                this._events[type].splice(index, 1);
            }
        },

        _execEvent: function (type) {
            if (!this._events[type]) {
                return;
            }

            var i = 0,
                l = this._events[type].length;

            if (!l) {
                return;
            }

            for (; i < l; i++) {
                this._events[type][i].apply(this, [].slice.call(arguments, 1));
            }
        },

        scrollBy: function (x, y, time, easing) {
            x = this.x + x;
            y = this.y + y;
            time = time || 0;

            this.scrollTo(x, y, time, easing);
        },

        scrollTo: function (x, y, time, easing) {
            easing = easing || utils.ease.circular;

            this.isInTransition = this.options.useTransition && time > 0;

            if (!time || this.options.useTransition && easing.style) {
                this._transitionTimingFunction(easing.style);
                this._transitionTime(time);
                this._translate(x, y);
            } else {
                this._animate(x, y, time, easing.fn);
            }
        },

        scrollToElement: function (el, time, offsetX, offsetY, easing) {
            el = el.nodeType ? el : this.scroller.querySelector(el);

            if (!el) {
                return;
            }

            var pos = utils.offset(el);

            pos.left -= this.wrapperOffset.left;
            pos.top -= this.wrapperOffset.top;

            // if offsetX/Y are true we center the element to the screen
            if (offsetX === true) {
                offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
            }
            if (offsetY === true) {
                offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
            }

            pos.left -= offsetX || 0;
            pos.top -= offsetY || 0;

            pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
            pos.top = pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;

            time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time;

            this.scrollTo(pos.left, pos.top, time, easing);
        },

        _transitionTime: function (time) {
            time = time || 0;

            this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';

            if (!time && utils.isBadAndroid) {
                this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
            }

            // INSERT POINT: _transitionTime
        },

        _transitionTimingFunction: function (easing) {
            this.scrollerStyle[utils.style.transitionTimingFunction] = easing;

            // INSERT POINT: _transitionTimingFunction
        },

        _translate: function (x, y) {
            if (this.options.useTransform) {

                /* REPLACE START: _translate */

                this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

                /* REPLACE END: _translate */
            } else {
                x = Math.round(x);
                y = Math.round(y);
                this.scrollerStyle.left = x + 'px';
                this.scrollerStyle.top = y + 'px';
            }

            this.x = x;
            this.y = y;

            // INSERT POINT: _translate
        },

        _initEvents: function (remove) {
            var eventType = remove ? utils.removeEvent : utils.addEvent,
                target = this.options.bindToWrapper ? this.wrapper : window;

            eventType(window, 'orientationchange', this);
            eventType(window, 'resize', this);

            if (this.options.click) {
                eventType(this.wrapper, 'click', this, true);
            }

            if (!this.options.disableMouse) {
                eventType(this.wrapper, 'mousedown', this);
                eventType(target, 'mousemove', this);
                eventType(target, 'mousecancel', this);
                eventType(target, 'mouseup', this);
            }

            if (utils.hasPointer && !this.options.disablePointer) {
                eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
                eventType(target, utils.prefixPointerEvent('pointermove'), this);
                eventType(target, utils.prefixPointerEvent('pointercancel'), this);
                eventType(target, utils.prefixPointerEvent('pointerup'), this);
            }

            if (utils.hasTouch && !this.options.disableTouch) {
                eventType(this.wrapper, 'touchstart', this);
                eventType(target, 'touchmove', this);
                eventType(target, 'touchcancel', this);
                eventType(target, 'touchend', this);
            }

            eventType(this.scroller, 'transitionend', this);
            eventType(this.scroller, 'webkitTransitionEnd', this);
            eventType(this.scroller, 'oTransitionEnd', this);
            eventType(this.scroller, 'MSTransitionEnd', this);
        },

        getComputedPosition: function () {
            var matrix = window.getComputedStyle(this.scroller, null),
                x,
                y;

            if (this.options.useTransform) {
                matrix = matrix[utils.style.transform].split(')')[0].split(', ');
                x = +(matrix[12] || matrix[4]);
                y = +(matrix[13] || matrix[5]);
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, '');
                y = +matrix.top.replace(/[^-\d.]/g, '');
            }

            return {
                x: x,
                y: y
            };
        },

        _animate: function (destX, destY, duration, easingFn) {
            var that = this,
                startX = this.x,
                startY = this.y,
                startTime = utils.getTime(),
                destTime = startTime + duration;

            function step() {
                var now = utils.getTime(),
                    newX,
                    newY,
                    easing;

                if (now >= destTime) {
                    that.isAnimating = false;
                    that._translate(destX, destY);

                    if (!that.resetPosition(that.options.bounceTime)) {
                        that._execEvent('scrollEnd');
                    }

                    return;
                }

                now = (now - startTime) / duration;
                easing = easingFn(now);
                newX = (destX - startX) * easing + startX;
                newY = (destY - startY) * easing + startY;
                that._translate(newX, newY);

                if (that.isAnimating) {
                    rAF(step);
                }
            }

            this.isAnimating = true;
            step();
        },
        handleEvent: function (e) {
            switch (e.type) {
                case 'touchstart':
                case 'pointerdown':
                case 'MSPointerDown':
                case 'mousedown':
                    this._start(e);
                    break;
                case 'touchmove':
                case 'pointermove':
                case 'MSPointerMove':
                case 'mousemove':
                    this._move(e);
                    break;
                case 'touchend':
                case 'pointerup':
                case 'MSPointerUp':
                case 'mouseup':
                case 'touchcancel':
                case 'pointercancel':
                case 'MSPointerCancel':
                case 'mousecancel':
                    this._end(e);
                    break;
                case 'orientationchange':
                case 'resize':
                    this._resize();
                    break;
                case 'transitionend':
                case 'webkitTransitionEnd':
                case 'oTransitionEnd':
                case 'MSTransitionEnd':
                    this._transitionEnd(e);
                    break;
                case 'wheel':
                case 'DOMMouseScroll':
                case 'mousewheel':
                    this._wheel(e);
                    break;
                case 'keydown':
                    this._key(e);
                    break;
                case 'click':
                    if (!e._constructed) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
            }
        }
    };
    IScroll.utils = utils;

    JD.GLOBAL_CONFIG.IScroll = IScroll;
    JD.events.trigger("event_iscrollready");
    // 入口函数
    exports.init = function (el, options) {
        var _scroll = new IScroll(el, options);
        _scroll.utils = utils;
        return _scroll;
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;//可用于（img、div、其他dom）元素的滑动、轮播，还有tab的点击切换
//支持动态插入一个子轮播元素  插在第二个

!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	var _cacheThisModule_;
	var $ = __webpack_require__(2);
	var scroll = function (o) {
		this.opt = {
			tp: 'text', //图片img或是文字text  默认text
			moveDom: null, //必选  待移动父元素zepto查询对象
			moveChild: [], //必选  zepto查询对象
			tab: [], //必选  zepto查询对象
			viewDom: null, //在那个容器里滑动，算宽度用，默认window  如果你的默认位置不对  那就要检查下这个
			touchDom2: [], //滑动事件的第二控制器   第一控制器是moveDom，   （dom原生对象数组，不建议搞太多）
			sp: null, //当前触发点的position
			min: 0, //响应滑动的最小移动距离
			minp: 0, //翻页的最小移动距离
			step: 0, //移动的步长 一般是每个元素的长度
			len: 1, //总元素
			index: 1, //当前位移的元素
			offset: 0,
			loadImg: false,
			image: [],
			loopScroll: false, //是否要循环滚动
			lockScrY: false, //是否让竖向滚动
			stopOnce: false, //hold时停一次
			autoTime: 0, //自动轮播， 默认不自动， 需要的话就传毫秒值 如5000
			holdAuto: false, //自动轮播锁定  当滑出轮播区域后  或是手指在滑动的时候 可以屏蔽自动轮播
			tabClass: 'cur',
			transition: 0.3,
			imgInit: true, //第一次加载图片
			imgInitLazy: 4000, //第一次预加载图片延时
			enableTransX: false, //使用translateX(-n*100%)方式
			fun: function () {}
		};
		$.extend(this, this.opt, o);
		this.len = this.moveChild.length;
		this.min = this.min || { 'text': 100, 'img': 1 }[this.tp]; //min30是  andiord手Q划不动
		this.minp = this.minp || Math.max(this.min, 30); //最少30像素翻页  注意一定要继承min值  很多地方没有给minp赋值
		if (!this.viewDom) this.viewDom = $(window);
		if (this.len > 1) this.startEvent(); //只有一个的时候  不轮播  设置第一个的位置居中
		if (this.loadImg) this.image = this.moveDom.find('img');
		this.resize(this.step || this.moveChild.eq(0).width());
		if (this.autoTime) {
			var obj = this;
			setInterval(function () {
				if (!obj.holdAuto) {
					if (!obj.stopOnce) obj.stepMove(obj.index + 1);
					obj.stopOnce = false;
				}
			}, this.autoTime);
		}
	};
	$.extend(scroll.prototype, {
		resize: function (step) {
			this.step = step || this.step;
			var harf = (this.viewDom.width() - this.step) / 2;
			this.offset = this.loopScroll ? this.step - harf : harf;
			if (this.len == 1) this.offset = -harf;
			this.stepMove(this.index, true);
		},
		addChild: function (dom, tabDom) {
			if (!this.loopScroll) return;
			this.moveChild.eq(0).after(dom);
			this.len += 1;
			this.tab.eq(this.len - 2).after(tabDom);
			this.tab = this.tab.parent().children();

			if (this.len == 2) {
				this.moveChild = this.moveDom.children();
				this.startEvent();
			} else {
				this.stepMove(2);
			}
		},
		startEvent: function () {
			var obj = this,
			    mid = this.moveDom.get(0),
			    ael = function (dom) {
				dom.addEventListener("touchstart", obj, false);
				dom.addEventListener("touchmove", obj, false);
				dom.addEventListener("touchend", obj, false);
				dom.addEventListener("touchcancel", obj, false);
				dom.addEventListener("webkitTransitionEnd", obj, false);
			};
			ael(mid);

			this.tab.each(function (i, em) {
				$(em).attr('no', i + 1);
				$(em).click(function () {
					obj.stepMove($(this).attr('no'));
				});
			});

			if (this.loopScroll) {
				this.moveDom.append(this.moveChild.eq(0).clone());
				var last = this.moveChild.eq(this.len - 1).clone();
				this.moveDom.prepend(last);
			}
			for (var i = 0; i < this.touchDom2.length; i++) {
				ael(this.touchDom2[i]);
			};
		},
		// 默认事件处理函数，事件分发用
		handleEvent: function (e) {
			switch (e.type) {
				case "touchstart":
					this.sp = this.getPosition(e);
					this.holdAuto = true;
					this.stopOnce = true;
					break;
				case "touchmove":
					this.touchmove(e);
					break;
				case "touchend":
				case "touchcancel":
					this.move(e);
					this.holdAuto = false;
					break;
				case "webkitTransitionEnd":
					e.preventDefault();
					break;
			}
		},
		getPosition: function (e) {
			var touch = e.changedTouches ? e.changedTouches[0] : e;
			return {
				x: touch.pageX,
				y: touch.pageY
			};
		},
		touchmove: function (e) {
			var mp = this.getPosition(e),
			    x = mp.x - this.sp.x,
			    y = mp.y - this.sp.y;
			if (Math.abs(x) - Math.abs(y) > this.min) {
				//if (Math.abs(x) > Math.abs(y)) {
				e.preventDefault();
				var offset = x - this.step * (this.index - 1) - this.offset;
				this.moveDom.css({
					"-webkit-backface-visibility": "hidden",
					"-webkit-transform": this.enableTransX ? "translateX(" + (this.loopScroll ? this.index : this.index - 1) * -100 + "%)" : "translate3D(" + offset + "px,0,0)",
					"-webkit-transition": "0"
				});
			} else {
				if (!this.lockScrY) e.preventDefault();
			}
		},
		move: function (e) {
			var mp = this.getPosition(e),
			    x = mp.x - this.sp.x,
			    y = mp.y - this.sp.y;
			if (Math.abs(x) < Math.abs(y) || Math.abs(x) < this.minp) {
				this.stepMove(this.index); //状态还原
				return;
			}
			if (x > 0) {
				e.preventDefault();
				this.stepMove(this.index - 1);
			} else {
				e.preventDefault();
				this.stepMove(this.index + 1);
			}
		},
		loadImage: function (no) {
			var img = this.image;
			var setImg = function (i) {
				if (img[i] && $(img[i]).attr('back_src')) {
					img[i].src = $(img[i]).attr('back_src');
					$(img[i]).removeAttr('back_src');
				}
			};
			setImg(no);
			(function (n, flag, t) {
				setTimeout(function () {
					setImg(n - 1);setImg(n + 1);
				}, flag ? t : 0);
			})(no, this.imgInit, this.imgInitLazy); //用闭包是为了防止n被更改，导致某个图不会被加载
			this.imgInit = false;
		},
		stepMove: function (no, isSetOffsetIndex) {
			this.index = no > this.len ? this.len : no < 1 ? 1 : no;
			this.tab.removeClass(this.tabClass);
			this.tab.eq(this.index - 1).addClass(this.tabClass);
			var tran = -this.step * ((this.loopScroll ? no : this.index) - 1) - this.offset;
			this.moveDom.css({
				"-webkit-transform": this.enableTransX ? "translateX(" + (this.loopScroll ? no : this.index - 1) * -100 + "%)" : "translate3D(" + tran + "px,0,0)",
				"-webkit-transition": isSetOffsetIndex ? "0ms" : "all " + this.transition + "s ease"
			});
			if (this.loadImg) this.loadImage(this.index);
			this.fun(this.index); //还原位置的时候  也调用了这个  要小心
			if (this.loopScroll && !isSetOffsetIndex) {
				//循环到头的时候 从复制的位置切换到实际的位置
				var obj = this,
				    cindex = no;
				if (no <= 0) cindex = this.len;
				if (no > this.len) cindex = 1;
				if (cindex != no) setTimeout(function () {
					obj.stepMove(cindex, true);
				}, this.transition * 1000);
			}
		}
	});

	// 入口函数
	exports.init = function (opt) {
		return new scroll(opt);
	};
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*
 Desc:提供组件的基类，所有的公开方法，可以复用，也可以重载
 Date: 2015-08-16
 Revision: 6246 
 */
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var $ = __webpack_require__(2),
        fj = __webpack_require__(16),
        _cacheThisModule_,
        clickEvent = 'ontouchstart' in window ? 'tap' : 'click',
        baseObj;

    function getBaseCls() {

        var Class = function () {};
        Class.extend = function extend(props) {

            var prototype = new this();
            var _super = this.prototype;

            for (var name in props) {

                if (typeof props[name] == "function" && typeof _super[name] == "function") {
                    // 如果父类同名属性也是一个函数 ,重新定义用户的同名函数，把用户的函数包装起来
                    prototype[name] = function (super_fn, fn) {
                        return function () {
                            // 如果用户有自定义callSuper的话，暂存起来
                            var tmp = this.callSuper;
                            // callSuper即指向同名父类函数
                            this.callSuper = super_fn;
                            /*
                            callSuper即存在子类同名函数的上下文中
                            以this.callSuper()形式调用
                            */
                            var ret = fn.apply(this, arguments);

                            this.callSuper = tmp;
                            /*
                            如果用户没有自定义的callsuper方法，则delete
                            */
                            if (!this.callSuper) {
                                delete this.callSuper;
                            }
                            return ret;
                        };
                    }(_super[name], props[name]);
                } else {
                    // 如果是非同名属性或者方法
                    prototype[name] = props[name];
                }
            }
            // 基类
            function subClass() {}

            subClass.prototype = prototype;
            subClass.prototype.constructor = subClass;

            subClass.extend = extend;

            subClass.create = subClass.prototype.create = function () {
                /*
                注意在这里我们只是实例化一个构造函数
                而非最后返回的“实例”，
                可以理解这个实例目前只是一个“壳”
                需要init函数对这个“壳”填充属性和方法
                */
                var instance = new this();
                if (instance.init) {
                    /*
                    如果对init有定义的话
                    */
                    instance.init.apply(instance, arguments);
                }
                return instance;
            };

            return subClass;
        };
        return Class;
    }

    function getBaseObj() {
        console.log("getBaseObj.........");
        var events = {}; //JD.events;//事件分发，暂时可以不用
        var Class = getBaseCls();
        var base = Class.extend({
            //可以使用get来获取配置项bran
            get: function (key) {
                return this.__config[key];
            },
            //可以使用set来设置配置项
            set: function (key, value) {
                this.__config[key] = value;
            },
            EVENTS: {},
            template: '',
            //子类可以重写
            init: function (config) {
                var self = this;
                //存储配置项
                this.__config = config;
                //解析代理事件
                //delegateEveent
                this.delegateEveent();
                this.setUp();
            },
            //子类可以重写
            delegateEveent: function () {
                var eventObjs,
                    fn,
                    select,
                    type,
                    self = this,
                    events = this.EVENTS || {},
                    parentNode = this.get('parentNode') || $(document.body);
                for (select in events) {
                    eventObjs = events[select];
                    for (type in eventObjs) {
                        fn = eventObjs[type];
                        type = type || "click"; //fixed bug

                        parentNode.delegate(select, type, function (e) {
                            fn.call(null, self, e);
                        });
                    }
                }
            },

            //提供给子类覆盖实现
            setUp: function () {
                this.render();
            },
            refreshData: function (key, value) {

                var self = this,
                    data = self.get('__renderData');
                //更新对应的值
                data[key] = value;
                if (!this.template) return;
                //重新渲染
                var newHtmlNode = $(fj.formatJson(this.template, data)),

                //拿到存储的渲染后的节点
                currentNode = self.get('__currentNode');
                if (!currentNode) return;
                //替换内容
                currentNode.replaceWith(newHtmlNode);
                self.set('__currentNode', newHtmlNode);
            },
            //使用data来渲染模板并且append到parentNode下面
            render: function (data) {
                var self = this;
                //先存储起来渲染的data,方便后面refreshData获取使用
                self.set('__renderData', data);
                if (!this.template) return;
                //使用_parseTemplate解析渲染模板生成html
                //子类可以覆盖这个方法使用其他的模板引擎解析
                var html = fj.formatJson(this.template, data),
                    parentNode = this.get('parentNode') || $(document.body),
                    currentNode = $(html);
                //保存下来留待后面的区域刷新
                //存储起来，方便后面refreshData获取使用
                self.set('__currentNode', currentNode);
                parentNode.append(currentNode);
            },
            destory: function () {
                var eventObjs,
                    fn,
                    select,
                    type,
                    self = this,
                    events = self.EVENTS || {},
                    parentNode = self.get('parentNode');
                //删除渲染好的dom节点
                self.get('__currentNode').remove();
                //去掉绑定的代理事件
                for (select in events) {
                    eventObjs = events[select];
                    for (type in eventObjs) {
                        fn = eventObjs[type];
                        parentNode.undelegate(select, type, fn);
                    }
                }
            }
        });
        return base;
    }
    exports.init = function () {
        return baseObj || (baseObj = getBaseObj());
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 20 */,
/* 21 */,
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createApp;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_axios__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_axios___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_axios__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_axios__ = __webpack_require__(90);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_axios___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_vue_axios__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__App_vue__ = __webpack_require__(91);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__App_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__App_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__store__ = __webpack_require__(74);






// window.homev2_slogan1= [{"sData":[{"name":"精选","icon":"//img20.360buyimg.com/jdphoto/s30x30_jfs/t4651/4/3221804846/801/913523da/58f99bc0Ne6ea71af.png","startTime":"2017/04/26 00:00:00","endTime":"2017/12/01 00:00:00","description":"精选"},{"name":"省心","icon":"//img11.360buyimg.com/jdphoto/s30x30_jfs/t4876/153/2194271839/698/5322a437/58f99be5N12b1d5b0.png","startTime":"2017/04/12 15:22:00","endTime":"2017/10/01 00:00:00","description":"省心"},{"name":"安心","icon":"//img12.360buyimg.com/jdphoto/s30x30_jfs/t5149/127/154935089/792/d5c03450/58f99beeNc49e07a0.png","startTime":"2017/04/11 15:22:00","endTime":"2017/09/01 00:00:00","description":"安心"},{"name":"无忧","icon":"//img13.360buyimg.com/jdphoto/s30x30_jfs/t4540/314/3314351718/658/6ca95a26/58f99c04N78277626.png","startTime":"2017/04/27 15:00:00","endTime":"2017/12/01 00:00:00","description":"无忧"}],"isDisplay":"1"}] 

__WEBPACK_IMPORTED_MODULE_0_vue__["a" /* default */].use(__WEBPACK_IMPORTED_MODULE_2_vue_axios___default.a, __WEBPACK_IMPORTED_MODULE_1_axios___default.a);

function createApp() {
  const app = new __WEBPACK_IMPORTED_MODULE_0_vue__["a" /* default */]({
    store: __WEBPACK_IMPORTED_MODULE_4__store__["a" /* default */],
    render: createElement => {
      return createElement(__WEBPACK_IMPORTED_MODULE_3__App_vue___default.a);
    }
  });
  return { app, store: __WEBPACK_IMPORTED_MODULE_4__store__["a" /* default */] };
}

__WEBPACK_IMPORTED_MODULE_0_vue__["a" /* default */].filter('getImg', function (value, w, h) {
  // return JD.performance.getScaleImg(value, 400, 400).replace(/^http:/, '')
  // 设置图片尺寸
  return value.replace(/^http:/, '');
});

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(86)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(43),
  /* template */
  __webpack_require__(107),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */,
/* 37 */,
/* 38 */,
/* 39 */,
/* 40 */,
/* 41 */,
/* 42 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_homev2TopComponents_vue__ = __webpack_require__(98);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_homev2TopComponents_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__components_homev2TopComponents_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_homev2TopBanner_vue__ = __webpack_require__(97);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_homev2TopBanner_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__components_homev2TopBanner_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_homev2FixCompany_vue__ = __webpack_require__(96);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_homev2FixCompany_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__components_homev2FixCompany_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_homev2BotComponents_vue__ = __webpack_require__(94);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__components_homev2BotComponents_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__components_homev2BotComponents_vue__);
//
//
//
//
//
//
//
//
//






/* harmony default export */ __webpack_exports__["default"] = ({
  name: 'app',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    };
  },

  components: {
    "homev2-top-components": __WEBPACK_IMPORTED_MODULE_0__components_homev2TopComponents_vue___default.a,
    "homev2-banner-components": __WEBPACK_IMPORTED_MODULE_1__components_homev2TopBanner_vue___default.a,
    "homev2-fix-components": __WEBPACK_IMPORTED_MODULE_2__components_homev2FixCompany_vue___default.a,
    "homev2-bot-components": __WEBPACK_IMPORTED_MODULE_3__components_homev2BotComponents_vue___default.a
  },

  beforeCreate() {},

  created() {}
});

/***/ }),
/* 43 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_homev2DecoPro_vue__ = __webpack_require__(95);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__components_homev2DecoPro_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__components_homev2DecoPro_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_homeDongdong_vue__ = __webpack_require__(93);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__components_homeDongdong_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__components_homeDongdong_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_backToTop_vue__ = __webpack_require__(92);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components_backToTop_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__components_backToTop_vue__);
//
//
//
//
//
//
//
//
//





/* harmony default export */ __webpack_exports__["default"] = ({
  name: 'app',
  data() {
    return {
      msg: 'Welcome to Your Vue.js App'
    };
  },

  components: {
    "homev2-dec-pro": __WEBPACK_IMPORTED_MODULE_0__components_homev2DecoPro_vue___default.a,
    "home-dongdong": __WEBPACK_IMPORTED_MODULE_1__components_homeDongdong_vue___default.a,
    "back-to-top": __WEBPACK_IMPORTED_MODULE_2__components_backToTop_vue___default.a
  },

  beforeCreate() {},

  created() {}
});

/***/ }),
/* 44 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
	data() {
		return {
			display: 'none'
		};
	},

	created() {},

	mounted() {
		function throttle(func, threshold) {
			func.tId && clearTimeout(func.tId);
			func.tId = setTimeout(func, threshold || 200);
		}

		let winHeight = document.documentElement.clientHeight;
		let that = this;

		window.addEventListener('scroll', function () {
			throttle(function () {
				if (document.body.scrollTop > winHeight) {
					that.display = 'block';
				} else {
					that.display = 'none';
				}
			});
		});
	},

	methods: {
		backToTop: function () {
			window.scrollTo(0, 0);
		}
	}
});

/***/ }),
/* 45 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
  name: 'app',
  data() {
    return {
      nav: []
    };
  },
  created() {},

  mounted() {},

  methods: {},

  filters: {},

  events: {}
});

/***/ }),
/* 46 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
  name: "listData",
  data() {
    return {
      active: 0
    };
  },
  created() {},

  computed: {
    listData() {
      let data = this.$store.state.homev2Botnav;
      let href = "index.shtml";
      data.map((item, index) => {
        if (-1 != item.url.indexOf(href)) {
          this.$data.active = index;
        }
      });

      return this.$store.state.homev2Botnav;
    }
  },

  mounted() {},

  methods: {},

  filters: {
    formatName(imgsrc) {
      if ('' == imgsrc) {
        return "//jdc.jd.com/img/40x40?fontSize=10";
      }

      return imgsrc;
    }
  }
});

/***/ }),
/* 47 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_throttle__ = __webpack_require__(76);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



__webpack_require__(53);

/* harmony default export */ __webpack_exports__["default"] = ({
  data() {
    return {
      listData: {},
      fixnav: [],
      content: { nav_name: '', nav_desc: '', data: [] },
      active: 0
    };
  },

  created() {
    let self = this;
    this.$data.listData = window["homev2_fixnav"][0];
    this.$data.fixnav = window["homev2_fixnav"][0]["navdata"];
    if (sessionStorage.getItem("ppms_tab")) {
      let data = JSON.parse(sessionStorage.getItem("ppms_tab"));
      this.$data.active = data.active;
      self.$data.content = data.content;

      self.$nextTick(() => {
        JDK.lazyLoad.autoLoadImage({
          initSrcName: 'init-src',
          fadeIn: true
        });
      });
      return;
    }

    let serviceData = this.getData({
      "actid": self.$data.fixnav[self.active]["active_id"],
      "areaid": self.$data.fixnav[self.active]["erea_id"],
      callback: function (data) {
        self.$data.content = {
          nav_name: self.$data.fixnav[self.active]["nav_name"],
          nav_desc: self.$data.fixnav[self.active]["nav_desc"],
          data: data,
          ptag: self.$data.fixnav[self.active]
        };

        self.$nextTick(() => {
          JDK.lazyLoad.autoLoadImage({
            initSrcName: 'init-src'
          });
        });

        //存储选择信息
        sessionStorage.setItem("ppms_tab", JSON.stringify({ "active": self.$data.active, "content": self.$data.content, "dis": 0 }));
      }
    });
  },

  mounted() {
    this.initScroll();
    if (sessionStorage.getItem("ppms_tab")) {
      let data = JSON.parse(sessionStorage.getItem("ppms_tab"));
      $(".homev2_menu").find(".homev2_menu_navscroll").scrollLeft(data.dis);
    }
  },

  methods: {
    //actid, areaid, callback
    getData(opts) {
      var actid = opts.actid;
      var areaid = opts.areaid;
      var self = this;

      let actWfdataArguments = {
        "dataType": "MART",
        "preload": "true",
        "param": {
          "actid": actid,
          "areaid": areaid,
          "pc": 0,
          "callback": "homev2_fixnav_callback" + self.$data.active,
          "cacheKey": "homev2_fixnav_cache" + self.$data.active
        }
      };

      JDK.load.loadWfdata(actWfdataArguments, res => {
        if (res && 0 == res.errCode && res.data && res.data.list.length > 0) {
          opts.callback(res.data.list);
        } else {
          opts.callback([]);
        }
      });
    },

    selectTab(index) {
      let self = this;
      this.$data.active = index;

      let $nav = $(".homev2_menu");
      let $tar = $(".homev2_menu").find(".homev2_menu_navscroll");
      let $navItem = $(".homev2_menu").find(".homev2_menu_navscroll").find("a");
      let dis = 0;

      if ($nav.hasClass("fixed")) {
        window.scrollTo(0, $(".homev2_menu_position").offset().top);
      }

      if ($navItem.length * 80 - index * 80 <= $nav.width()) {
        dis = $navItem.length * 80 - $nav.width();
        $tar.scrollLeft(dis);
      } else {
        dis = index * 80;
        $tar.scrollLeft(dis);
      }

      this.getData({
        "actid": self.$data.fixnav[self.active]["active_id"],
        "areaid": self.$data.fixnav[self.active]["erea_id"],
        callback: function (data) {
          self.$data.content = {
            nav_name: self.$data.fixnav[self.active]["nav_name"],
            nav_desc: self.$data.fixnav[self.active]["nav_desc"],
            data: data
          };
          self.$nextTick(() => {
            JDK.lazyLoad.autoLoadImage({
              initSrcName: 'init-src'
            });
          });

          //存储选择信息
          sessionStorage.setItem("ppms_tab", JSON.stringify({ "active": self.$data.active, "content": self.$data.content, "dis": dis }));
        }
      });
    },

    initScroll() {
      function fn() {
        let $nav = $(".homev2_menu");
        let top = $nav[0].getBoundingClientRect().top;
        if (top <= 0) {
          $nav.addClass('fixed');
        } else {
          $nav.removeClass('fixed');
        }
      }

      window.addEventListener('scroll', function () {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__util_throttle__["a" /* default */])(fn);
      });
    }

  },

  filters: {
    initPrice(value) {
      if (!value || '' == value) {
        return value;
      }
      let price = value.toString().split(".");
      return price[0];
    },

    OnePointPrice(value) {
      if (!value || '' == value) {
        return value;
      }
      let price = value.toString().split(".");
      if (1 == price.length) {
        return 0;
      } else {
        return price[1].split("")[0];
      }
    },

    formatName(imgsrc) {
      if ('' == imgsrc) {
        return "//jdc.jd.com/img/30x30?fontSize=10";
      }

      return imgsrc;
    },

    addPtag(value) {
      if ('' == value) {
        return '';
      } else {
        return value + "&ptag=" + this.fixnav[this.active]["pro_rd"];
      }
    }
  }
});

/***/ }),
/* 48 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vuex__ = __webpack_require__(20);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["default"] = ({
  data() {
    return {
      company: [],
      totalCompany: [],
      prods: [],
      totalProds: [],
      hidden: false,
      isCompanyMore: false, //焦点更多
      companyDisNum: 6,
      isProdsMore: false, //焦点更多
      prodDisNum: 10
    };
  },

  created() {
    let self = this;
    let resultCompanyArr = this.companyArr;
    let resultProdsArr = this.prodsArr;
    self.$data.totalCompany = resultCompanyArr;

    if (self.$data.totalCompany.length > self.$data.companyDisNum) {
      self.$data.isCompanyMore = true;
    }

    self.$data.company = resultCompanyArr.slice(0).splice(0, self.$data.companyDisNum);

    self.$data.totalProds = resultProdsArr;

    if (self.$data.totalProds.length > self.$data.prodDisNum) {
      self.$data.isProdsMore = true;
    }

    self.$data.prods = resultProdsArr.slice(0).splice(0, self.$data.prodDisNum);

    if (3 == self.$data.prods.length) {
      self.$data.prods = resultProdsArr.slice(0).splice(0, 2);
    }
    if (5 == self.$data.prods.length) {
      self.$data.prods = resultProdsArr.slice(0).splice(0, 4);
    }
    if (0 == resultProdsArr.length && 0 == resultCompanyArr.length) {
      self.$data.hidden = true;
    }
  },

  computed: __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_vuex__["a" /* mapState */])({
    title: state => state.homev2Fixcompany[0].cateTit,
    english_title: state => state.homev2Fixcompany[0].engName,
    companyArr: state => state.companyArr,
    prodsArr: state => state.prodsArr,

    // 传字符串参数 'count' 等同于 `state => state.count`
    countAlias: 'companyArr',

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState(state) {
      return 2333;
    }
  }),

  mounted() {},

  methods: {},

  filters: {}
});

/***/ }),
/* 49 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//


/* harmony default export */ __webpack_exports__["default"] = ({
  name: 'banner',
  data() {
    return {
      hidden: false
    };
  },

  created() {},

  computed: {
    banner() {
      if (0 == this.$store.state.homev2Wishlist.length) {
        this.$data.hidden = true;
      }
      return this.$store.state.homev2Wishlist[0];
    }
  },

  mounted() {},

  methods: {},

  filters: {}
});

/***/ }),
/* 50 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

//computed 计算属性中返回某个状态,  mapState获取多个状态
/* harmony default export */ __webpack_exports__["default"] = ({
  name: 'listnav',
  data() {
    return {};
  },
  created() {},

  computed: {
    listnav() {
      return this.$store.state.homev2Slogan[0];
    }
  },

  mounted() {},

  methods: {},

  filters: {
    formatName(imgsrc) {
      if ('' == imgsrc) {
        return "//jdc.jd.com/img/30x30?fontSize=10";
      }

      return imgsrc;
    }
  }

});

/***/ }),
/* 51 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Async_vue__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Async_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__Async_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app__ = __webpack_require__(22);




// HMR interface
if (false) {
  // Capture hot update
  module.hot.accept();
}

//将服务端渲染时候的状态写入vuex
if (window.__INITIAL_STATE__) {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__app__["a" /* createApp */])().store.replaceState(window.__INITIAL_STATE__);
}

__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__app__["a" /* createApp */])().app.$mount('#app');

new __WEBPACK_IMPORTED_MODULE_0_vue__["a" /* default */]({
  render: h => h(__WEBPACK_IMPORTED_MODULE_1__Async_vue___default.a)
}).$mount('#app-async');

// service worker
if ("production" === 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}

/***/ }),
/* 52 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = log;
var con;

// 信息打印
function log() {
	function getEl(txt) {
		var p = document.createElement('p');
		p.style.cssText = '' + 'line-height:18px;' + '';
		p.innerHTML = txt;
		return p;
	}
	var arr = [];
	for (var i in arguments) {
		arr.push(arguments[i].toString());
	}
	con && con.appendChild(getEl(arr.join(',')));
}

function init() {
	con = document.createElement('div');
	con.style.cssText = '' + 'position: fixed;' + 'width: 260px;' + 'height: 120px;' + 'padding: 5px;' + 'background: #000;' + 'opacity: 0.6;' + 'left: 0;' + 'bottom: 60px;' + 'color: #fff;' + 'z-index: 9999;' + 'overflow-y: scroll' + '';
	document.body.appendChild(con);
}

if (/debugs=js/i.test(location.href)) {
	init();
}

/***/ }),
/* 53 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__lib_load_jsonp_js__ = __webpack_require__(67);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__lib_load_wfdatare_js__ = __webpack_require__(69);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__lib_load_static_js__ = __webpack_require__(68);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__lib_util_listener_js__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__resource_debug_js__ = __webpack_require__(52);
/**
* externals的方式挂载公用库，避免每次build
*
*/
window.$ = __webpack_require__(2);

/**
* 常用模块
* 
*/
var lazyLoad = __webpack_require__(55),
    wfdata = __webpack_require__(10),
    cache = __webpack_require__(5),
    loopScroll = __webpack_require__(18),
    cUI = __webpack_require__(9),
    cUtil = __webpack_require__(59),
    cLogin = __webpack_require__(8),
    cTime = __webpack_require__(58),
    wxpopmenu = __webpack_require__(63),
    sidenav = __webpack_require__(62),
    loadJs = __webpack_require__(1),
    addToCart = __webpack_require__(54),
    cookie = __webpack_require__(7);

// 双十二氛围
var fenwei = __webpack_require__(64);

// 加载组件





// debug


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
		loadJsonp: __WEBPACK_IMPORTED_MODULE_0__lib_load_jsonp_js__["a" /* loadJsonp */],
		loadWfdata: __WEBPACK_IMPORTED_MODULE_1__lib_load_wfdatare_js__["a" /* loadWfdata */],
		getJs: __WEBPACK_IMPORTED_MODULE_2__lib_load_static_js__["a" /* getJs */],
		triggerLoad: __WEBPACK_IMPORTED_MODULE_2__lib_load_static_js__["b" /* triggerLoad */],
		onLoad: __WEBPACK_IMPORTED_MODULE_2__lib_load_static_js__["c" /* onLoad */]
	},
	listener: __WEBPACK_IMPORTED_MODULE_3__lib_util_listener_js__["a" /* listener */],
	debug: {
		log: __WEBPACK_IMPORTED_MODULE_4__resource_debug_js__["a" /* log */]
	},
	// 氛围
	fenwei,
	addToCart,
	cookie
};

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var cLs = __webpack_require__(1),
        cCk = __webpack_require__(7),
        _cacheThisModule_ = '',
        ckey = 'cartNum';

    function $jdAddCart(skuId, opt) {
        var addrId = localStorage.getItem('jdAddrId') || $getCookie('jdAddrId') || localStorage.getItem('jdLOCAddrId') || $getCookie('jdLOCAddrId') || '1_72_4139';
        addrId = addrId.split('_');
        var param = ['http://wq.jd.com/deal/mshopcart/addcmdy?callback=addCartCB&scene=2', 'type=0', 'commlist=' + [skuId, '', 1, skuId, '1,0,0'].join(','), 'locationid=' + [addrId.slice(0, 3).join('-')], 't=' + Math.random()],
            dAlert = typeof opt.dAlert === 'function' ? opt.dAlert : function (msg) {
            return function () {
                alert(msg);
            };
        },
            //显示提示的高阶函数
        emptyFunc = function () {},
            goLogin = typeof opt.goLogin === 'function' ? opt.goLogin : dAlert('未登录'),
            success = typeof opt.success === 'function' ? opt.success : emptyFunc,
            fail = typeof opt.fail === 'function' ? opt.fail : emptyFunc;
        window.addCartCB = function (json, loginFun) {
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
        };
        cLs.loadScript(param.join('&'));
    }

    function $jdGetCart() {
        return localStorage.getItem('cartNum') * 1 || cCk.get('cartNum') * 1 || 0;
    }

    function $jdSetCart(num) {
        if (num) {
            cCk.set('cartNum', num, 999999, "/", 'wanggou.com');
            localStorage.setItem('cartNum', num);
        }
    }

    exports.add = $jdAddCart;
    exports.set = $jdSetCart;
    exports.get = $jdGetCart;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_;
    var $ = __webpack_require__(2);
    var g = {};
    var opt = {
        scrollOffsetH: 100, //加载偏移量
        initSrcName: 'init-src', //加载属性名
        container: document.body, //滚动加载的容器（id或者dom）
        fadeIn: false, //是否渐显(针对图片的过渡渐显动画，图片的默认css属性为opacity:0;transition:opacity 0.3 linear,找构建同学实现)
        zoom: 1, //页面的缩放比
        skip_invisible: false, //过滤隐藏的图片，默认不过滤隐藏图片,
        afterImgLoaded: null //当前图片加载完成后的回调
    };
    g.autoLoadImage = function (option) {

        if (option) {
            for (var key in option) {
                opt[key] = option[key];
            }
        }
        function init() {
            var cont = typeof opt.container == "string" ? $("#" + opt.container) : $(opt.container);
            var objImages = $("img[" + opt.initSrcName + "]", cont);
            objImages.each(function (i) {
                var dom = $(this);
                images_data.cache.push({
                    url: dom.attr(opt.initSrcName),
                    obj: dom,
                    top: (opt.skip_invisible && isElementHidden(dom) ? Infinity : dom[0].getBoundingClientRect().top) * opt.zoom + window.pageYOffset //是否要跳过隐藏的图片
                });
            });
            images_data.num = images_data.cache.length;
        }
        var images_data = {
            // 当前可视区域的高度
            viewHeight: $(window).height(),
            // 定时器
            ptr: "",
            // 所有图片
            cache: [],
            // 图片数量
            num: 0
        };
        init();
        if (images_data.ptr) {
            clearInterval(images_data.ptr);
        }
        images_data.ptr = setInterval(doScroll, 100);
        function doScroll() {
            // 滚动条的高度
            var scrollHeight = window.pageYOffset,

            // 已经卷起的高度+可视区域高度，即当前显示的元素的高度
            visibleHeight = images_data.viewHeight * 2 + opt.scrollOffsetH + scrollHeight;
            $.each(images_data.cache, function (i, data) {
                var element = data.obj,
                    loaded = element.attr("loaded");
                // 图片在后面两屏范围内，并且未被加载过
                if (visibleHeight > data.top && !loaded) {
                    // 加载图片
                    element.attr("lazyloadimg", 'true');
                    var _img = document.createElement('img');
                    _img.onload = function () {
                        element.attr("src", data.url);
                        opt.fadeIn && element.css("transition", "opacity 0.5s ease");
                        element.css("opacity", "1");
                        opt.afterImgLoaded && opt.afterImgLoaded(element);
                    };
                    _img.onerror = function () {
                        element.attr("src", data.url);
                        opt.fadeIn && element.css("transition", "opacity 0.5s ease");
                        element.css("opacity", "1");
                        opt.afterImgLoaded && opt.afterImgLoaded(element);
                    };
                    _img.src = data.url;
                    element.removeAttr(opt.initSrcName);
                    element.attr("loaded", images_data.num);
                    images_data.num--;
                }
            });
            // 没有图片加载，清除定时器
            if (images_data.num == 0) {
                clearInterval(images_data.ptr);
                images_data.ptr = null;
            }
            //回调方法，比如利用这个来判断是否需要翻页
            opt.callback && opt.callback();
        }
    };
    g.set = function (option) {
        if (option) {
            for (var key in option) {
                opt[key] = option[key];
            }
        }
    };
    //判断当前节点是否是隐藏的
    function isElementHidden(ele) {
        var _relate = $(ele).parents().concat();
        _relate.unshift($(ele)[0]);
        return _relate.some(function (e) {
            if (getComputedStyle(e, '').getPropertyValue("display") == "none") {
                //元素隐藏了
                return true;
            }
        });
    }
    function init() {
        var style = document.createElement('style');
        style.innerHTML = '' + 'img[init-src] { opacity:0; }' + 'img[lazyloadimg] { opacity:0; }' + '';
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    init();

    module.exports = g;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Md5模块
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
  var _cacheThisModule_;
  exports.getHash = getHash;

  var rotateLeft = function (lValue, iShiftBits) {
    return lValue << iShiftBits | lValue >>> 32 - iShiftBits;
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  };

  var F = function (x, y, z) {
    return x & y | ~x & z;
  };

  var G = function (x, y, z) {
    return x & z | y & ~z;
  };

  var H = function (x, y, z) {
    return x ^ y ^ z;
  };

  var I = function (x, y, z) {
    return y ^ (x | ~z);
  };

  var FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWordsTempOne = lMessageLength + 8;
    var lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - lNumberOfWordsTempOne % 64) / 64;
    var lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - lByteCount % 4) / 4;
      lBytePosition = lByteCount % 4 * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | string.charCodeAt(lByteCount) << lBytePosition;
      lByteCount++;
    }
    lWordCount = (lByteCount - lByteCount % 4) / 4;
    lBytePosition = lByteCount % 4 * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | 0x80 << lBytePosition;
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var WordToHexValue = "",
        WordToHexValueTemp = "",
        lByte,
        lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = lValue >>> lCount * 8 & 255;
      WordToHexValueTemp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2);
    }
    return WordToHexValue;
  };

  var uTF8Encode = function (string) {
    string = string.replace(/\x0d\x0a/g, "\x0a");
    var output = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        output += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        output += String.fromCharCode(c >> 6 | 192);
        output += String.fromCharCode(c & 63 | 128);
      } else {
        output += String.fromCharCode(c >> 12 | 224);
        output += String.fromCharCode(c >> 6 & 63 | 128);
        output += String.fromCharCode(c & 63 | 128);
      }
    }
    return output;
  };

  function getHash(string) {

    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7,
        S12 = 12,
        S13 = 17,
        S14 = 22;
    var S21 = 5,
        S22 = 9,
        S23 = 14,
        S24 = 20;
    var S31 = 4,
        S32 = 11,
        S33 = 16,
        S34 = 23;
    var S41 = 6,
        S42 = 10,
        S43 = 15,
        S44 = 21;
    string = uTF8Encode(string);
    x = convertToWordArray(string);
    a = 0x67452301;b = 0xEFCDAB89;c = 0x98BADCFE;d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
      AA = a;BB = b;CC = c;DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
    var tempValue = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    return tempValue.toLowerCase();
  }
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	var _cacheThisModule_;
	var isInQQ = /qq\/([\d\.]+)*/.test(navigator.userAgent),
	    supportDataApi = isInQQ && window.mqq && mqq.compare("4.6") >= 0,
	    cfg = {
		prefix: "$lc_", //缓存前缀
		expire: 1440, //默认有效期1天，分钟
		callId: 1, //手Q api需要的参数，暂时写死
		path: "wanggouH5data" //手Q api需要的参数，暂时写死
	};
	/*  手机qq返回给callback的参数格式示例:{"ret":0,"response":{"data":"20140811","callid":"811"}}
 ret=0成功读写数据,写入、删除时没有response.data*/
	var _cache = __webpack_require__(5);

	function writeH5Data(key, data, callback, exp) {
		try {
			var now = new Date(),
			    myKey = cfg.prefix + key,
			    callback = callback ? callback : empty(),
			    myData = JsonToStr({
				value: data,
				expire: now.setMinutes(now.getMinutes() + (exp || cfg.expire))
			});
			if (supportDataApi) {
				mqq.data.writeH5Data({
					callid: cfg.callId,
					path: cfg.path,
					key: myKey,
					data: myData
				}, function (res) {
					callback(res.ret == 0);
				});
			} else {
				_cache.session.setItem(myKey, myData, (exp || cfg.expire) * 60, function (ret) {
					if (ret == 0) {
						callback(true);
					} else {
						callback(false);
					}
				});
				//sessionStorage.setItem(myKey,myData);
				//callback(true);
			}
		} catch (e) {
			callback(false);
		}
	};
	function readH5Data(key, callback) {
		try {
			var myKey = cfg.prefix + key;
			callback = callback ? callback : empty();
			if (supportDataApi) {
				mqq.data.readH5Data({
					callid: cfg.callId,
					path: cfg.path,
					key: myKey
				}, function (res) {
					if (res.ret != 0) {
						callback(null, false);
						return;
					}
					var d = StrToJson(res.response.data),
					    now = new Date();
					if (!d) {
						callback(null, false);
						return;
					}
					if (d.expire > now.getTime()) {
						callback(d.value, true);
					} else {
						mqq.data.deleteH5Data({
							callid: cfg.callId,
							path: cfg.path,
							key: myKey
						});
						callback(null, false);
					}
				});
			} else {
				var d = getStorageObj(myKey);
				callback(d ? d.value : null, d ? true : false);
			}
		} catch (e) {
			callback(null, false);
		}
	};

	function deleteH5Data(key, callback) {
		try {
			var myKey = cfg.prefix + key;
			callback = callback ? callback : empty();
			if (supportDataApi) {
				mqq.data.deleteH5Data({
					callid: cfg.callId,
					path: cfg.path,
					key: myKey
				}, function (res) {
					callback(res.ret == 0);
				});
			} else {
				//sessionStorage.removeItem(key);
				_cache.session.removeItem(key);
				callback(true);
			}
		} catch (e) {
			callback(false);
		}
	};

	function JsonToStr(o) {
		if (o == undefined) {
			return "";
		}
		if (JSON && JSON.stringify) {
			//ie8以上都支持
			return JSON.stringify(o);
		} else {
			var r = [];
			if (typeof o == "string") return "\"" + o.replace(/([\"\\])/g, "\\$1").replace(/(\n)/g, "\\n").replace(/(\r)/g, "\\r").replace(/(\t)/g, "\\t") + "\"";
			if (typeof o == "object") {
				if (!o.sort) {
					for (var i in o) r.push("\"" + i + "\":" + JsonToStr(o[i]));
					if (!!document.all && !/^\n?function\s*toString\(\)\s*\{\n?\s*\[native code\]\n?\s*\}\n?\s*$/.test(o.toString)) {
						r.push("toString:" + o.toString.toString());
					}
					r = "{" + r.join() + "}";
				} else {
					for (var i = 0; i < o.length; i++) r.push(JsonToStr(o[i]));
					r = "[" + r.join() + "]";
				}
				return r;
			}
			return o.toString().replace(/\"\:/g, '":""');
		}
	}

	function StrToJson(str) {
		try {
			if (JSON && JSON.parse) {
				return JSON.parse(str);
			} else {
				return eval('(' + str + ')');
			}
		} catch (e) {
			return null;
		}
	}

	//获取storage对象
	function getStorageObj(name) {
		var storageObj,
		    timeNow = new Date();
		//storageObj =  StrToJson(sessionStorage.getItem(name));
		storageObj = StrToJson(_cache.session.getItem(name));
		if (storageObj && timeNow.getTime() < storageObj.expire) {
			return storageObj;
		} else {
			//sessionStorage.removeItem(name);
			_cache.session.removeItem(name);
			return null;
		}
	}

	function empty() {
		return function () {};
	}

	return {
		writeH5Data: writeH5Data,
		readH5Data: readH5Data,
		deleteH5Data: deleteH5Data
	};
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	var __cacheThisModule__;
	var cLs = __webpack_require__(1),
	    servertime = 0,
	    //单位 : 毫秒
	serverOffsetTime = 0,
	    //服务器时间 - 本地时间
	heart = 0,
	    heartEvents = [],
	    callback,

	// 获取服务端时间的接口
	timeCgi = '//wq.jd.com/mcoss/servertime/getservertime?callback=GTSTime';

	function heartBeat() {
		if (!heart) {
			heart = setInterval(function () {
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
		return heartEvents.some(function (v) {
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
					} else if (byGroup && new RegExp(key).test(v.evtid.toString())) {
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
	function floorHour(d) {
		return new Date(getYMD(d) + ' ' + d.getHours() + ':00:00').getTime() / 1000;
	}

	~function init() {
		serverOffsetTime = window.sessionStorage.getItem("JD_serverOffsetTime") || false;
		if (serverOffsetTime) {
			//有缓存时间差
			serverOffsetTime = parseInt(serverOffsetTime, 10);
			startHeartBeat(new Date().getTime() + serverOffsetTime);
			typeof callback === 'function' && callback(servertime);
		} else {
			//没有缓存，接口拉取
			var requestTime = new Date().getTime(); //请求时时间
			window['GTSTime'] = function (json) {
				var responseTime = new Date().getTime(); //请求返回时时间
				if (json.errCode === '0') {
					var _serverTime = new Date(json.data[0].serverTime).getTime() + parseInt((responseTime - requestTime) / 2, 10);
					serverOffsetTime = _serverTime - responseTime;
					window.sessionStorage.setItem("JD_serverOffsetTime", serverOffsetTime);
					startHeartBeat(_serverTime);
					typeof callback === 'function' && callback(servertime);
				} else {
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				}
			};
			cLs.loadScript({
				url: timeCgi + '&t=' + Math.random(),
				charset: 'utf-8',
				onError: function () {
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				},
				onTimeout: function () {
					startHeartBeat(new Date().getTime());
					typeof callback === 'function' && callback(servertime);
				}
			});
		}
	}();

	return {
		getServerTime: function () {
			if (servertime == 0) {
				return new Date().getTime();
			} else {
				return servertime;
			}
		},
		getServerOffsetTime: function () {
			return serverOffsetTime;
		},
		listen: function (evt) {
			heartEvents.push(evt);
		},
		done: function (func) {
			if (servertime) {
				setTimeout(function () {
					func(servertime);
				}, 0);
			} else {
				callback = func;
			}
		},
		getYMD: getYMD,
		floorHour: floorHour,
		start: startHeartBeat,
		has: hasHeartBeat,
		remove: removeHeartBeat
	};
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	var _cacheThisModule_;
	var $ = __webpack_require__(2),
	    ls = __webpack_require__(1);

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
		} else if (checkType === 'partup') {
			if (itemTop < pageTop) {
				return true;
			}
		} else if (checkType === 'partdown') {
			if (itemBottom > pageBottom) {
				return true;
			}
		} else {
			if (itemTop < pageBottom && itemTop > pageTop || itemBottom < pageBottom && itemBottom > pageTop) {
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
		    ctx,
		    args,
		    exec = function () {
			last = now();
			f.apply(ctx, args);
		};
		return function () {
			cur = now();
			ctx = this, args = arguments;
			if (cur - last > t) {
				exec();
			}
		};
	}

	function delegateMove() {
		var sy,
		    direction,
		    delegateFunc = [];
		this.listen = function (func) {
			if (typeof func === 'function') {
				delegateFunc.push(func);
			}
		};
		this.remove = function (func) {
			if (typeof func !== 'function') return;
			for (var i = 0, l = delegateFunc.length; i < l; i++) {
				if (func === delegateFunc[i]) {
					delegateFunc.splice(i, 1);
				}
			}
		};
		document.addEventListener('touchstart', function (e) {
			var touches = e.touches[0];
			sy = touches.clientY;
		});
		document.addEventListener('touchmove', function (e) {
			var touches = e.changedTouches[0],
			    endTy = touches.clientY;
			if (endTy - sy > 0) {
				direction = 'up';
			} else if (sy - endTy > 0) {
				direction = 'down';
			}
		});
		document.addEventListener('touchend', delay(function () {
			fireFunc(direction);
		}, 80));
		document.addEventListener('scroll', delay(function () {
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
		return r.replace(re, function (v) {
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
		};
		for (var k in option) {
			opt[k] = option[k];
		}
		if (opt.res.length > 0) {
			//设置itil上报空回调，减少badjs
			window.reportWebInfo = function (json) {};
			//页面加载5s后上报
			window.setTimeout(function () {
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
	function setQuery(json, url) {
		var hash = url ? url.match(/#.*/) && url.match(/#.*/)[0] || "" : location.hash,
		    search = url ? url.replace(/#.*/, "").match(/\?.*/) && url.replace(/#.*/, "").match(/\?.*/)[0] || "" : location.search,
		    path = url ? url.replace(/#.*/, "").replace(/\?.*/, "") : location.protocol + "//" + location.host + location.pathname;
		for (var i in json) {
			var query = i + "=" + json[i],
			    oldValue = getQuery(i, search);
			if (oldValue) {
				search = search.replace(i + "=" + oldValue, i + "=" + json[i]);
			} else {
				search = search.length > 0 ? search + "&" + query : "?" + query;
			}
		}
		return path + search + hash;
	}

	/**
  * 读取COOKIE
  */
	function getCookie(name) {
		var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
		    val = document.cookie.match(reg);
		return val ? val[2] ? unescape(val[2]).replace(/(^")|("$)/g, "") : "" : null;
	}
	/**
  * 写入COOKIES
  */
	function setCookie(name, value, expires, path, domain, secure) {
		var exp = new Date(),
		    expires = arguments[2] || null,
		    path = arguments[3] || "/",
		    domain = arguments[4] || null,
		    secure = arguments[5] || false;
		expires ? exp.setMinutes(exp.getMinutes() + parseInt(expires)) : "";
		document.cookie = name + '=' + escape(value) + (expires ? ';expires=' + exp.toGMTString() : '') + (path ? ';path=' + path : '') + (domain ? ';domain=' + domain : '') + (secure ? ';secure' : '');
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

	function htmlDecode(str) {
		return typeof str != "string" ? "" : str.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
	}

	function htmlEncode(str) {
		return typeof str != "string" ? "" : str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;").replace(/ /g, "&nbsp;");
	}

	function strSubGB(str, start, len, flag) {
		//进行字符长度验证，如果超过长度则返回截断后的字符串
		var total = strLenGB(str);
		if (total > len - start) {
			var flag = flag || "";
			var strTemp = str.replace(/[\u00FF-\uFFFF]/g, "@-").substr(start, len);
			var subLen = strTemp.match(/@-/g) ? strTemp.match(/@-/g).length : 0;
			return str.substring(0, len - subLen) + flag;
		}
		return str;
	}
	function strLenGB(v) {
		//一个中文按照两个字节算，返回长度
		return v.replace(/[\u00FF-\uFFFF]/g, "  ").length;
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
		} catch (e) {
			return false;
		}
	}

	//判断是不是手机QQ浏览器
	function isSQ() {
		var cid = getCookie('cid');
		if (cid == 2) return true;
		if (/qq\/([\d\.]+)*/i.test(navigator.userAgent)) {
			return true;
		}
		return false;
	}
	//判断是不是手机微信浏览器
	function isWX() {
		var cid = getCookie('cid');
		if (cid == 1) return true;
		if (/MicroMessenger/i.test(navigator.userAgent)) {
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
	function loginLocation(url) {
		if (getCookie('wg_uin') && getCookie('wg_skey')) {
			//简单判断登陆
			location.href = url;
		} else {
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
		url = url.replace(/？/g, "?"); //异常处理
		var reg = /ptag[=,]\d+\.\d+\.\d+/i,
		    //有两种情况，PTAG=20219.28.10和PTAG,20219.28.10（网购搜索特有）
		hasQuery = /\?/.test(url);
		hasAnchor = url.indexOf('#') > -1;
		if (reg.test(url)) {
			//已经有rd的情况,则进行替换
			url = url.replace(reg, "PTAG=" + rd);
		} else {
			//没有rd，则进行追加
			url = hasAnchor ? url.replace("#", (hasQuery ? "&" : "?") + "PTAG=" + rd + "#") : url + (hasQuery ? "&" : "?") + "PTAG=" + rd;
		}
		return url;
	}

	//移除数组中重复的值
	function arrayUniq(arr) {
		var returnArr = [];
		for (var i = 0, len = arr.length; i < len; i++) {
			("," + returnArr + ",").indexOf("," + arr[i] + ",") < 0 ? returnArr.push(arr[i]) : '';
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
	function once(fn) {
		var run = false;
		return function () {
			!run && (run = !run, typeof fn === 'function' && fn.call());
		};
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
					};
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
		itilReport: itilReport,
		getQuery: getQuery,
		setQuery: setQuery,
		getCookie: getCookie,
		setCookie: setCookie,
		getHash: getHash,
		htmlDecode: htmlDecode,
		htmlEncode: htmlEncode,
		strSubGB: strSubGB,
		strLenGB: strLenGB,
		canWxPay: canWxPay,
		isSupportStorage: isSupportStorage,
		isSQ: isSQ,
		isWX: isWX,
		saveStorage: saveStorage,
		getStorage: getStorage,
		removeStorage: removeStorage,
		preventPageScroll: preventPageScroll,
		loginLocation: loginLocation,
		login: login,
		addRd: addRd,
		arrayUniq: arrayUniq,
		once: once,
		getMyLocation: getMyLocation
	};
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*
描述：微信和手Q抽奖共用接口
*/
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
    var _cacheThisModule_;
    var base = __webpack_require__(19),
        ldJs = __webpack_require__(1),
        login = __webpack_require__(8),
        ui = __webpack_require__(9),
        drawDom = "",
        clickEvent = 'ontouchstart' in window ? 'tap' : 'click';
    var msg = {
        0: '领取成功，稍后前往个人中心查看。',
        10001: '您已经领取过优惠券。',
        10002: '您今天已经领取过优惠券，明天再来！',
        10010: '您已达中奖上限',
        10003: '很遗憾，运气不好，没有领到优惠券。',
        10004: '很遗憾，优惠券已经被领完。',
        10009: '很遗憾，今日优惠券已经被领完',
        10005: '活动不存在。',
        10006: '领券活动还未开始。',
        10007: '领券活动已经结束。',
        10008: '很遗憾，优惠券已经被领完', //黑名单用户
        10000: '当前排队人数太多，请稍后再试' //系统异常提示语
    };

    function getClsDraw(clickEvent) {
        var baseCls = base.init();
        var objEvent = {};
        objEvent[clickEvent] = function () {
            var fun = function (self, e) {

                //单向绑定，修改数据直接更新对应模板
                //console.log(e.target);

                drawDom = $(e.target).closest("[data-drawkey]");
                var orderid = drawDom.attr("data-drawkey");
                if (orderid) {
                    self.set("activeName", orderid.split('~')[0]);
                    self.set("drawLevel", orderid.split('~')[1]);
                    self.set("drawNum", drawDom.attr("data-drawnum"));
                    self.set("ignoreLogin", false);

                    self.setDraw(null);
                };
                if (self.get("clickcb")) {
                    return self.get("clickcb")(self, e);
                }
                return false;
            };
            return fun;
        }();

        var getDraw = baseCls.extend({

            EVENTS: {
                //选择器字符串，支持所有zepto风格的选择器
                '[data-drawkey]': objEvent
            },

            getDrawNumber: function (activeName, success, fail) {

                var curObj = this,
                    queryNum = "//wq.jd.com/active/queryprizesstatus?active=",
                    getNumSuccess = success || this.get("getNumSuccess"),
                    getNumFail = fail || this.get("getNumFail");

                window.QueryPrizesStatus = function (data) {

                    if (data.retcode == 0) {

                        getNumSuccess && getNumSuccess(data);

                        return;
                    } else {

                        getNumFail && getNumFail(data);

                        return;
                    }
                };

                ldJs.loadScript({
                    url: queryNum + activeName,
                    charset: 'utf-8'
                });
            },

            checkDrawState: function (activeName, sucess, fail) {

                var curObj = this,
                    bingoUrl = "//wq.jd.com/active/querybingo?active=",
                    queryDrawSuccess = sucess || curObj.get("queryDrawSuccess"),
                    queryFail = fail || curObj.get("queryFail");
                callBinggo(activeName);

                function callBinggo(activeName) {
                    window.BingoCallBack = function (data) {

                        if (data.errorCode == 0) {

                            if (sucess) {
                                sucess(data);
                            }
                            return;
                        } else {
                            //不处理强制登录的情况
                            if (fail) {
                                fail(data);
                            }
                            return;
                        }
                    };

                    ldJs.loadScript({
                        url: bingoUrl + activeName,
                        charset: 'utf-8'
                    });
                }
            },

            setDraw: function (obj, drawLevel, activeName, callbackObj) {
                // callbackObj：本次领券的单独配置，isShowInfo
                var curObj = this,
                    activeNames = activeName || this.get("activeName"),
                    success = this.get("success"),
                    drawLevel = drawLevel || this.get("drawLevel"),
                    drawOver = this.get("drawOver"),
                    drawGetted = this.get("drawGetted"),
                    thisMsg = this.get("infos") || msg,
                    fail = this.get("fail"),
                    preLogin = this.get("preLogin"),
                    ignoreLogin = this.get("ignoreLogin"),
                    selfcallback = this.get("selfcallback"),
                    drawNum = this.get("drawNum"),
                    drawUrl = "//wq.jd.com/active/active_draw?",
                    device = JD.device.scene === "weixin",
                    extType = device === true ? "hj:w" : "hj:q",
                    isShowInfo = this.get('isShowInfo');
                obj = obj || drawDom;
                //console.log('请求之前： ', activeNames, drawLevel);
                if (!activeNames && !drawLevel) {
                    return;
                }
                //var _drawCBName = 'ActiveLotteryCallBack';
                var _drawCBName = 'couponDrawCB_' + activeNames.replace(/\W/g, '') + drawLevel; // ActiveLotteryCallBack
                window[_drawCBName] = function (json) {
                    var quanKey = activeNames + "~" + drawLevel;
                    //console.log('回调： ', quanKey);
                    if (json.ret == 2) {
                        JD.store.setValue("quanKey", quanKey);
                        JD.store.getValue("loginCount", function (a, b) {
                            JD.store.setValue("loginCount", b ? b + 1 : 0);
                        });
                        obj && obj.attr("drawFlag", "yes");
                        preLogin && preLogin(quanKey);
                        !ignoreLogin && login.login();
                        return;
                    }
                    JD.store.del("quanKey");
                    var retCode = json.ret;
                    switch (retCode) {
                        case 0:
                            code = 0;
                            success && success(json, obj, code, quanKey, drawNum);
                            break; //领取成功
                        case 3:
                            code = 10010;
                            fail && fail(json, obj, quanKey, code);
                            break; //达活动中奖上限
                        case 10:
                            code = 10001;
                            drawGetted && drawGetted(json, obj, code, quanKey, drawNum);
                            break; //已经领取过了
                        case 4:
                            code = 10002;
                            drawGetted && drawGetted(json, obj, code, quanKey, drawNum);
                            break; //今天已经领取过了
                        case 5:
                        case 6:
                            code = 10009;
                            drawOver && drawOver(json, obj, code, quanKey, drawNum);
                            break; //今日优惠券已经被领完
                        case 8:
                            code = 10003;
                            break; //未领取到优惠券（未中奖）
                        case 7:
                        case 11:
                            code = 10004;
                            drawOver && drawOver(json, obj, code, quanKey, drawNum);
                            break; //已经被领完
                        case 101:
                            code = 10005;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动不存在
                        case 102:
                        case 103:
                            code = 10006;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动未开始
                        case 104:
                            code = 10007;
                            fail && fail(json, obj, quanKey, code);
                            break; //活动已经结束
                        case 147:
                        case 151:
                            code = 10008;
                            fail && fail(json, obj, quanKey, code);
                            break; //黑名单用户
                        default:
                            code = retCode;
                            fail && fail(json, obj, quanKey, code);
                    }
                    if (selfcallback) {
                        selfcallback(json, obj, code, quanKey, drawNum);
                        return; // 弹窗也自己处理
                    }
                    if (callbackObj && callbackObj.isShowInfo === false || !callbackObj && isShowInfo === false) {
                        return;
                    }
                    //要判断中奖等级是否大于0
                    if (code == 0) {
                        code = json.bingo && json.bingo.bingolevel > 0 ? code : 10000;
                    }
                    var awardcode = json.award && json.award.awardcode ? json.award.awardcode : "优惠券";
                    var info = (thisMsg[code] || thisMsg[10000]).replace(/{#name#}/g, awardcode);
                    ui.info({
                        msg: info,
                        icon: code == 0 ? 'success' : 'info'
                    });
                };

                // ldJs.loadScript({
                //     url: drawUrl + "ext=" + extType + "&active=" + activeNames +
                //     "&level=" + drawLevel + "&callback=ActiveLotteryCallBack" + "&t=" + new Date().getTime(),
                //     charset: 'utf-8'
                // });


                /* */

                var promotejs = JD.cookie.get("promotejs"); //写入的cookie
                if (promotejs) {
                    ldJs.loadScript({
                        url: drawUrl + "ext=" + extType + "&active=" + activeNames + "&level=" + drawLevel + "&callback=" + _drawCBName + "&t=" + new Date().getTime(),
                        charset: 'utf-8'
                    });
                } else {
                    window.GetFunction = function (res) {
                        if (res.errorCode == 2) {
                            var quanKey = activeNames + "~" + drawLevel;
                            JD.store.setValue("quanKey", quanKey);
                            JD.store.getValue("loginCount", function (a, b) {
                                JD.store.setValue("loginCount", b ? b + 1 : 0);
                            });
                            obj && obj.attr("drawFlag", "yes");
                            login.login();
                            return;
                        }
                        if (res.errorCode == 0) {
                            res.function(res.TOKEN);
                        }
                        ldJs.loadScript({
                            url: drawUrl + "ext=" + extType + "&active=" + activeNames + "&level=" + drawLevel + "&callback=" + _drawCBName + "&t=" + new Date().getTime(),
                            charset: 'utf-8'
                        });
                    };
                    ldJs.loadScript('//wq.jd.com/active/getfunction');
                }

                /* */
            }

        });
        return getDraw;
    }
    /*
    options:
          parentNode：可选，不选默认是document
          activeName:必选， 一般为字符串
          drawLevel : 必传 ，一般为数字，比如1、2等数字,不同的数字代表不同的券的面值，比如1代表 满1000-50
          success: 可选，领取成功的回调函数 , 设置成功的回调函数的目的是在成功之后对对前端的一些操作，比如保存已领取的状态等
          preLogin:登录之前的处理， 可以保存一些状态
          fail: 可选，领券失败的回调函数
          drawOver: 可选，券已经被领完的回调函数
          drawGetted: 可选，已经领取成功的回调函数
          infos:可选 , 传递特定的文案 ,格式如下，并且都是可选的，不传递的话则使用默认的文案
           {0: '领取成功，稍后前往个人中心查看。',
            10001: '您已经领取过优惠券。',
            10002: '您今天已经领取过优惠券，明天再来！',
            10003: '很遗憾，运气不好，没有领到优惠券。',
            10004: '很遗憾，优惠券已经被领完。',
            10009: '很遗憾，今日优惠券已经被领完',
            10005: '活动不存在。',
            10006: '领券活动还未开始。',
            10007: '领券活动已经结束。',
            10008: '很遗憾，优惠券已经被领完。',  //黑名单用户
            10000: '很遗憾，优惠券已经被领完。'   //系统异常提示语
           }
           queryDrawSuccess：查询是否领过了券的成功了的回调函数
           queryFail：查询是否领过了券的失败了的回调函数
           getNumSuccess：查询券是否被领完了成功的回调函数
           getNumFail：查询券是否被领完了失败的回调函数
      */

    exports.init = function (options) {
        var _settings = {
            parentNode: null,
            activeName: null,
            drawLevel: null,
            preLogin: null,
            selfcallback: null, //完全自己处理
            success: null,
            fail: null,
            drawOver: null,
            drawGetted: null,
            infos: null,
            queryDrawSuccess: null,
            queryFail: null,
            getNumSuccess: null,
            getNumFail: null,
            ignoreLogin: false,
            clickcb: null,
            clickEvent: "click",
            isShowInfo: true // 领券时是否弹默认框

        };

        if (options) {
            $.extend(_settings, options);
        }
        var cls = getClsDraw(_settings.clickEvent);
        var objDraw = cls.create(_settings);
        (function (objDraw) {
            JD.store.getValue("loginCount", function (a, b) {
                if ((b ? b + 1 : 0) > 2) {
                    return;
                }
            });
            JD.store.getValue("quanKey", function (a, b) {
                var quankey = b ? b.split("~") : 0;
                JD.store.del("quanKey");
                if (quankey == 0) return;
                var obj = $("[drawFlag]"),
                    drawLevel = quankey[1],
                    drawActive = quankey[0];

                objDraw.setDraw(obj, drawLevel, drawActive);
            });
        })(objDraw);

        return objDraw;
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;//判断是否新用户
!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    var ls = __webpack_require__(1),
        _cacheThisModule_ = '',
        CONST_EVENT_CGI = "event_cgi_newuser",
        CONST_NEW_USER_KEY = "senior_user",
        CONST_JD_VIP_KEY = "vip_user",
        CONST_NEW_USER = "//wq.jd.com/mcoss/checknewusr/checkisnewuser?callback=checkIsNew",
        CONST_JD_LEVEL = "//wq.jd.com/user/info/QueryJDUserInfo?sceneid=30672&callback=QueryJDUserInfo";

    function checkJDVip(opt, callback) {
        var isVip,
            isDiamondVip,
            isGoldVip,
            serverError = true;
        var url = CONST_JD_LEVEL;
        if (window.GLOBAL_CHECKNEWUSER == "0") {
            callback && callback({
                "retcode": 0,
                "msg": "success.",
                "definePin": 0,
                "userFlag": 1,
                "orderFlag": 1,
                "isLongPwdActive": 1,
                "isShortPwdActive": 0,
                "base": {
                    "TipUrl": "http://wqs.jd.com/my/accountv2.shtml?sceneid=30672&state=0&rurl=http://preview.wqs.jd.com/event/juhui/bzmtest2/index.shtml",
                    "levelName": "银牌用户",
                    "userLevel": 61,
                    "nickname": "jd_Jackyfang",
                    "curPin": "",
                    "jdNum": "",
                    "mobile": "",
                    "headImageUrl": "",
                    "accountType": 0
                }
            }, 0);
            return;
        }
        window.QueryJDUserInfo = function (data) {
            serverError = false;
            if (data.retcode == 13) {
                //login.login(); 
            } else if (data.retcode != 0) {
                // showError();
            } else {

                if (data.base && data.base.userLevel) {
                    JD.store.setItem(CONST_JD_VIP_KEY, data, 5, function (a, b) {}, 'wqs.jd.com');
                    callback && callback(data, data.base.userLevel);
                }
            }
        };

        ls.loadScript({

            url: CONST_JD_LEVEL + "&t=" + Math.random(),
            isToken: true
        });
    }

    function checkNewUser(cb) {
        var isRongzai = window.GLOBAL_CHECKNEWUSER == "0" ? true : false;
        if (JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT) {
            //结果已经返回，直接使用
            cb && cb(JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT);
        } else {
            //加入监听队列wq.
            JD.events.listen(CONST_EVENT_CGI, function (obj) {
                cb && cb(obj);
            });
            if (JD.GLOBAL_CONFIG.CGI_NEWUSER_RUN) {
                return;
            }
            JD.GLOBAL_CONFIG.CGI_NEWUSER_RUN = true;
            window.checkIsNew = function (data) {
                //如果是老用户，多设置一些时间
                if (data && data.retcode == 0 && data.newuserflag == "0") {

                    JD.store.setValue(CONST_NEW_USER_KEY, data, 60 * 24 * 30); //老用户保存1个月
                }
                JD.GLOBAL_CONFIG.CGI_NEWUSER_RESULT = data;
                JD.events.trigger(CONST_EVENT_CGI, data);
            };
            //容灾特殊处理，不需要调用，按照老用户处理
            if (isRongzai) {
                window.checkIsNew({
                    "retcode": "0",
                    "errmsg": "CheckIsNewUser:invoke succ",
                    "newuserflag": "0"
                });
            } else {
                ls.loadScript({
                    url: CONST_NEW_USER + "&t=" + Math.random(),
                    isToken: false
                });
            }
        }
    }
    //回调方法
    exports.isNewUser = function (cb, isRongzai) {

        JD.store.getValue(CONST_NEW_USER_KEY, function (key, obj) {
            //如果有缓存，优先缓存数据
            if (obj) {
                cb && cb(obj);
            } else {
                checkNewUser(cb);
            }
        });
    };
    //回调方法
    exports.getJDVip = function (opt, callback) {

        JD.store.getItem(CONST_JD_VIP_KEY, function (key, data) {

            if (data && data.base && data.base.userLevel) {
                callback && callback(data, data.base.userLevel);
            } else {
                checkJDVip({}, callback);
            }
        }, "wqs.jd.com");
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    var $ = __webpack_require__(2),
        base = __webpack_require__(19),
        fj = __webpack_require__(16),
        db = __webpack_require__(10),
        _cacheThisModule_ = '',
        iScroll = __webpack_require__(17),
        clickEvent = "ontouchstart" in window ? "tap" : "click",
        opt = {
        mouseWheel: !1,
        bounce: !0,
        disableMouse: !0,
        disablePointer: !0,
        freeScroll: !1,
        momentum: !0,
        fadeScrollbars: !1,
        probeType: 2
    },
        stopMove = function (e) {
        e.preventDefault();
    },
        firstIndex = 0;
    window.Zepto && (clickEvent = "click");

    function getClsSideNav() {
        var sidNav = base.init().extend({
            setUp: function () {

                var dataId = this.get("dataId");
                var footDomClass = this.get("footDomClass");
                var fensClass = this.get('fensClass'); // gj-20151230-nianhuo
                var $navDom, $navBackground;

                selectTime();

                db.getData({
                    dataType: db.DataType.PPMS,
                    param: {
                        key: dataId,
                        callback: 'showPageData' + dataId
                    },
                    cb: renderNav

                });

                //侧面导航的HTML内容
                function getTpl() {
                    var sw = $(window).height(),
                        sw = JD.device.scene == 'weixin' ? sw - 80 : sw - 80;
                    return ['<div class="sessions_nav_mask"></div>', '<div class="sessions_nav" style="display:none">', '    <div class="sessions_inner" id="yScroll2" style="height:', sw, 'px;overflow:hidden;">', '        <ul class="sessions">', '            <%', '            var hotItems=JD.calendar.selectTime(data);', '            var now=new Date();', '            for(var i=0;i<data.length;i++){', '               var item=data[i];', '              ', '   ', '            %>', '            <li>', '               <a  href="javascript:;" data-target="<%=item.link%>">', '                  <%', '                   if(now>=new Date(item.begin.replace(/-/g, "/")) &&now<new Date(item.end.replace(/-/g, "/"))){', '                 %>', '                 <span class="tag_hot" >HOT</span>', '                 <%', '               }', '                  %>', '                    ', '                    <p class="name"><%=item.title%></p>', '                    <small class="desc"><%=item.desc%></small>', '                </a>', '            </li>', '          <%}%>', '            ', '        </ul>', '    </div>', '   <span class="bor_top"></span>', '    <span class="bor_btm"></span>', '    <div class="tri"></div>', '</div>'].join("");
                }
                //渲染侧面导航
                function renderNav(objData) {
                    var arrTemp = [];

                    document.getElementById("navContainer").innerHTML = fj.formatJson(getTpl(), {
                        data: objData.data
                    });

                    $navDom = $(".sessions_nav"); //必选，导航栏外面的dom节点，内含up,down,inner等结构，zepto对象

                    var $navScroll = $(".sessions_nav .sessions_inner"),
                        // 滑动的ul外面的结构li， zepto对象
                    $navItem = $(".sessions a"); //必选，导航的每个dom集合，zepto对象
                    $navBackground = $(".sessions_nav_mask"); //必选，蒙层dom，zepto对象

                    $navBackground.on(clickEvent, function (e) {
                        e && e.preventDefault() && e.stopPropagation();
                        hideNav();
                    });
                    $navScroll.on(clickEvent, function (e) {
                        if (!e) return false;
                        var target = $(e.target);
                        e.preventDefault() && e.stopPropagation();
                        go($(target).attr("data-target") || $(target).parents("[data-target]").attr("data-target"));
                    });
                    if (window.Zepto) {
                        $navScroll.on('tap', 'li', function (e) {
                            var target = $(e.currentTarget).children('a');
                            e && e.preventDefault() && e.stopPropagation();
                            go($(target).attr("data-target") || $(target).parents("[data-target]").attr("data-target"));
                        });
                    }
                    s1 = iScroll.init("#" + $navScroll.attr("id"), opt);
                    $(document).on(clickEvent, "." + footDomClass, function () {

                        if ($("." + footDomClass).hasClass("on")) //隐藏菜单
                            {
                                hideNav();
                            } else {
                            //弹出菜单
                            //console.log("弹出菜单");
                            $("." + footDomClass).addClass("on");
                            $navDom.show().addClass("expand");

                            $navBackground.addClass("show");
                            document.addEventListener("touchmove", stopMove, !1), s1.refresh();
                            var dom = $navItem.filter('[data-myindex="' + firstIndex + '"]').parent();
                            dom.get(0) && s1.scrollToElement(dom.get(0), 1200, null, !0);
                        }
                    });
                    $navDom.addClass(fensClass); // gj-20151230-nianhuo
                }

                //隐藏侧面导航
                function hideNav() {
                    document.removeEventListener("touchmove", stopMove, !1), $("." + footDomClass).removeClass("on"), $navDom.removeClass("expand");
                    $navBackground.removeClass("show");
                    $navDom.hide();
                }
            }
        });
        return sidNav;
    }

    function go(searchLink) {
        searchLink && (location.href = searchLink);
    }

    function selectTime(datas) {

        JD.calendar.selectTime = JD.calendar.selectTime || function (datas) {
            var result = [],
                cTime = JD.GLOBAL_CONFIG.NOW,
                item;
            if (!datas) return [];
            for (var i = 0, l = datas.length; i < l; i++) {
                item = datas[i];

                if (item) {
                    item.begin = item.begin || '1970/01/01';
                    item.end = item.end || '2099/01/01';
                    var beginDate = new Date(item.begin.replace(/-/g, '/')),
                        endDate = new Date(item.end.replace(/-/g, '/'));
                    if (beginDate <= cTime && endDate >= cTime) {
                        item.index = i;
                        result.push(item);
                    }
                }
            }
            return result;
        };
    }

    function init(options) {
        //页面没有引用导航则退出
        var _settings = {
            footDomClass: "eleven", //必选，底部的导航点击节点样式，由于生成较晚，所以采用代理模式
            fensClass: JD.calendar.SQ_NH && document.getElementById("navContainer") ? 'newyear' : '', // gj-20151230-nianhuo
            dataId: 17529 //PPMSID
        };

        if (options) {
            $.extend(_settings, options);
        }
        var sidnav = getClsSideNav();
        //创建实例
        return sidnav.create(_settings);
    }
    exports.init = init;
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    var $ = __webpack_require__(2),
        _cacheThisModule_ = '',
        _iscroll = __webpack_require__(17),
        ls = __webpack_require__(1),
        loopSrcoll = __webpack_require__(18),
        searchFormCls = "wx_search_form",
        serachbar,
        serachFormFocusCls = "wx_search_form_focus",
        sBtnCls = "wx_search_btn_blue",
        bar = document.getElementById("topsearchbar"),
        snow_list = [],
        snow_flag = true,
        bao_list = [],
        bao_flag = true,
        switchword = "",
        opt = {
        mouseWheel: !1,
        bounce: !0,
        disableMouse: !0,
        disablePointer: !0,
        freeScroll: !1,
        momentum: !0
    },
        tipsKey = "wxsq_newversion";
    // tipsKey = "jd_newversion_062021";
    //
    /*    function changRongzaiLink(locUrl, toUrl) {
        return toUrl.replace('new', (locUrl.indexOf("new") > -1) ? 'new' : 'old');
    }*/

    /*
    function showFirstTips() {
        return;
        if (location.href.indexOf("tabid=13&tpl=13") == -1) {
            return $(".wx_bar_guide_area").remove();
        }
        var hasShowInst = JD.cookie.get(tipsKey);
        hasShowInst ? $(".wx_bar_guide_area").remove() : $(".wx_bar_guide_area").show();
    }
    */
    /*  function go(searchLink) {
        location.href = searchLink;
    }*/

    /*  function setSideMenu() {
        var Bar, stopMove, clickEvent = "ontouchstart" in window ? "tap" : "click",
            wx_side_menu = $(".wx_side_menu"),
            wx_search_chanel_mode = $(".wx_search_chanel_mode"),
            bigShow = $("#bigShow"),
            menu_list = $(".menu_list"),
            guide = $(".wx_bar_guide_area"),
            wx_search_inner = $(".wx_search_inner"),
            showMenu = function(hide) {
                JD.events.trigger("event_checkpopmenu", hide);
            },
            stopMove = function(e) {
                0 == $(e.target).parents(".stopmove").length && (e.preventDefault());
            };
        menu_list.find(".item[data-dis=new] .new").show();
        menu_list.find(".item[data-strong='1'] .hot").show();
         JD.events.listen("event_checkpopmenu", function(hide) {
            if (hide || menu_list.css("display") !== "none") {
                wx_side_menu.removeClass("show");
                wx_search_chanel_mode.removeClass("wx_search_show_menu");
                JD.events.trigger("event_hidecurtain");
                setTimeout(function() {
                    menu_list.hide().parent().hide();
                }, 500);
                $(document).unbind("touchmove", stopMove, !1)
            } else {
                 wx_search_chanel_mode.removeClass("wx_search_show_window").addClass("wx_search_show_menu");
                wx_side_menu.addClass("show");
                bigShow.removeClass("show");
                $(document).bind("touchmove", stopMove, !1);
                if (wx_search_chanel_mode.hasClass("fixed")) {
                    menu_list.show().parent().show();
                } else {
                    setTimeout(function() {
                        menu_list.show().parent().show();
                    }, 500);
                    menu_list.show().parent().show();
                    window.scrollTo(0, 0);
                    menu_list.show().parent().show().css("top", (wx_search_inner.offset().top + wx_search_inner.height() - 1) + "px");
                }
                 s1.refresh();
            }
        });
        menu_list.find(".item").on(clickEvent, function(e) {
            var target = $(e.target);
            e.preventDefault(), e.stopPropagation(), go(target.data("href") || $(target).parents("[data-href]").attr("data-href"));
        }), Bar = {
            init: function() {
                 this.init_tab(), this.init_menu(), this.init_guide();
            },
            init_tab: function() {
                 wx_search_inner.on(clickEvent, function(e) {
                    showMenu(true);
                });
            },
            init_menu: function(e) {
                 var mask = wx_side_menu.find(".mod_alert_mask"),
                    fold = wx_side_menu.find(".fold"),
                    on_click = function(e) {
                        if (e && $(e.target).attr("class") == "icon_cate") {
                            JD.report.rd($(e.target).attr("ptag"));
                        }
                        e && (e.preventDefault(), e.stopPropagation());
                        showMenu(false);
                     },
                    on_menu = function(e) {
                        var elm = $(e.target).closest(".menu_list");
                        elm.length > 0 || on_click(e);
                    };
                wx_search_chanel_mode.find(".wx_bar_cate").on(clickEvent, function(e) {
                        on_click(e);
                    }), mask.on(clickEvent, function(e) {
                        on_click(e);
                    }), fold.on(clickEvent, function(e) {
                        on_click(e);
                    }),
                    wx_side_menu.on(clickEvent, function(e) {
                        on_menu(e);
                    });
            },
            init_guide: function() {
                var on_clear = function() {
                        guide.remove();
                    },
                    on_click = function() {
                        JD.cookie.set(tipsKey, 1, 5256e4, "/", "jd.com"), //ȷ��չʾһ��
                            guide.addClass("fade"), timer = setTimeout(on_clear, 500);
                    };
                guide.on(clickEvent, on_click);
            }
        }, Bar.init(), window._navfoot && showFirstTips();
    }*/

    function selectDataByTime(selectdata) {
        var returndata = [];
        var nowdate = new Date();
        for (var i = 0; i < selectdata.length; i++) {
            if (nowdate > new Date(selectdata[i].begin) && nowdate < new Date(selectdata[i].end)) {
                returndata.push(selectdata[i]);
            }
        }
        return returndata;
    }

    function fetch_bao() {
        var baotpl = '<div class="bao" style="left:#left#% ;-webkit-transform: scale(#zoom#);"><b style="-webkit-animation : wx_tab_bar_bao_drop #time#s linear #delay#s infinite forwards;"></b></div>';
        var create_bao = function () {
            var zoom = Math.random() + 0.4;
            var left = Math.random() * 100 % 100;
            var time = Math.random() * 10 % 10 + 15;
            var delay = Math.random() * 3;
            var item = {
                time: time,
                zoom: zoom,
                left: left,
                delay: delay
            };
            return item;
        };
        var bao_loop = function () {
            for (i = 0; i < 3; ++i) {
                var item = create_bao();
                bao_list.push(item);
                $("#spring_bao").append(baotpl.replace("#left#", item.left).replace("#zoom#", item.zoom).replace("#time#", item.time).replace("#delay#", item.delay));
            }

            if (bao_list.length >= 12) {
                bao_flag = false;
            }

            if (bao_flag) {
                fetch_bao();
            }
        };
        var bao_timer = setTimeout(bao_loop, 2000);
    }

    function loadstonglan() {
        var tonglandata = selectDataByTime(g_spring_tong);
        var tpl = '<a href="#url#"><div class="img"><img src="#img#" alt="" onload="window.firstImgLoaded && window.firstImgLoaded()" ></div></a>';
        if (tonglandata.length > 0) {
            var xuanrandata = tonglandata[0];
            $("#spring_banner_calendar").html(tpl.replace('#url#', xuanrandata.surl).replace('#img#', JD.img.getImgUrl(xuanrandata.simg))).show();
        }
    }

    function loadsfenbanner() {
        var fendata = selectDataByTime(g_spring_fen);

        var tpl = '<div class="item item_#sclass#"><a href="#url#" class="url"><div class="info"><div class="name">#sname#</div><div class="desc">#sdesc#</div></div><div class="img"><img src="#img#" onload="window.firstImgLoaded && window.firstImgLoaded()"></div></a></div>';
        if (fendata.length > 0) {
            for (var i = 0; i < fendata.length; i++) {
                $("#wx_year_fen_cont").append(tpl.replace('#sdesc#', fendata[i].sdesc).replace('#sname#', fendata[i].sname).replace('#sclass#', fendata[i].sclass).replace('#url#', fendata[i].surl).replace('#img#', JD.img.getImgUrl(fendata[i].simg)));
            }
        }
    }

    var iLoaded = 0;

    function loadsbanner(bannerdata, firstIndex, isGray) {
        var tpl = '<div class="item"><a href="#url#"><img src="#img#" alt="" onload="checkTopBannerLoad();" ></a></div>';
        var cont = $("#spring_banner .list");
        var nav_bar = $("#spring_banner .nav_bar");
        var tabid = JD.url.getUrlParam("tabid");
        var html = [];
        //nav_bar.html('<b></b>');
        if (bannerdata.length > 0) {
            for (var i = window.GLOBAL_BANNER_BEGIN || 0; i < bannerdata.length; i++) {
                //modified by jacky 2016/02/03 直出一个图，剩余的渲染，以后修改为从0开始
                if (tabid == "13" && isGray) {
                    bannerdata[i].surl = JD.url.addRd(bannerdata[i].surl, "37787.15." + (i + 1));
                } else if (tabid == "13") {
                    bannerdata[i].surl = JD.url.addRd(bannerdata[i].surl, "37787.2." + (i + 1));
                }
                html.push(tpl.replace('#url#', bannerdata[i].surl).replace('#img#', JD.img.getImgUrl(bannerdata[i].simg)));

                nav_bar.append('<b></b>');
            }

            window.checkTopBannerLoad = function () {
                iLoaded++;
                if (iLoaded !== bannerdata.length - (window.GLOBAL_BANNER_BEGIN || 0)) {
                    return;
                }
                if (bannerdata.length > 1) {
                    //考虑到首屏加载的体验，设置Settimou,防止动画运行起来但是图片还没有出来，导致白屏 


                    $("#spring_banner .nav").show();
                    var bannerloopScroll = loopSrcoll.init({
                        tp: "img", //图片img或是文字text  默认text
                        moveDom: $("#spring_banner>.list"), //必选  待移动父元素zepto查询对象
                        moveChild: $("#spring_banner>.list .item"), //必选  zepto查询对象
                        tab: $("#spring_banner .nav b"), //必选  zepto查询对象
                        len: bannerdata.length, //总元素
                        index: firstIndex, //当前位移的元素
                        loopScroll: true, //是否要循环滚动
                        autoTime: 5000, //自动轮播， 默认不自动， 需要的话就传毫秒值 如5000
                        tabClass: "cur",
                        transition: 0.4,
                        enableTransX: true,
                        fun: function (index) {
                            //$(".tit_list .cur").removeClass('cur');
                            //$('.tit_list>div.tit').eq(index-1).addClass('cur');
                        }
                    });
                    $("#spring_banner .switch").on('click', '.left,.right', function () {
                        var _this = $(this),
                            index = bannerloopScroll.index;
                        _this.is('.left') ? index-- : index++;
                        bannerloopScroll.stepMove(index);
                    });
                } else {
                    $("#spring_banner .nav").hide();
                    $("#spring_banner .switch").hide();
                }

                window.firstImgLoaded && window.firstImgLoaded();
            };

            cont.append(html.join(""));
            $("#spring_banner").show();
            //对头部的PPMS的内容修正PTAG,直出后修改 2016/02/03 jacky
            var firstDom = $("#banner_firstImg a"),
                firstUrl = firstDom.attr("href");
            if (firstDom.length > 0) {
                if (tabid == "13" && isGray) {
                    firstDom.attr("href", JD.url.addRd(firstUrl, "37787.15.1"));
                } else if (tabid == "13") {
                    firstDom.attr("href", JD.url.addRd(firstUrl, "37787.2.1"));
                }
            }
        } else {
            $("#spring_main").hide();
            $("#spring_snow").hide();
        }
    }

    function selectTab(bannerdata) {
        window.checkSexCB = function (json) {
            var sexType = 0; //0:未知,1:男性，2：女性
            if (json.retcode == 0) {
                for (var i = 0, len = json.matchres.length; i < len; i++) {
                    if (json.matchres[i].bizid == 12) {
                        //男性
                        if (json.matchres[i].result == 1) {
                            sexType = 1;
                            break;
                        } else if (json.matchres[i].result == 2) {
                            sexType = 2;
                            break;
                        }
                    }
                }
            }

            if (sexType == 1) {
                JD.report.rd("37035.4.2");
                loadsbanner(bannerdata, 1, true);
            } else {
                var randomIndex = parseInt(Math.random() * (bannerdata.length - 1)) + 2;
                loadsbanner(bannerdata, randomIndex, true);
            }
        };

        ls.loadScript({
            url: "http://wq.jd.com/mcoss/directplat/usrgdirect?gb=103:12&callback=checkSexCB" + "&t=" + new Date().getTime()
        });
    }

    function headSpringInit() {
        var tabid = JD.url.getUrlParam("tabid");
        var title = JD.url.getUrlParam("title");
        var grayFunc = function () {
            var vk = JD.cookie.get("visitkey");
            var vkSp;
            if (vk) {
                vk = vk + "";
                vkSp = vk.slice(vk.length - 1);
                return vkSp ? vkSp < 5 : Math.random() < 0.5;
            } else {
                return Math.random() < 0.5;
            }
        };

        bannerdata = selectDataByTime(g_spring_banner);

        if (window.XIN_BANNER && window.XIN_BANNER.length > 0 || (tabid == "13" || window.GLOBAL_WX_HEADER) && !title) {
            //XIN_BANNER
            var nowdate = new Date();
            var diffday = parseInt(Math.abs(new Date() - new Date("2016/01/22")) / 1000 / 60 / 60 / 24) + 19;
            var grayFlag = window.ppms_cnxh && window.ppms_cnxh[1] && window.ppms_cnxh[1].isShowCNXH * 1;

            if (tabid == "13" && grayFlag) {
                //
                var gray = grayFunc();
                if (gray) {
                    selectTab(bannerdata);
                } else {
                    var randomIndex = parseInt(Math.random() * bannerdata.length) + 1;
                    randomIndex == 1 && JD.report.rd("37035.4.1");
                    loadsbanner(bannerdata, randomIndex);
                }
            } else {
                loadsbanner(bannerdata, parseInt(Math.random() * bannerdata.length) + 1);
            }

            if (tabid == "13") {
                $("#spring_banner .left").attr("ptag", "37787.2.7");
                $("#spring_banner .right").attr("ptag", "37787.2.7");

                /* if(nowdate > new Date("2016/02/25 00:00:00") && nowdate < new Date("2016/02/25 23:59:59")){
                     $("#topsearchbar").addClass('wx_search_honor');
                     $("#spring_banner").addClass('wx_bnr_honor');
                     $(".wx_wrap").addClass('wet_honor');
                     var honorhtml = '<div class="honor_bnr"><a href="http://wqs.jd.com/promote/201602/pin_wx_normal.shtml?PTAG=37787.14.1" class="url"><div class="tit"></div></a><div class="bg"></div><div class="cnr"></div></div>';
                     $(".wx_wrap").prepend(honorhtml);
                 }*/
            }

            $("#spring_banner_calendar_day").html(diffday);

            $(window).on("hashchange", function (e) {
                try {
                    if (location.hash == '#sbox') {
                        //$("#topsearchbar").removeClass('wx_search_nian');
                        $("#spring_main").hide();
                        $("#spring_snow").hide();
                    } else {
                        //$("#topsearchbar").addClass('wx_search_nian');
                        $("#spring_main").show();
                        $("#spring_snow").show();
                    }
                } catch (e) {}
            });
        } else {
            $("#spring_main").hide();
            $("#spring_snow").hide();
            $("#wx_year_cont").hide();
            $("#spring_bao").hide();
        }
    }

    exports.headSpringInit = headSpringInit;

    exports.init = function () {

        JD.events.listen("event_wxmenusearh", function () {
            JD.events.trigger("event_wxsearchbar");
        });
        JD.events.trigger("event_wxsearchbar");

        /* s1 = _iscroll.init("#yScroll1", opt);
         setSideMenu();*/
    };
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, module) {
	'use strict';

	var draw = __webpack_require__(60);
	var checknewuser = __webpack_require__(61);
	var loadJs = __webpack_require__(1);
	var login = __webpack_require__(8);
	var ui = __webpack_require__(9);

	if (!Array.prototype.find) {
		Array.prototype.find = function (predicate) {
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
		String.prototype.includes = function (search, start) {
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
	if (!Array.prototype.every) {
		Array.prototype.every = function (fun /*, thisArg */) {
			'use strict';

			if (this === void 0 || this === null) throw new TypeError();

			var t = Object(this);
			var len = t.length >>> 0;
			if (typeof fun !== 'function') throw new TypeError();

			var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
			for (var i = 0; i < len; i++) {
				if (i in t && !fun.call(thisArg, t[i], i, t)) return false;
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
}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }),
/* 65 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = URL;
function URL(sURL, args) {

    function parseParam(oSource, oParams, isown) {
        var key,
            obj = {};
        oParams = oParams || {};
        for (key in oSource) {
            obj[key] = oSource[key];
            if (oParams[key] != null) {
                if (isown) {
                    // 仅复制自己
                    if (oSource.hasOwnProperty[key]) {
                        obj[key] = oParams[key];
                    }
                } else {
                    obj[key] = oParams[key];
                }
            }
        }
        return obj;
    };

    function parseURL(url) {
        var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        var names = ['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash'];
        var results = parse_url.exec(url);
        var that = {};
        for (var i = 0, len = names.length; i < len; i += 1) {
            that[names[i]] = results[i] || '';
        }
        return that;
    };

    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    function trim(str) {
        if (typeof str !== 'string') {
            throw 'trim need a string as parameter';
        }
        var len = str.length;
        var s = 0;
        var reg = /(\u3000|\s|\t|\u00A0)/;

        while (s < len) {
            if (!reg.test(str.charAt(s))) {
                break;
            }
            s += 1;
        }
        while (len > s) {
            if (!reg.test(str.charAt(len - 1))) {
                break;
            }
            len -= 1;
        }
        return str.slice(s, len);
    };
    function _fdata(data, isEncode) {
        data = data == null ? '' : data;
        data = trim(data.toString());
        if (isEncode) {
            return encodeURIComponent(data);
        } else {
            return data;
        }
    };
    function jsonToQuery(JSON, isEncode) {
        var _Qstring = [];
        if (typeof JSON == "object") {
            for (var k in JSON) {
                if (k === '$nullName') {
                    _Qstring = _Qstring.concat(JSON[k]);
                    continue;
                }
                if (JSON[k] instanceof Array) {
                    for (var i = 0, len = JSON[k].length; i < len; i++) {
                        _Qstring.push(k + "=" + _fdata(JSON[k][i], isEncode));
                    }
                } else {
                    if (typeof JSON[k] != 'function') {
                        _Qstring.push(k + "=" + _fdata(JSON[k], isEncode));
                    }
                }
            }
        }
        if (_Qstring.length) {
            return _Qstring.join("&");
        } else {
            return "";
        }
    };
    function queryToJson(QS, isDecode) {
        var _Qlist = trim(QS).split("&");
        var _json = {};
        var _fData = function (data) {
            if (isDecode) {
                return decodeURIComponent(data);
            } else {
                return data;
            }
        };
        for (var i = 0, len = _Qlist.length; i < len; i++) {
            if (_Qlist[i]) {
                var _hsh = _Qlist[i].split("=");
                var _key = _hsh[0];
                var _value = _hsh[1];

                // 如果只有key没有value, 那么将全部丢入一个$nullName数组中
                if (_hsh.length < 2) {
                    _value = _key;
                    _key = '$nullName';
                }
                // 如果缓存堆栈中没有这个数据
                if (!_json[_key]) {
                    _json[_key] = _fData(_value);
                }
                // 如果堆栈中已经存在这个数据，则转换成数组存储
                else {
                        if (isArray(_json[_key]) != true) {
                            _json[_key] = [_json[_key]];
                        }
                        _json[_key].push(_fData(_value));
                    }
            }
        }
        return _json;
    };
    var opts = parseParam({
        'isEncodeQuery': false,
        'isEncodeHash': false
    }, args || {});
    var that = {};
    var url_json = parseURL(sURL);
    that.urlInfo = url_json;

    var query_json = queryToJson(url_json.query);

    var hash_json = queryToJson(url_json.hash);

    that.setParam = function (sKey, sValue) {
        query_json[sKey] = sValue;
        return this;
    };
    that.getParam = function (sKey) {
        return query_json[sKey];
    };
    that.setParams = function (oJson) {
        for (var key in oJson) {
            that.setParam(key, oJson[key]);
        }
        return this;
    };
    that.setHash = function (sKey, sValue) {
        hash_json[sKey] = sValue;
        return this;
    };
    that.getHash = function (sKey) {
        return hash_json[sKey];
    };
    that.valueOf = that.toString = function () {
        var url = [];
        var query = jsonToQuery(query_json, opts.isEncodeQuery);
        var hash = jsonToQuery(hash_json, opts.isEncodeQuery);
        if (url_json.scheme != '') {
            url.push(url_json.scheme + ':');
            url.push(url_json.slash);
        }
        if (url_json.host != '') {
            url.push(url_json.host);
            if (url_json.port != '') {
                url.push(':');
                url.push(url_json.port);
            }
        }
        url.push('/');
        url.push(url_json.path);
        if (query != '') {
            url.push('?' + query);
        }
        if (hash != '') {
            url.push('#' + hash);
        }
        return url.join('');
    };

    return that;
}

/***/ }),
/* 66 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export default */
/**
 * JSON 克隆
 * @param {Object | Json} jsonObj json对象
 * @return {Object | Json} 新的json对象
 * @author chenpan@jd.com
 */
function clone(jsonObj) {
    var buf;
    if (jsonObj instanceof Array) {
        buf = [];
        var i = jsonObj.length;
        while (i--) {
            buf[i] = clone(jsonObj[i]);
        }
        return buf;
    } else if (jsonObj instanceof Object) {
        buf = {};
        for (var k in jsonObj) {
            buf[k] = clone(jsonObj[k]);
        }
        return buf;
    } else {
        return jsonObj;
    }
}

/***/ }),
/* 67 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = loadJsonp;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util_getUniqueKey_js__ = __webpack_require__(70);
/**
* jsonp接口调用
* 
*/

var cache = __webpack_require__(5),
    loadJs = __webpack_require__(1);


var queue = {},
    loadedData = {};
const RETRYTIME = 1;
function jsonToQuery(data) {
	var r = [];
	for (var i in data) {
		r.push(i + '=' + data[i]);
	}
	return r.join('&');
}

function getLink(url, data) {
	var _query = jsonToQuery(data);
	if (url.indexOf('?') > -1) {
		url += '&';
	} else {
		url += '?';
	}
	return url + _query;
}

function jsonp(url, data, callback, onError, onTimeout) {
	if (!url || typeof url !== 'string' || !data) {
		throw 'jsonp parameter error!';
	}
	var callback = callback || function () {},
	    _cacheKey = getLink(url, data);
	var retried = 0;
	// 缓存中已存在结果
	var _cacheValue = cache.session.getItem(_cacheKey);

	if (_cacheValue) {
		callback && callback(_cacheValue);
		return;
	}
	// 队列中已存在请求
	if (queue[_cacheKey]) {
		queue[_cacheKey].push(callback);
		return;
	}

	queue[_cacheKey] = [callback];

	var _callbackName = data.callback || 'jsonp_' + __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__util_getUniqueKey_js__["a" /* default */])();
	data.callback = _callbackName;

	window[_callbackName] = function (r) {
		for (var i = 0; queue[_cacheKey][i]; i++) {
			queue[_cacheKey][i] && queue[_cacheKey][i](r);
		}
		// 结果缓存于sessionStorage
		cache.session.setItem(_cacheKey, r);
		delete window[_callbackName];
		delete queue[_cacheKey];
	};
	function _load() {
		loadJs.loadScript({
			url: url,
			data: data,
			charset: "utf-8",
			onError: function () {
				if (retried < RETRYTIME) {
					_load();
					retried++;
					return;
				}
				delete window[_callbackName];
				delete queue[_cacheKey];
				onError && onError();
			},
			// 超时同出错处理
			onTimeout: function () {
				if (retried < RETRYTIME) {
					_load();
					retried++;
					return;
				}
				delete window[_callbackName];
				delete queue[_cacheKey];
				onTimeout && onTimeout();
			}
		});
	}
	_load();
}

function loadJsonp(params, callback, handleError) {
	callback = callback || function () {};
	handleError = handleError || function () {};
	jsonp(params.url, params.data, callback, handleError, handleError);
}

/***/ }),
/* 68 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getJs;
/* harmony export (immutable) */ __webpack_exports__["b"] = triggerLoad;
/* harmony export (immutable) */ __webpack_exports__["c"] = onLoad;
/* unused harmony export getCss */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__URL_js__ = __webpack_require__(65);
/**
* 异步静态资源加载
* localstorage缓存配置
* 跨域问题，暂时无法启用缓存
*
*/

var $ = __webpack_require__(2),
    cache = __webpack_require__(5);


function parseURL(url) {
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
    callbacks = {};

function getJs(opts) {
	var conf = {
		url: '',
		cache: false,
		expire: 7 * 24 * 60 * 60,
		delay: 0,
		wait: false,
		type: 'js',
		callback: function () {}
	},
	    opts = opts || {};
	for (var i in opts) {
		conf[i] != undefined && (conf[i] = opts[i]);
	}
	if (conf.wait) {
		var key = conf.wait;
		conf.wait = false;
		!wait[key] && (wait[key] = []);
		wait[key].push(conf);
		// 特殊处理保留字段
		if (key == 'firstScreenEnd') {
			setTimeout(function () {
				triggerLoad('firstScreenEnd');
			}, 1000);
		}
		return;
	}

	var urlParse = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__URL_js__["a" /* default */])(conf.url);
	var urlPath = urlParse.urlInfo.path,
	    urlV = urlParse.getParam('_v');

	var _cache = cache.local.getItem(urlPath);
	if (_cache && urlV && _cache._v == urlV) {
		try {
			window.eval(_cache.con);
		} catch (e) {}
		conf.callback(_cache.con);
		return;
	}
	setTimeout(function () {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.charset = 'utf-8';
		script.onload = function () {
			conf.callback();
		};
		script.src = conf.url;
		document.getElementsByTagName('head')[0].appendChild(script);
	}, conf.delay);
}
function triggerLoad(key) {
	if (wait[key]) {
		wait[key].forEach(function (o, i) {
			if (o.type == 'css') {
				getCss(o);
			} else {
				getJs(o);
			}
		});
		delete wait[key];
	}

	if (callbacks[key]) {
		callbacks[key].forEach(function (o, i) {
			typeof o == 'function' && o();
		});
		delete callbacks[key];
	}
}
function onLoad(key, cb) {
	!callbacks[key] && (callbacks[key] = []);
	callbacks[key].push(cb);
}
function getCss(opts) {
	var conf = {
		url: '',
		cache: false,
		expire: 7 * 24 * 60 * 60,
		delay: 0,
		wait: false,
		type: 'css',
		callback: function () {}
	},
	    opts = opts || {};
	for (var i in opts) {
		conf[i] != undefined && (conf[i] = opts[i]);
	}
	if (conf.wait) {
		var key = conf.wait;
		conf.wait = null;
		!wait[key] && (wait[key] = []);
		wait[key].push(conf);
		return;
	}
	var urlParse = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__URL_js__["a" /* default */])(conf.url);
	var urlPath = urlParse.urlInfo.path,
	    urlV = urlParse.getParam('_v') || -1;

	var _link = document.createElement('link');
	_link.type = 'text/css';
	_link.rel = 'stylesheet';
	_link.onload = function () {
		conf.callback();
	};
	document.head.appendChild(_link);
	_link.href = opts.url;
}

/***/ }),
/* 69 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = loadWfdata;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__json_clone_js__ = __webpack_require__(66);
/**
* wfdata支持预加载
* 卖快和焦点的数据
*
*/
var legos_wfdata = __webpack_require__(10);


var queue = {},
    loadedData = {};
const RETRYTIME = 1;

function jsonToQuery(data) {
	var r = [];
	for (var i in data) {
		r.push(i + '=' + data[i]);
	}
	return r.join('&');
}
// 传参方案不变
function wfdatare(opts) {
	opts.param = opts.param || {};
	opts.cb = opts.cb || function () {};
	!opts.retried && (opts.retried = 0);
	var _cacheKey = opts.param.cacheKey || jsonToQuery(opts.param);

	// 队列中存在请求
	if (queue[_cacheKey]) {
		queue[_cacheKey]['cb'].push(opts.cb);
		queue[_cacheKey]['handleError'].push(opts.handleError);
		return;
	}
	queue[_cacheKey] = {
		cb: [opts.cb],
		handleError: [opts.handleError]
	};
	opts.cb = function (r) {
		for (var i = 0; i < queue[_cacheKey]['cb'].length; i++) {
			queue[_cacheKey]['cb'][i] && queue[_cacheKey]['cb'][i](r);
		}
		delete queue[_cacheKey];
	};
	opts.handleError = function (r) {
		// 失败重试
		if (opts.retried < RETRYTIME) {
			legos_wfdata.getData(opts);
			opts.retried++;
			return;
		}
		for (var i = 0; queue[_cacheKey] && queue[_cacheKey]['handleError'][i]; i++) {
			queue[_cacheKey]['handleError'][i] && queue[_cacheKey]['handleError'][i](r);
		}
		delete queue[_cacheKey];
	};
	legos_wfdata.getData(opts);
}

// 改版后的
function loadWfdata(params, callback, handleError) {
	params.dataType = legos_wfdata.DataType[params.dataType];
	params.cb = callback || function () {};
	params.handleError = handleError || function () {};
	wfdatare(params);
}

/***/ }),
/* 70 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getUniqueKey;
/**
* getUniqueKey()
*
*/
var _loadTime = new Date().getTime().toString(),
    _i = 1;
function getUniqueKey() {
	return _loadTime + _i++;
}

/***/ }),
/* 71 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return listener; });
var listener = function () {
	var dispatchList = {};

	var fireTaskList = [];
	var fireTaskTimer;

	function runFireTaskList() {
		if (fireTaskList.length == 0) {
			return;
		}
		clearTimeout(fireTaskTimer);
		var curFireTask = fireTaskList.splice(0, 1)[0];
		try {
			curFireTask['func'].apply(curFireTask['func'], [].concat(curFireTask['data']));
		} catch (exp) {
			console.log('[error][listener]: One of ' + curFireTask + '-' + curFireTask + ' function execute error.');
		}

		fireTaskTimer = setTimeout(runFireTaskList, 25);
	}

	var dispatch = {
		register: function (sChannel, sEventType, fCallBack) {
			dispatchList[sChannel] = dispatchList[sChannel] || {};
			dispatchList[sChannel][sEventType] = dispatchList[sChannel][sEventType] || [];
			dispatchList[sChannel][sEventType].push(fCallBack);
		},
		fire: function (sChannel, sEventType, oData) {
			var funcArray;
			var i, len;
			if (dispatchList[sChannel] && dispatchList[sChannel][sEventType] && dispatchList[sChannel][sEventType].length > 0) {
				funcArray = dispatchList[sChannel][sEventType];
				funcArray.data_cache = oData;
				for (i = 0, len = funcArray.length; i < len; i++) {
					fireTaskList.push({
						channel: sChannel,
						evt: sEventType,
						func: funcArray[i],
						data: oData
					});
				}
				runFireTaskList();
			}
		},
		remove: function (sChannel, sEventType, fCallBack) {
			if (dispatchList[sChannel]) {
				if (dispatchList[sChannel][sEventType]) {
					for (var i = 0, len = dispatchList[sChannel][sEventType].length; i < len; i++) {
						if (dispatchList[sChannel][sEventType][i] === fCallBack) {
							dispatchList[sChannel][sEventType].splice(i, 1);
							break;
						}
					}
				}
			}
		},
		list: function () {
			return dispatchList;
		},
		cache: function (sChannel, sEventType) {

			if (dispatchList[sChannel] && dispatchList[sChannel][sEventType]) {
				return dispatchList[sChannel][sEventType].data_cache;
			}
		}
	};
	return dispatch;
}();


/***/ }),
/* 72 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
//dispatch 分发 Action
//commit 提交一个 mutation
/* harmony default export */ __webpack_exports__["a"] = ({
  // FETCH_HOMEV2_SLOGAN : ({commit, dispatch, state}, {data}) => {
  //   commit("SET_HOMEV2_SLOGAN", {data})
  // },  
  homev2_slogan1: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_SLOGAN", { data });
  },
  homev2_wishlist: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_WISHLIST", { data });
  },
  homev2_fixcompany: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_FIXCOMPANG", { data });
  },
  homev2_fixscompany: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_FIXNAV", { data });
  },
  homev2_floating: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_FLOATING", { data });
  },
  homev2_botnav: ({ commit, dispatch, state }, { data }) => {
    commit("SET_HOMEV2_BOTNAV", { data });
  },
  FETCH_COMPANY_ARR: ({ commit, dispatch, state }, { data }) => {
    commit("SET_COMPANY_ARR", { data });
  },
  FETCH_PRODS_ARR: ({ commit, dispatch, state }, { data }) => {
    commit("SET_PRODS_ARR", { data });
  }
});

// import {
//   fetchUser,
//   fetchItems,
//   fetchIdsByType
// } from '../api'

// export default {
//   // ensure data for rendering given list type
//   FETCH_LIST_DATA: ({ commit, dispatch, state }, { type }) => {
//     commit('SET_ACTIVE_TYPE', { type })
//     return fetchIdsByType(type)
//       .then(ids => commit('SET_LIST', { type, ids }))
//       .then(() => dispatch('ENSURE_ACTIVE_ITEMS'))
//   },

//   // ensure all active items are fetched
//   ENSURE_ACTIVE_ITEMS: ({ dispatch, getters }) => {
//     return dispatch('FETCH_ITEMS', {
//       ids: getters.activeIds
//     })
//   },

//   FETCH_ITEMS: ({ commit, state }, { ids }) => {
//     // on the client, the store itself serves as a cache.
//     // only fetch items that we do not already have, or has expired (3 minutes)
//     const now = Date.now()
//     ids = ids.filter(id => {
//       const item = state.items[id]
//       if (!item) {
//         return true
//       }
//       if (now - item.__lastUpdated > 1000 * 60 * 3) {
//         return true
//       }
//       return false
//     })
//     if (ids.length) {
//       return fetchItems(ids).then(items => commit('SET_ITEMS', { items }))
//     } else {
//       return Promise.resolve()
//     }
//   },

//   FETCH_USER: ({ commit, state }, { id }) => {
//     return state.users[id]
//       ? Promise.resolve(state.users[id])
//       : fetchUser(id).then(user => commit('SET_USER', { id, user }))
//   }
// }

/***/ }),
/* 73 */
/***/ (function(module, exports) {



/***/ }),
/* 74 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vuex__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__actions__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__mutations__ = __webpack_require__(75);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__getters__ = __webpack_require__(73);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__getters___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__getters__);





__WEBPACK_IMPORTED_MODULE_0_vue__["a" /* default */].use(__WEBPACK_IMPORTED_MODULE_1_vuex__["b" /* default */]);

const store = new __WEBPACK_IMPORTED_MODULE_1_vuex__["b" /* default */].Store({
    // state: {
    //     list: [1, 23, 4, 5, 6, 7, 7, 8, 8],
    //     count: 1
    // },
    state: {
        homev2Slogan: [],
        homev2Wishlist: [],
        homev2Fixcompany: [],
        homev2Fixnav: [],
        homev2Floating: [],
        homev2Botnav: [],
        companyArr: [],
        prodsArr: []
    },
    actions: __WEBPACK_IMPORTED_MODULE_2__actions__["a" /* default */],
    mutations: __WEBPACK_IMPORTED_MODULE_3__mutations__["a" /* default */],
    getters: __WEBPACK_IMPORTED_MODULE_4__getters___default.a
    // actions: {
    //     replaceList: context=> {
    //         var t = [];
    //         let i = 0;
    //         while (i < 7) {
    //             t.push(Math.random());
    //             i++;
    //         }
    //         setTimeout(()=> {
    //             context.commit("replaceList", t);
    //         }, 1000);
    //     }
    // },
    // mutations: {
    //     replaceList: (state, payload)=> {
    //         console.log(state, payload)
    //         state.list = payload ;
    //     },
    //     addItem: state=> {
    //         state.list.push(Math.random());
    //     }
    // },
    // getters: {
    //     cc: state => {
    //         return state.count + "  hello!";
    //     }
    // }
});
/* harmony default export */ __webpack_exports__["a"] = (store);

/***/ }),
/* 75 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(4);


/* harmony default export */ __webpack_exports__["a"] = ({
  SET_HOMEV2_SLOGAN: (state, { data }) => {
    state.homev2Slogan = data;
  },
  SET_HOMEV2_WISHLIST: (state, { data }) => {
    state.homev2Wishlist = data;
  },
  SET_HOMEV2_FIXCOMPANG: (state, { data }) => {
    state.homev2Fixcompany = data;
  },
  SET_HOMEV2_FIXNAV: (state, { data }) => {
    state.homev2Fixnav = data;
  },
  SET_HOMEV2_FLOATING: (state, { data }) => {
    state.homev2Floating = data;
  },
  SET_HOMEV2_BOTNAV: (state, { data }) => {
    state.homev2Botnav = data;
  },
  SET_COMPANY_ARR: (state, { data }) => {
    state.companyArr = data;
  },
  SET_PRODS_ARR: (state, { data }) => {
    state.prodsArr = data;
  }
});

// export default {
//   SET_ACTIVE_TYPE: (state, { type }) => {
//     state.activeType = type
//   },

//   SET_LIST: (state, { type, ids }) => {
//     state.lists[type] = ids
//   },

//   SET_ITEMS: (state, { items }) => {
//     items.forEach(item => {
//       if (item) {
//         Vue.set(state.items, item.id, item)
//       }
//     })
//   },

//   SET_USER: (state, { id, user }) => {
//     Vue.set(state.users, id, user || false) /* false means user not found */
//   }
// }

/***/ }),
/* 76 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = throttle;
function throttle(func, threshold) {
    clearTimeout(func.tId);
    func.tId = setTimeout(func, threshold || 200);
}

/***/ }),
/* 77 */,
/* 78 */,
/* 79 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 80 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 81 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 82 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 83 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 84 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 85 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 86 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(82)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(42),
  /* template */
  __webpack_require__(103),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(44),
  /* template */
  __webpack_require__(102),
  /* styles */
  null,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(84)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(45),
  /* template */
  __webpack_require__(105),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(85)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(46),
  /* template */
  __webpack_require__(106),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(80)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(47),
  /* template */
  __webpack_require__(100),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(81)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(48),
  /* template */
  __webpack_require__(101),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(83)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(49),
  /* template */
  __webpack_require__(104),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

function injectStyle (ssrContext) {
  __webpack_require__(79)
}
var Component = __webpack_require__(3)(
  /* script */
  __webpack_require__(50),
  /* template */
  __webpack_require__(99),
  /* styles */
  injectStyle,
  /* scopeId */
  null,
  /* moduleIdentifier (server only) */
  null
)

module.exports = Component.exports


/***/ }),
/* 99 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [(_vm.listnav.isDisplay == 1 && _vm.listnav.sData && _vm.listnav.sData.length > 0) ? [_c('div', {
    staticClass: "homev2_topnav"
  }, [_c('div', {
    staticClass: "homev2_topnav_con"
  }, [_vm._l((_vm.listnav.sData), function(item) {
    return [((new Date()).valueOf() >= (new Date(item.startTime)).valueOf() && (new Date()).valueOf() <= (new Date(item.endTime)).valueOf()) ? [_c('a', {
      attrs: {
        "href": "javascript:;"
      }
    }, [_c('i', [_c('img', {
      attrs: {
        "src": _vm._f("getImg")(item.icon),
        "alt": ""
      }
    })]), _vm._v(_vm._s(item.name))])] : _vm._e()]
  })], 2)])] : _vm._e()], 2)
},staticRenderFns: []}

/***/ }),
/* 100 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "homev2_decopro"
  }, [_c('h2', {
    staticClass: "homev2_decopro_mtit"
  }, [_vm._v(" " + _vm._s(_vm.listData.name))]), (_vm.listData.eng_name) ? [_c('p', {
    staticClass: "homev2_decopro_ftit"
  }, [_vm._v(_vm._s(_vm.listData.eng_name))])] : [_c('p', {
    staticClass: "homev2_decopro_ftit"
  }, [_vm._v("SERVICE")])], (_vm.fixnav && _vm.fixnav.length <= 4) ? [_c('div', {
    staticClass: "homev2_menu_position"
  }), _c('div', {
    staticClass: "homev2_menu on"
  }, [_c('div', {
    staticClass: "homev2_menu_nav"
  }, [_vm._l((_vm.fixnav), function(item, index) {
    return [_c('a', {
      class: {
        cur: index == _vm.active
      },
      attrs: {
        "href": "javascript:;",
        "ptag": item.rd
      },
      on: {
        "click": function($event) {
          _vm.selectTab(index)
        }
      }
    }, [_c('i', {}, [_vm._v(_vm._s(item.nav_name))])]), _vm._v("\n        }\n        ")]
  })], 2)])] : [_c('div', {
    staticClass: "homev2_menu_position"
  }), _c('div', {
    staticClass: "homev2_menu on"
  }, [_c('div', {
    staticClass: "homev2_menu_nav1"
  }, [_c('div', {
    staticClass: "homev2_menu_navscroll"
  }, [_vm._l((_vm.fixnav), function(item, index) {
    return [_c('a', {
      class: {
        cur: index == _vm.active
      },
      attrs: {
        "href": "javascript:;",
        "ptag": item.rd
      },
      on: {
        "click": function($event) {
          _vm.selectTab(index)
        }
      }
    }, [_c('i', {}, [_vm._v(_vm._s(item.nav_name))])])]
  })], 2)])])], (_vm.content.data && _vm.content.data.length > 1) ? _c('div', {
    staticClass: "homev2_decopro_t"
  }, [_c('h3', {}, [_vm._v(_vm._s(_vm.content.nav_name))]), _c('p', {}, [_vm._v(_vm._s(_vm.content.nav_desc))])]) : _vm._e(), (_vm.content.data && _vm.content.data.length > 1) ? [_c('div', {
    staticClass: "homev2_decopro_m"
  }, _vm._l((_vm.content.data), function(item) {
    return _c('div', {
      staticClass: "homev2_decopro_item"
    }, [_vm._v("\n      " + _vm._s(item.sItemName) + "\n        "), _c('a', {
      attrs: {
        "href": item.sUrl
      }
    }, [_c('div', {
      staticClass: "bg_stamp"
    }, [(item.sImg200x200) ? [_c('img', {
      attrs: {
        "init-src": _vm._f("getImg")(item.sImg200x200),
        "alt": item.sItemName
      }
    })] : [_c('img', {
      attrs: {
        "init-src": _vm._f("getImg")(item.sImg),
        "alt": item.sItemName
      }
    })]], 2), (item.sItemName) ? [_c('h3', {}, [_vm._v(_vm._s(item.sItemName))])] : [_c('h3', {}, [_vm._v(_vm._s(item.sFullName))])], _c('p', {}, [_c('em', {
      staticStyle: {
        "font-family": "arial"
      }
    }, [_vm._v("¥ ")]), _vm._v(_vm._s(_vm._f("initPrice")(item.dwActMinPrice))), _c('em', [_vm._v("." + _vm._s(_vm._f("OnePointPrice")(item.dwActMinPrice)))])])], 2)])
  }))] : _vm._e()], 2)
},staticRenderFns: []}

/***/ }),
/* 101 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return (!_vm.hidden) ? _c('div', {
    staticClass: "homev2_company"
  }, [_c('h2', {
    staticClass: "homev2_company_mtit"
  }, [_vm._v(_vm._s(_vm.title))]), (_vm.english_title !== '') ? [_c('p', {
    staticClass: "homev2_company_ftit"
  }, [_vm._v(_vm._s(_vm.english_title))])] : [_c('p', {
    staticClass: "homev2_company_ftit"
  }, [_vm._v("COMPANY")])], (_vm.company.length > 0) ? _c('div', {
    staticClass: "homev2_flagcompany"
  }, [_vm._l((_vm.company), function(item) {
    return [_c('div', {
      staticClass: "homev2_flagcompany_con bg_stamp"
    }, [_c('a', {
      attrs: {
        "href": item.userdata2
      }
    }, [_c('div', {
      staticClass: "homev2_flagcompany_lg"
    }, [_c('img', {
      staticClass: "homev2_flagcompany_lgimg",
      attrs: {
        "init-src": _vm._f("getImg")(item.materialext1),
        "alt": item.materialname
      }
    }), _vm._v(" " + _vm._s(item.materialname) + "\n            "), (item.ppms_img) ? [_c('img', {
      staticClass: "homev2_flagcompany_tagimg",
      attrs: {
        "init-src": _vm._f("getImg")(item.ppms_img),
        "alt": ""
      }
    })] : _vm._e()], 2), _c('p', {
      staticClass: "homev2_flagcompany_detail"
    }, [_vm._v(_vm._s(item.materialdesc))])]), _c('a', {
      attrs: {
        "href": item.sUrl
      }
    }, [_c('div', {
      staticClass: "homev2_flagcompany_layout"
    }, [_c('div', {
      staticClass: "homev2_flagcompany_lylf bg_stamp"
    }, [_c('img', {
      attrs: {
        "init-src": _vm._f("getImg")(item.material),
        "alt": ""
      }
    }), _c('p', {}, [_vm._v(_vm._s(item.userdata1))])]), _c('div', {
      staticClass: "homev2_flagcompany_lyrg"
    }, [_c('div', {
      staticClass: "homev2_flagcompany_lyrgimg bg_stamp"
    }, [_c('img', {
      attrs: {
        "init-src": _vm._f("getImg")(item.materialext2),
        "alt": ""
      }
    })]), _c('div', {
      staticClass: "homev2_flagcompany_lyrgimg bg_stamp"
    }, [_c('img', {
      attrs: {
        "init-src": _vm._f("getImg")(item.materialext3),
        "alt": ""
      }
    })])])])])])]
  })], 2) : _vm._e(), (_vm.isCompanyMore) ? _c('a', {
    staticClass: "homev2_company_more",
    staticStyle: {
      "margin-bottom": "15px"
    },
    attrs: {
      "href": "javascript:;",
      "ptag": "137578.2.17"
    },
    on: {
      "click": _vm.moreCompany
    }
  }, [_vm._v("点击展开更多")]) : _vm._e(), (_vm.prods.length > 1) ? _c('div', {
    staticClass: "homev2_column_company"
  }, [_vm._l((_vm.prods), function(item) {
    return [_c('div', {
      staticClass: "homev2_column_comitem"
    }, [_c('a', {
      attrs: {
        "href": item.sUrl
      }
    }, [_c('img', {
      staticClass: "homev2_column_comimg bg_stamp",
      attrs: {
        "init-src": _vm._f("getImg")(item.material),
        "alt": ""
      }
    }), _c('img', {
      staticClass: "homev2_column_comlogo",
      attrs: {
        "init-src": _vm._f("getImg")(item.materialext1),
        "alt": ""
      }
    }), _c('h3', [_vm._v(_vm._s(item.materialname))]), _c('p', [_vm._v(_vm._s(item.materialdesc))])])])]
  })], 2) : _vm._e(), (_vm.isProdsMore) ? _c('a', {
    staticClass: "homev2_company_more",
    attrs: {
      "href": "javascript:;",
      "ptag": "137578.3.11"
    },
    on: {
      "click": _vm.moreProds
    }
  }, [_vm._v("点击展开更多")]) : _vm._e()], 2) : _vm._e()
},staticRenderFns: []}

/***/ }),
/* 102 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [_c('div', {
    staticClass: "WX_back_wrap",
    staticStyle: {
      "bottom": "60px"
    }
  }, [_c('a', {
    staticClass: "WX_backtop",
    style: ({
      display: _vm.display,
      bottom: '60px',
      zIndex: '200'
    }),
    attrs: {
      "href": "javascript:;"
    },
    on: {
      "click": _vm.backToTop
    }
  }, [_vm._v("返回顶部")])])])
},staticRenderFns: []}

/***/ }),
/* 103 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    attrs: {
      "id": "app"
    }
  }, [_c('homev2-top-components'), _c('homev2-banner-components'), _c('homev2-fix-components'), _c('homev2-bot-components')], 1)
},staticRenderFns: []}

/***/ }),
/* 104 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return (!_vm.hidden) ? _c('div', {
    staticClass: "homev2_banner"
  }, [_c('a', {
    attrs: {
      "href": _vm.banner.url
    }
  }, [_c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [_c('div', {
    staticClass: "homev2_banner_img bg_stamp"
  }, [_c('img', {
    attrs: {
      "src": _vm._f("getImg")(_vm.banner.img),
      "alt": ""
    }
  })])]), _c('div', {
    staticClass: "homev2_banner_txt"
  }, [_c('h4', [_vm._v(_vm._s(_vm.banner.title))]), _c('h3', [_vm._v(_vm._s(_vm.banner.desc_cn))]), (_vm.banner.desc_eng) ? [_c('p', [_vm._v(_vm._s(_vm.banner.desc_eng))])] : [_c('p', [_vm._v("DECORATION SERVICES")])], _c('i', [_vm._v(_vm._s(_vm.banner.btnTitle))])], 2)], 1)]) : _vm._e()
},staticRenderFns: []}

/***/ }),
/* 105 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [_c('a', {
    staticClass: "home_dongdong",
    attrs: {
      "href": "#"
    }
  }, [_vm._v("\n    咨询\n  ")])])
},staticRenderFns: []}

/***/ }),
/* 106 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('transition', {
    attrs: {
      "name": "fade"
    }
  }, [_c('div', {
    staticClass: "wx_nav wx_nav_custom"
  }, [_vm._l((_vm.listData), function(item, index) {
    return [_c('a', {
      class: {
        on: index == _vm.active
      },
      attrs: {
        "href": item.url
      }
    }, [_c('img', {
      staticClass: "highlight",
      attrs: {
        "src": _vm._f("formatName")(item.current)
      }
    }), _c('img', {
      staticClass: "normal",
      attrs: {
        "src": _vm._f("formatName")(item.disabled)
      }
    }), _c('span', [_vm._v(_vm._s(item.name))])])]
  })], 2)])
},staticRenderFns: []}

/***/ }),
/* 107 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('homev2-dec-pro'), _c('home-dongdong'), _c('home-dongdong'), _c('back-to-top')], 1)
},staticRenderFns: []}

/***/ })
],[51]);