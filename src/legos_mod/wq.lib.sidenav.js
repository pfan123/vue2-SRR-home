define("wq.lib.sidenav", function(require, exports) {
    var $ = require("./zepto"),
        base = require('./wq.lib.base'),
        fj = require('./formatJson'),
        db = require('./wfdata'),
        _cacheThisModule_ = '',
        iScroll = require("./iscroll"),
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
        stopMove = function(e) {
            e.preventDefault();
        },
        firstIndex = 0;
    window.Zepto && (clickEvent = "click");

    function getClsSideNav() {
        var sidNav = base.init().extend({
            setUp: function() {

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
                    return ['<div class="sessions_nav_mask"></div>',
                        '<div class="sessions_nav" style="display:none">',
                        '    <div class="sessions_inner" id="yScroll2" style="height:', sw, 'px;overflow:hidden;">',
                        '        <ul class="sessions">',
                        '            <%',
                        '            var hotItems=JD.calendar.selectTime(data);',
                        '            var now=new Date();',
                        '            for(var i=0;i<data.length;i++){',
                        '               var item=data[i];',
                        '              ',
                        '   ',
                        '            %>',
                        '            <li>',
                        '               <a  href="javascript:;" data-target="<%=item.link%>">',
                        '                  <%',
                        '                   if(now>=new Date(item.begin.replace(/-/g, "/")) &&now<new Date(item.end.replace(/-/g, "/"))){',
                        '                 %>',
                        '                 <span class="tag_hot" >HOT</span>',
                        '                 <%',
                        '               }',
                        '                  %>',
                        '                    ',
                        '                    <p class="name"><%=item.title%></p>',
                        '                    <small class="desc"><%=item.desc%></small>',
                        '                </a>',
                        '            </li>',
                        '          <%}%>',
                        '            ',
                        '        </ul>',
                        '    </div>',
                        '   <span class="bor_top"></span>',
                        '    <span class="bor_btm"></span>',
                        '    <div class="tri"></div>',
                        '</div>'
                    ].join("");
                }
                //渲染侧面导航
                function renderNav(objData) {
                    var arrTemp = [];

                    document.getElementById("navContainer").innerHTML = fj.formatJson(getTpl(), {
                        data: objData.data
                    });

                    $navDom = $(".sessions_nav"); //必选，导航栏外面的dom节点，内含up,down,inner等结构，zepto对象

                    var $navScroll = $(".sessions_nav .sessions_inner"), // 滑动的ul外面的结构li， zepto对象
                        $navItem = $(".sessions a");                         //必选，导航的每个dom集合，zepto对象
                        $navBackground = $(".sessions_nav_mask"); //必选，蒙层dom，zepto对象

                    $navBackground.on(clickEvent, function(e) {
                        e && e.preventDefault() && e.stopPropagation();
                        hideNav();

                    });
                    $navScroll.on(clickEvent, function(e) {
                        if (!e) return false;
                        var target = $(e.target);
                        e.preventDefault() && e.stopPropagation();
                        go($(target).attr("data-target") || $(target).parents("[data-target]").attr("data-target"));
                    });
                    if (window.Zepto) {
                        $navScroll.on('tap', 'li', function(e) {
                            var target = $(e.currentTarget).children('a');
                            e && e.preventDefault() && e.stopPropagation();
                            go($(target).attr("data-target") || $(target).parents("[data-target]").attr("data-target"));
                        });
                    }
                    s1 = iScroll.init("#" + $navScroll.attr("id"), opt);
                    $(document).on(clickEvent, "." + footDomClass, function() {

                        if ($("." + footDomClass).hasClass("on")) //隐藏菜单
                        {
                            hideNav();
                        } else {
                            //弹出菜单
                            //console.log("弹出菜单");
                            $("." + footDomClass).addClass("on");
                            $navDom.show().addClass("expand");

                            $navBackground.addClass("show");
                            document.addEventListener("touchmove", stopMove, !1),
                            s1.refresh();
                            var dom = $navItem.filter('[data-myindex="' + firstIndex + '"]').parent();
                            dom.get(0) && s1.scrollToElement(dom.get(0), 1200, null, !0);

                        }
                    });
                    $navDom.addClass(fensClass); // gj-20151230-nianhuo
                }

                 //隐藏侧面导航
                function hideNav() {
                    document.removeEventListener("touchmove", stopMove, !1), $("." + footDomClass).removeClass("on"),
                    $navDom.removeClass("expand");
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

        JD.calendar.selectTime = JD.calendar.selectTime || function(datas) {
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
            fensClass: (JD.calendar.SQ_NH && document.getElementById("navContainer")) ? 'newyear' : '', // gj-20151230-nianhuo
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
});