define('wq.data.gwqTopicFeeds', function (require, exports, module) {

"use strict";
require('./ES6Function');
 /**
                               * 购物圈话题组件
                               * @version 2017/1/5
                               * @author luowenlin1
                               *
                               */
var _cacheThisModule_;
var ajax = require("./ajax");
var short = require("./wq.data.gwqShortFeedFlow");
var rich = require("./wq.data.gwqRichFeedFlow");
module.exports = {
    getTopicList: getTopicList,
    getFeedsByShareid: getFeedsByShareid
};
/**
	 参考wq.data.gwqDemo.js模块
shareids          指定的文章id
success  成功回调
error  失败回调
*/
function getFeedsByShareid(opt) {
    if (!opt || !opt.shareids) return;
    if (!window.gwq) {
        console.log('%c请引入购物圈容灾页面片', 'font-size:50px;color:red;width:130px; height:130px; border:2px solid black;');
        return;
    }
    var success = typeof opt.success == "function" ? opt.success : function () {};
    var param = {};
    param.url = '//wq.jd.com/shopgroup_api_feed/GetActvieFeeds';
    param.dataType = 'jsonp';
    param.data = { shareids: opt.shareids };
    var p = { bizid: '324', source: '0', operation: 7, message: 'ok', result: 0 };
    param.success = function (datas) {
        if (!datas || !datas.feed_list || datas.feed_list.length == 0) {
            success([]);
            p.message = opt.shareids + ",empty";
            JD.report.umpBiz(p);
            return;
        }
        var resultData = [];
        datas.feed_list.map(function (item) {
            if (item.sharetype == "106000040") {
                //长文章
                var _fi = new rich.FeedRichItem(item, {}, opt);
                _fi.extendInfo(); //处理长文章扩展信息
                _fi.head();
                _fi.content();
                _fi.action();
                resultData.push(_fi.getItem());
                return;
            }
            var fi = new short.FeedShortItem(item, {}, opt);
            fi.head();
            fi.content();
            fi.goods();
            fi.action();
            resultData.push(fi.getItem());
        });
        typeof opt.success == "function" && opt.success(resultData);
        JD.report.umpBiz(p);
    };
    param.error = function (ret) {
        p.result = 1;
        JD.report.umpBiz(p);
        typeof opt.error == "function" && opt.error(ret);
    };
    ajax.retryCount = 1;
    ajax.load(param);
}
/**
pageNo           页码（必选 >0）
pageSize         每页feed数（默认值12）
tagid            话题id（必选）
shareid          指定置顶的shareid (非必选)
feedtype         拉取文章类型(非必选，默认为0，  0:长短文章混排，1：短文章， 2：长文章)
    compensate       补偿次数，最大3次，默认2次。。当请求接口返回的数据不足以你的pageSize的时候
                    只查询一页数据的时候使用，如果查询多页数据会重复
success  成功回调
error  失败回调
*/
function getTopicList(opt) {
    if (!opt || !opt.tagid) return;
    if (!window.gwq) {
        console.log('%c请引入购物圈容灾页面片', 'font-size:50px;color:red;width:130px; height:130px; border:2px solid black;');
        return;
    }
    if (!opt.feedtype) opt.feedtype = 0;
    if (!opt.pageNo) opt.pageNo = 1;
    if (!opt.pageSize) opt.pageSize = 12;
    var success = typeof opt.success == "function" ? opt.success : function () {};
    var error = typeof opt.error == "function" ? opt.error : function () {};
    var retryCount = 1,
        fullCount = 2,
        index = 0;
    if (opt.compensate >= 0) {
        fullCount = opt.compensate > 3 ? 3 : opt.compensate;
    }
    var resultDataObj = {};
    +function gd() {
        opt.success = function (datas) {
            if (index == 0 && datas) {
                resultDataObj = datas;
            }
            if (!datas || !datas.feed_list || datas.feed_list.length == 0) {
                success(resultDataObj);
                return;
            }
            var resultData = [];
            datas.feed_list.map(function (item) {
                if (item.sharetype == "106000040") {
                    //长文章
                    var _fi2 = new rich.FeedRichItem(item, {}, opt);
                    _fi2.extendInfo(); //处理长文章扩展信息
                    _fi2.head();
                    _fi2.content();
                    _fi2.action();
                    resultData.push(_fi2.getItem());
                    return;
                }
                var fi = new short.FeedShortItem(item, {}, opt);
                fi.head();
                fi.content();
                fi.goods();
                fi.action();
                resultData.push(fi.getItem());
            });
            if (index == 0) resultDataObj.feed_list = resultData;else Array.prototype.push.apply(resultDataObj.feed_list, resultData);

            index++;
            if (resultData.length < opt.pageSize && index < fullCount) {
                //补偿
                opt.pageNo++;
                gd();
            } else {
                if (opt.pageSize < resultDataObj.feed_list.length) resultDataObj.feed_list.length = opt.pageSize;
                success(resultDataObj);
            }
        };
        opt.error = function (ret) {
            if (retryCount > 0) {
                retryCount--;
                gd();
            } else {
                if (resultDataObj.feed_list) success(resultDataObj);else error(resultDataObj);
            }
        };
        getData(opt);
    }();
}
function getData(opt) {
    var param = {};
    param.error = function (ret) {
        var p = {
            bizid: '324',
            source: '0',
            result: 1,
            message: ret + "," + param.url,
            operation: 7
        };
        JD.report.umpBiz(p);
        errorHanld(ret);
    };
    param.url = '//wq.jd.com/shopgroup_feed/GetTopicListPlus';
    param.dataType = 'jsonp';
    param.data = { feedtype: opt.feedtype, pageno: opt.pageNo, pagesize: opt.pageSize, tagid: opt.tagid };
    if (opt.shareid) param.data.shareid = opt.shareid;
    param.success = function (json) {
        console.log('getData, ajax End,ret' + json['iRet']);
        var p = {
            bizid: '324',
            source: '0',
            message: opt.type + "," + json['iRet']
        };
        p.operation = 7;
        if (json['iRet'] == 0) {
            p.result = 0;
            if (!json['feed_list'] && opt.pageNo == 1) {
                //第一页为空，认为是异常
                p.result = 1;
                p.message = param.url + ",empty";
                errorHanld(p.message);
            } else {
                typeof opt.success == "function" && opt.success(json);
            }
        } else {
            p.result = 1;
            errorHanld(p.message);
        }
        JD.report.umpBiz(p);
    };
    ajax.retryCount = 1;
    ajax.load(param);
    function errorHanld(msg) {
        typeof opt.error == "function" && opt.error({ iRet: 1, msg: msg });
    }
}});