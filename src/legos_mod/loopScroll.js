//可用于（img、div、其他dom）元素的滑动、轮播，还有tab的点击切换
//支持动态插入一个子轮播元素  插在第二个

define('loopScroll', function(require, exports, module) {
	var _cacheThisModule_;
    var $ = require('./zepto');
    var scroll = function(o) {
        this.opt = {
    		tp : 'text', //图片img或是文字text  默认text
			moveDom : null, //必选  待移动父元素zepto查询对象
			moveChild : [], //必选  zepto查询对象
			tab : [], //必选  zepto查询对象
			viewDom : null, //在那个容器里滑动，算宽度用，默认window  如果你的默认位置不对  那就要检查下这个
			touchDom2:[], //滑动事件的第二控制器   第一控制器是moveDom，   （dom原生对象数组，不建议搞太多）
			sp : null, //当前触发点的position
            min : 0, //响应滑动的最小移动距离
            minp : 0, //翻页的最小移动距离
			step : 0, //移动的步长 一般是每个元素的长度
			len : 1, //总元素
			index : 1, //当前位移的元素
			offset:0,
			loadImg:false,
			image:[],
			loopScroll : false, //是否要循环滚动
			lockScrY : false, //是否让竖向滚动
			stopOnce : false, //hold时停一次
			autoTime : 0,    //自动轮播， 默认不自动， 需要的话就传毫秒值 如5000
			holdAuto : false,    //自动轮播锁定  当滑出轮播区域后  或是手指在滑动的时候 可以屏蔽自动轮播
			tabClass : 'cur',
			transition : 0.3,
			imgInit:true, //第一次加载图片
			imgInitLazy:4000, //第一次预加载图片延时
			enableTransX : false,//使用translateX(-n*100%)方式
			fun : function() {
			}
		};
		$.extend(this, this.opt, o);
		this.len = this.moveChild.length;
    	this.min = this.min || {'text':100, 'img':1}[this.tp]; //min30是  andiord手Q划不动
        this.minp = this.minp || Math.max(this.min,30); //最少30像素翻页  注意一定要继承min值  很多地方没有给minp赋值
    	if(!this.viewDom) this.viewDom = $(window);
		if(this.len > 1) this.startEvent();  //只有一个的时候  不轮播  设置第一个的位置居中
		if(this.loadImg) this.image = this.moveDom.find('img');
		this.resize(this.step || this.moveChild.eq(0).width());
		if(this.autoTime){
			var obj = this;
			setInterval(function(){
				if(!obj.holdAuto){
					if(!obj.stopOnce) obj.stepMove(obj.index+1);
					obj.stopOnce = false;
				}
			}, this.autoTime);
		}
	};
	$.extend(scroll.prototype, {
		resize:function(step){
			this.step = step || this.step;
			var harf = (this.viewDom.width() - this.step)/2;
			this.offset = this.loopScroll ? this.step - harf : harf;
			if(this.len == 1) this.offset=-harf;
			this.stepMove(this.index, true);
		},
		addChild:function(dom, tabDom){
			if (!this.loopScroll) return;
			this.moveChild.eq(0).after(dom);
			this.len += 1;
			this.tab.eq(this.len-2).after(tabDom);
			this.tab = this.tab.parent().children();

			if(this.len == 2){
				this.moveChild = this.moveDom.children();
				this.startEvent();
			}
			else{
				this.stepMove(2);
			}
		},
		startEvent : function() {
			var obj = this, mid = this.moveDom.get(0), ael=function(dom){
				dom.addEventListener("touchstart", obj, false);
				dom.addEventListener("touchmove", obj, false);
				dom.addEventListener("touchend", obj, false);
				dom.addEventListener("touchcancel", obj, false);
				dom.addEventListener("webkitTransitionEnd", obj, false);
			};
			ael(mid);

			this.tab.each(function(i, em) {
				$(em).attr('no', i + 1);
				$(em).click(function() {
					obj.stepMove($(this).attr('no'));
				});
			});

			if (this.loopScroll) {
				this.moveDom.append(this.moveChild.eq(0).clone());
				var last = this.moveChild.eq(this.len - 1).clone();
				this.moveDom.prepend(last);
			}
			for (var i=0; i < this.touchDom2.length; i++) {
			  	ael(this.touchDom2[i]);
			};
		},
		// 默认事件处理函数，事件分发用
		handleEvent : function(e) {
			switch(e.type) {
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
		getPosition : function(e) {
			var touch = e.changedTouches ? e.changedTouches[0] : e;
			return {
				x : touch.pageX,
				y : touch.pageY
			};
		},
		touchmove : function(e) {
			var mp = this.getPosition(e), x = mp.x - this.sp.x, y = mp.y - this.sp.y;
    		if (Math.abs(x) - Math.abs(y) > this.min) {
			//if (Math.abs(x) > Math.abs(y)) {
				e.preventDefault();
				var offset = x - this.step * (this.index - 1) - this.offset;
                this.moveDom.css({
                    "-webkit-backface-visibility": "hidden",
                    "-webkit-transform" : this.enableTransX ? "translateX(" + (this.loopScroll?this.index:this.index-1)*(-100) + "%)" :
                                            "translate3D(" + offset + "px,0,0)",
                    "-webkit-transition" : "0"
                });
			} else {
				if (!this.lockScrY) e.preventDefault();
			}
		},
		move : function(e) {
			var mp = this.getPosition(e), x = mp.x - this.sp.x, y = mp.y - this.sp.y;
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
		loadImage: function(no){
			var img = this.image;
			var setImg = function(i){
				if(img[i] && $(img[i]).attr('back_src')){
					img[i].src = $(img[i]).attr('back_src');
					$(img[i]).removeAttr('back_src');
				}
			};
			setImg(no);
			(function(n, flag, t){
				setTimeout(function(){setImg(n-1); setImg(n+1);}, flag ? t : 0);
			})(no, this.imgInit, this.imgInitLazy);  //用闭包是为了防止n被更改，导致某个图不会被加载
			this.imgInit = false;
		},
		stepMove : function(no, isSetOffsetIndex) {
			this.index = no > this.len ? this.len : no < 1 ? 1 : no;
			this.tab.removeClass(this.tabClass);
			this.tab.eq(this.index - 1).addClass(this.tabClass);
			var tran = - this.step * ((this.loopScroll?no:this.index) - 1) - this.offset;
            this.moveDom.css({
                "-webkit-transform" : this.enableTransX ?
                    "translateX(" + (this.loopScroll?no:this.index-1)*(-100) + "%)" :"translate3D(" + tran + "px,0,0)" ,
                "-webkit-transition" : isSetOffsetIndex ? "0ms" : "all "+this.transition+"s ease"
            });
			if(this.loadImg) this.loadImage(this.index);
			this.fun(this.index);  //还原位置的时候  也调用了这个  要小心
			if(this.loopScroll && !isSetOffsetIndex){  //循环到头的时候 从复制的位置切换到实际的位置
				var obj = this, cindex=no;
				if(no <= 0) cindex = this.len;
				if(no > this.len) cindex = 1;
				if(cindex != no)
				setTimeout(function(){
					obj.stepMove(cindex, true);
				}, this.transition*1000);
			}
		}
	});

// 入口函数
	exports.init = function(opt) {
		return new scroll(opt);
	};
});
