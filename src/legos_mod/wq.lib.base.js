/*
 Desc:提供组件的基类，所有的公开方法，可以复用，也可以重载
 Date: 2015-08-16
 Revision: 6246 
 */
define('wq.lib.base', function(require, exports, module) {
    var $ = require('./zepto'),
        fj = require('./formatJson'),
        _cacheThisModule_,
        clickEvent = 'ontouchstart' in window ? 'tap' : 'click',
        baseObj;

    function getBaseCls() {
        
        var Class = function() {};
        Class.extend = function extend(props) {

            var prototype = new this();
            var _super = this.prototype;

            for (var name in props) {

                if (typeof props[name] == "function" && typeof _super[name] == "function") {
                    // 如果父类同名属性也是一个函数 ,重新定义用户的同名函数，把用户的函数包装起来
                    prototype[name] = (function(super_fn, fn) {
                        return function() {
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
                        }
                    })(_super[name], props[name])
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

            subClass.create = subClass.prototype.create = function() {
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
            }

            return subClass;
        }
        return Class;
    }

    function getBaseObj() {
        console.log("getBaseObj.........");
        var events = {}; //JD.events;//事件分发，暂时可以不用
        var Class = getBaseCls();
        var base = Class.extend({
            //可以使用get来获取配置项bran
            get: function(key) {
                return this.__config[key];
            },
            //可以使用set来设置配置项
            set: function(key, value) {
                this.__config[key] = value;
            },
            EVENTS: {},
            template: '',
            //子类可以重写
            init: function(config) {
                var self = this;
                //存储配置项
                this.__config = config;
                //解析代理事件
                //delegateEveent
                this.delegateEveent();
                this.setUp();
            },
            //子类可以重写
            delegateEveent: function() {
                var eventObjs,
                    fn,
                    select,
                    type,
                    self = this,
                    events = this.EVENTS || {},
                    parentNode = this.get('parentNode') || $(document.body);
                for (select in events) {
                    eventObjs = events[select]
                    for (type in eventObjs) {
                        fn = eventObjs[type];
                        type=type||"click";//fixed bug

                        parentNode.delegate(select, type, function(e) {
                            fn.call(null, self, e)
                        })
                    }
                }
            },

            //提供给子类覆盖实现
            setUp: function() {
                this.render();
            },
            refreshData: function(key, value) {

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
            render: function(data) {
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
            destory: function() {
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
    exports.init = function() {
        return baseObj || (baseObj = getBaseObj());
    }



});