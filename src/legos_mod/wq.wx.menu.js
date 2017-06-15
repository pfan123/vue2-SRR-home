define("wq.wx.menu", function(require, exports) {
    var $ = require("./zepto"),
        _cacheThisModule_ = '',
        _iscroll = require("./iscroll"),
        ls = require("./loadJs"),
        loopSrcoll = require("./loopScroll"),
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
        var create_bao = function() {
            var zoom = Math.random() + 0.4;
            var left = Math.random() * 100 % 100;
            var time = Math.random() * 10 % 10 + 15;
            var delay = Math.random() * 3;
            var item = {
                time: time,
                zoom: zoom,
                left: left,
                delay: delay
            }
            return item;
        }
        var bao_loop = function() {
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
        }
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
            for (var i = window.GLOBAL_BANNER_BEGIN || 0; i < bannerdata.length; i++) { //modified by jacky 2016/02/03 直出一个图，剩余的渲染，以后修改为从0开始
                if (tabid == "13" && isGray) {
                    bannerdata[i].surl = JD.url.addRd(bannerdata[i].surl, "37787.15." + (i + 1));
                } else if (tabid == "13") {
                    bannerdata[i].surl = JD.url.addRd(bannerdata[i].surl, "37787.2." + (i + 1));
                }
                html.push(tpl.replace('#url#', bannerdata[i].surl).replace('#img#', JD.img.getImgUrl(bannerdata[i].simg)));

                nav_bar.append('<b></b>');
            }

           
            window.checkTopBannerLoad = function() {
                iLoaded++;
                if (iLoaded !== (bannerdata.length - (window.GLOBAL_BANNER_BEGIN || 0))) {
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
                        fun: function(index) {
                            //$(".tit_list .cur").removeClass('cur');
                            //$('.tit_list>div.tit').eq(index-1).addClass('cur');
                        }
                    });
                    $("#spring_banner .switch").on('click', '.left,.right', function() {
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
            }

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
        window.checkSexCB = function(json) {
            var sexType = 0; //0:未知,1:男性，2：女性
            if (json.retcode == 0) {
                for (var i = 0, len = json.matchres.length; i < len; i++) {
                    if (json.matchres[i].bizid == 12) { //男性
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
        }

        ls.loadScript({
            url: "http://wq.jd.com/mcoss/directplat/usrgdirect?gb=103:12&callback=checkSexCB" + "&t=" + new Date().getTime()
        });
    }

    function headSpringInit() {
        var tabid = JD.url.getUrlParam("tabid");
        var title = JD.url.getUrlParam("title");
        var grayFunc = function(){
            var vk = JD.cookie.get("visitkey");
            var vkSp;
            if (vk) {
                vk = vk + "";
                vkSp = vk.slice(vk.length - 1);
                return vkSp ? (vkSp < 5) : (Math.random() < 0.5);
            } else {
                return Math.random() < 0.5;
            }
        };
       

        bannerdata = selectDataByTime(g_spring_banner);

        if ( (window.XIN_BANNER &&window.XIN_BANNER.length>0 ) || ((tabid == "13" ||window.GLOBAL_WX_HEADER) && !title) ) {//XIN_BANNER
            var nowdate = new Date();
            var diffday = parseInt(Math.abs(new Date() - new Date("2016/01/22")) / 1000 / 60 / 60 / 24) + 19;
            var grayFlag = window.ppms_cnxh && window.ppms_cnxh[1] && window.ppms_cnxh[1].isShowCNXH * 1;
            
            if( (tabid == "13" && grayFlag) ){//
                var gray = grayFunc();
                if(gray){
                    selectTab(bannerdata);
                }else{
                    var randomIndex = parseInt(Math.random() * bannerdata.length) + 1;
                    randomIndex==1&&JD.report.rd("37035.4.1");
                    loadsbanner(bannerdata, randomIndex);
                }
            }else{
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

            $(window).on("hashchange", function(e) {
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

    exports.init = function() {

        JD.events.listen("event_wxmenusearh", function() {
            JD.events.trigger("event_wxsearchbar");
        });
        JD.events.trigger("event_wxsearchbar");


        /* s1 = _iscroll.init("#yScroll1", opt);
         setSideMenu();*/

    };
});