define('wq.data.gwqShortFeedFlow', function (require, exports, module) {

"use strict";
require('./ES6Function');
 /**
                               * 购物圈短文章数据组件
                               * @version 2016/12/26
                               * @author luowenlin1
                               *
                               */
var _cacheThisModule_;
var util = require("./wq.data.gwqUtil");
var faceData = require('./wq.gwq.face.data');
/**
    参考wq.data.gwqDemo.js模块
    @param:opt
    type 1 静态文件，2动态接口 默认静态文件
    cateId 必传，类目编号，精选为 1
    pageNo 1 默认为1
    pageSize 5 默认为5
    isBi 0,1 默认不使用BI
    feedType 默认是 长短混合 1 短文章，2长文章
    shareId  如果是获取类目数据且为动态接口，则可以置顶该shareId
    success 成功回调
    error 失败回调
*/
exports.getData = function (opt) {
    if (!opt) opt = {};
    opt.feedType = 1;
    var success = typeof opt.success == "function" ? opt.success : function () {};
    var error = typeof opt.error == "function" ? opt.error : function () {};
    var retryCount = 1,
        notFull = 3;
    var resultData = [];
    opt.pageNo = opt.pageNo ? opt.pageNo : 1;
    opt.pageSize = opt.pageSize ? opt.pageSize : 5;
    +function gd() {
        opt.success = function (datas) {
            if (!datas || datas.length == 0) {
                success([]);
                return;
            }
            datas.map(function (item) {
                if (item.sharetype == "106000040") return;
                var fi = new FeedShortItem(item, {}, opt);
                fi.head();
                fi.content();
                fi.goods();
                fi.action();
                resultData.push(fi.getItem());
            });
            notFull--;
            if (resultData.length < opt.pageSize && notFull > 0) {
                //补偿
                opt.pageNo++;
                gd();
            } else {
                if (opt.pageSize < resultData.length) resultData.length = opt.pageSize;
                success(resultData);
            }
        };
        opt.error = function (ret) {
            if (retryCount > 0) {
                retryCount--;
                gd();
            } else {
                if (resultData.length == 0) {
                    error(ret);
                } else {
                    success(resultData);
                }
            }
        };
        util.getData(opt);
    }();
};
var FeedShortItem = function (_util$FeedItem) {
    _inherits(FeedShortItem, _util$FeedItem);

    function FeedShortItem(item, newItem, opt) {
        _classCallCheck(this, FeedShortItem);

        var _this = _possibleConstructorReturn(this, (FeedShortItem.__proto__ || Object.getPrototypeOf(FeedShortItem)).call(this, item, newItem, opt));

        _this.newItem = newItem;
        _this.item = item;
        _this.opt = opt;
        !_this.opt.hideFeedType && (_this.newItem.feedType = 0); //短文章晒单
        _this.newItem.title = _this.item.title;
        return _this;
    }

    _createClass(FeedShortItem, [{
        key: "content",
        value: function content() {
            _get(FeedShortItem.prototype.__proto__ || Object.getPrototypeOf(FeedShortItem.prototype), "content", this).call(this);
            this.newItem.textLine = this.opt.textLine ? this.opt.textLine : 3;
            if (!this.opt.hideContent) {
                if (this.newItem.tagList.length > 0) {
                    var temp = this.newItem.tagList[this.newItem.tagList.length - 1].text;
                    var index1 = this.item['commentcontent'] && this.item['commentcontent'].indexOf(temp);
                    this.newItem['content'] = this.item['commentcontent'].substring(index1 + temp.length);
                } else {
                    this.newItem['content'] = this.item['commentcontent'];
                }
                var obj = util.parseContent(this.newItem['content'], this.newItem.textLine);
                this.newItem.showText = text2pic(util.xss(obj.showTxt, 'htmlEp'));
                this.newItem.hideText = text2pic(util.xss(obj.hideTxt, 'htmlEp'));
                this.newItem['content'] = this.newItem['content'].replace(/&&&/g, '<br/>');
                this.newItem['content'] = text2pic(util.xss(this.newItem['content'], 'htmlEp'));
            }
            //是否存在详情链接
            this.newItem.contentLink = this.opt.hideContentLink ? "" : this.item.contentlink;
            this.newItem.videoUrl = this.opt.hideVideo ? "" : util.removeProto(this.item.videourl);
            //多个图片
            //根据屏幕大小计算图片宽度： li的padding为2px, 祖先div的padding为10px
            this.newItem.sharePicWidth = ~~((window.innerHeight - 10 * 2 - 2 * 2 * 3) / 3);
            this.opt.hideTag && this.newItem.tagList && delete this.newItem.tagList;
            this.opt.hidePic && delete this.newItem.sharePic;
            this.opt.hidePicNum && (this.newItem.hidePicNum = this.opt.hidePicNum);
        }
    }, {
        key: "goods",
        value: function goods() {
            var _this2 = this;

            var data = this.item.ext_sharedata;
            try {
                typeof data == "string" && (data = JSON.parse(data));
            } catch (e) {}
            if (!data || data.length == 0 || this.opt.hideGoods || !data[0] || !data[0].content || data[0].content.length == 0) return;
            this.newItem.goods = [];
            var skuids = "";
            data[0].content.map(function (temp, i) {
                //content里有些元素没有商品，跳过
                if (!temp.skuid || temp.skuid == 0) {
                    return;
                }
                if (i == 0) {
                    skuids = temp.skuid;
                } else {
                    skuids += "," + temp.skuid;
                }
                if (_this2.item.userlevel == 4) {
                    temp.JLXUrl = '';
                }
                //显示跟随购买
                if (!_this2.opt.hideJdBeans && i == 0 && _this2.item.followbuys > 0 && (gwq.followBuySence || !temp.JLXUrl)) {
                    temp.followBuys = _this2.item.followbuys;
                } else {
                    temp.followBuys = "";
                }
                temp.skuPicUrl = util.getScaleImg(temp.skupicurl);
                temp.skuUrl = getSkuToUrl(temp, _this2.newItem);
                temp.price = "";
                temp.jdBeans = "";

                _this2.newItem.goods.push(temp);
            });
            this.newItem.skuids = skuids;
            this.newItem.goodsShowNum = 1;
        }
    }]);

    return FeedShortItem;
}(util.FeedItem);
exports.FeedShortItem = FeedShortItem;
//获取商品详情 链接
function getSkuToUrl(temp, item) {
    var tourl = '';
    //京乐享商品
    if (temp.JLXUrl) {
        tourl = util.removeProto(temp.JLXUrl).replace(/ptag=[^&#]*/g, '');
        if (item.jlxGoodsPtag) {
            if (tourl.indexOf("?") > 0) {
                tourl += "&ptag=" + item.jlxGoodsPtag;
            } else {
                tourl += "?ptag=" + item.jlxGoodsPtag;
            }
        }
    } else {
        //普通商品跳转
        tourl = "//wqitem.jd.com/item/view?ptag=" + item.goodsPtag + '&sku=' + temp.skuid;
    }
    return tourl += '&GROUP=' + item.shareid + '_' + temp.skuid;
}
function text2pic(txt) {
    var d;
    if (!txt) {
        return '';
    }
    var _PREFIX = '//wq.360buyimg.com/fd/wx/img/gwq/face/',
        _SUFFIX = ".png";
    txt = txt.replace(/\[([^\]]+)\]/g, function (v1, v2) {
        //v1： [微笑]   v2：微笑
        d = faceData[v2];
        return d ? '<img src="' + _PREFIX + d[0] + _SUFFIX + '" />' : v1;
    });
    return txt;
}});