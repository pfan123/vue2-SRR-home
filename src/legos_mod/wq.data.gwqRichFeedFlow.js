define('wq.data.gwqRichFeedFlow', function (require, exports, module) {

"use strict";
require('./ES6Function');
 /**
                               * 购物圈长文章数据组件
                               * @version 2016/12/27
                               * @author luowenlin1
                               *
                               */
var _cacheThisModule_;
var util = require("./wq.data.gwqUtil");
var windowWidth = document.body.clientWidth;
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
    opt.feedType = 2;
    var success = typeof opt.success == "function" ? opt.success : function () {};
    var error = typeof opt.error == "function" ? opt.error : function () {};
    var resultData = [];
    var retryCount = 1,
        notFull = 3;
    opt.pageNo = opt.pageNo ? opt.pageNo : 1;
    opt.pageSize = opt.pageSize ? opt.pageSize : 5;
    +function gd() {
        opt.success = function (datas) {
            if (!datas || datas.length == 0) {
                success([]);
                return;
            }
            datas.map(function (item) {
                if (item.sharetype != "106000040") return;
                var fi = new FeedRichItem(item, {}, opt);
                fi.extendInfo(); //处理长文章扩展信息
                fi.head();
                fi.content();
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
var FeedRichItem = function (_util$FeedItem) {
    _inherits(FeedRichItem, _util$FeedItem);

    function FeedRichItem(item, newItem, opt) {
        _classCallCheck(this, FeedRichItem);

        var _this = _possibleConstructorReturn(this, (FeedRichItem.__proto__ || Object.getPrototypeOf(FeedRichItem)).call(this, item, newItem, opt));

        _this.newItem = newItem;
        _this.item = item;
        _this.opt = opt;
        return _this;
    }

    _createClass(FeedRichItem, [{
        key: "extendInfo",
        value: function extendInfo() {
            var _this2 = this;

            try {
                var tempdata = JSON.parse(this.item.ext_sharedata || '[]');
                tempdata && tempdata.length > 0 && tempdata.some(function (m) {
                    if (m.type == 3) {
                        _this2.newItem.videoId = m.VideoId;
                        !_this2.opt.hideFeedType && (_this2.newItem.feedType = m.subType);
                        if (m.skuids && !_this2.opt.hideQdGoods) _this2.newItem.skuids = m.skuids.split(",");
                        _this2.newItem.matchInfo = m.TagInfo;
                        return true;
                    }
                    return false;
                });
                if (this.newItem.matchInfo && this.newItem.matchInfo.length > 0) {
                    var w = (windowWidth - 20) / 100;
                    this.newItem.matchInfo.map(function (m) {
                        var width = util.getStrByteLen(m.name) * 6 + 35;

                        var cls = "left";
                        var style = "top:" + m.y + "%";
                        var x = 100 - parseInt(m.x);
                        if (parseInt(m.x) > 55 && w * x < width) {
                            //右边宽度小于文字宽度
                            cls = "right";
                            style += ";right:" + x + "%";
                            style += ';margin-right:20px';
                        } else {
                            style += ";left:" + m.x + "%";
                            style += ";margin-left:20px";
                        }

                        if (parseInt(m.y) > 70) {
                            style += ";margin-top:0px";
                        } else {
                            style += ";margin-top:-10px";
                        }
                        m.style = style;
                        m.cls = cls;
                    });
                }
            } catch (ex) {
                console.log('parse extsharedata出错啦', ex);
            }
        }
    }, {
        key: "content",
        value: function content() {
            _get(FeedRichItem.prototype.__proto__ || Object.getPrototypeOf(FeedRichItem.prototype), "content", this).call(this);
            //封面
            !this.opt.hideCover && (this.newItem.coverImg = this.newItem.sharePic && this.newItem.sharePic[0] || '');
            this.newItem.abstractLine = this.opt.abstractLine ? this.opt.abstractLine : 2;
            //长文章，title不显示tag，
            if (!this.opt.hideTitle) {
                if (this.newItem.tagList.length > 0) {
                    var temp = this.newItem.tagList[this.newItem.tagList.length - 1].text;
                    var index1 = this.item['commentcontent'] && this.item['commentcontent'].indexOf(temp);
                    this.newItem['contentTitle'] = this.item['commentcontent'].substring(index1 + temp.length);
                } else {
                    this.newItem['contentTitle'] = this.item['commentcontent'];
                }
            }
            this.opt.hideTag && this.newItem.tagList && delete this.newItem.tagList;
            !this.opt.hideAbstract && (this.newItem.abstract = this.item.firsttext);
            this.opt.hidePic && delete this.newItem.sharePic;
            var obj = util.parseContent(this.newItem['abstract'], this.newItem.abstractLine);
            this.newItem.showText = util.xss(obj.showTxt, 'htmlEp');
            this.newItem.hideText = util.xss(obj.hideTxt, 'htmlEp');
        }
    }]);

    return FeedRichItem;
}(util.FeedItem);
exports.FeedRichItem = FeedRichItem;});