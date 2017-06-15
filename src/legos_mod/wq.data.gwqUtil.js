define('wq.data.gwqUtil', function (require, exports, module) {

"use strict";
require('./ES6Function');
 /**
                               * 购物圈获取数据，请勿直接引用这个文件
                               * @version 2016/12/26
                               * @author luowenlin1
                               *
                               */
var _cacheThisModule_;
var ajax = require("./ajax");
var currtime = parseInt(Date.now() / 1000);
var ajaxUrl = ['//wq.jd.com/shopgroup_feed/GetFeedListPlus', '//wq.360buyimg.com/data/gwq/GetFeedList_{#pageno#}.jsonp', '//wq.360buyimg.com/data/gwq/GetFeedList_{#pageno#}_long.jsonp', '//wq.360buyimg.com/data/gwq/GetFeedList_{#pageno#}_short.jsonp', '//wq.jd.com/shopgroup_feed/GetCategoryFeedsPlus', '//wq.360buyimg.com/data/gwq/GetCategoryFeeds_{#cateid#}_{#pageno#}.jsonp', '//wq.360buyimg.com/data/gwq/GetCategoryFeeds_{#cateid#}_{#pageno#}_long.jsonp', '//wq.360buyimg.com/data/gwq/GetCategoryFeeds_{#cateid#}_{#pageno#}_short.jsonp'];

module.exports = {
    getData: getData,
    removeProto: removeProto,
    getScaleImg: getScaleImg,
    xss: xss,
    getTagInfo: getTagInfo,
    formatImgUrl: formatImgUrl,
    getStrByteLen: getStrByteLen,
    parseContent: parseContent
};
/**
    param:opt
    type 1 静态文件，2动态接口 默认静态文件
    cateId 必传，类目编号，精选为 1
    pageNo 1 默认为1
    pageSize 5 默认为5
    isBi 0,1 默认不使用BI
    feedType 默认是 0长短混合 1 短文章，2长文章
    shareId  如果是获取类目数据，则可以置顶该shareId
    success 成功回调
    error 失败回调
*/
function getData(opt) {
    if (!opt || !opt.cateId) return;

    var index = 0;
    var indexBack = -1;
    if (!window.gwq) {
        console.log('%c请引入购物圈容灾页面片', 'font-size:50px;color:red;width:130px; height:130px; border:2px solid black;');
        return;
    }
    if (window.gwq.square == 1 || opt.type != 2) {
        //容灾，直接请求jsonp文件
        index = opt.cateId == 1 ? 1 : 3;
        if (opt.cateId == 1) {
            //精选
            if (opt.feedType == 1) {
                //短文章
                index = 3;
            } else if (opt.feedType == 2) {
                //长文章
                index = 2;
            } else {
                //混合
                index = 1;
            }
            indexBack = 1;
        } else {
            if (opt.feedType == 1) {
                //短文章
                index = 7;
            } else if (opt.feedType == 2) {
                //长文章
                index = 6;
            } else {
                //混合
                index = 5;
            }
            indexBack = 4;
        }
    } else {
        if (opt.cateId == 1) {
            //精选
            index = 0;
            indexBack = 1;
        } else {
            //类目
            index = 4;
            indexBack = 5;
        }
    }
    if ([0, 1].indexOf(window.gwq.isBi) >= 0) {
        //配置强制走BI与否，则按配置的来
        opt.isBi = window.gwq.isBi;
    } else {
        opt.isBi = opt.isBi == 1 ? 1 : 0;
    }
    loadData(opt, index, indexBack, 0);
};
function loadData(opt, index, indexBack, count) {
    var param = {},
        loadIndex = 0,
        ajaxType = 1;

    if (count == 1) {
        loadIndex = indexBack;
    } else {
        loadIndex = index;
    }
    param.url = ajaxUrl[loadIndex];
    param.dataType = "jsonp";

    param.timeout = 15;
    param.data = { bi: opt.isBi, feedtype: opt.feedType };

    opt.pageNo = opt.pageNo ? opt.pageNo : 1;
    opt.pageSize = opt.pageSize ? opt.pageSize : 5;
    if ([0, 4].indexOf(loadIndex) >= 0) {
        //动态接口
        param.data.pageno = opt.pageNo;
        param.data.pagesize = opt.pageSize;
        loadIndex == 4 && (param.data.cateid = opt.cateId); //动态类目
        opt.shareId && (param.data.shareid = opt.shareId); //置顶shareid
    } else {
        //jsonp
        param.url = param.url.replace(/{#pageno#}/, opt.pageNo);
        param.url = param.url.replace(/{#cateid#}/, opt.cateId);
        ajaxType = 2;
    }
    if ([0, 1].indexOf(loadIndex) >= 0) {
        param.jsonpCallback = "GetFeedList"; //
        ump(1);
    } else if ([2, 3].indexOf(loadIndex) >= 0) {
        //long short
        param.jsonpCallback = "GetFeedListPlus"; //
        ump(1);
    } else if (loadIndex == 4) {
        param.jsonpCallback = "square"; //
        ump(2);
    } else if (loadIndex == 5) {
        param.jsonpCallback = 'GetCategoryFeeds';
        ump(2);
    } else {
        param.jsonpCallback = 'GetCategoryFeedsPlus';
        ump(2);
    }
    param.error = function (ret) {
        var p = {
            bizid: '324',
            source: '0',
            result: 1,
            message: ret + "," + param.url,
            operation: ajaxType
        };
        JD.report.umpBiz(p);
        errorHanld(ret);
    };
    param.success = function (json) {
        console.log('gwqAjaxUtil loadData, ajax End,ret' + json['iRet']);
        var p = {
            bizid: '324',
            source: '0',
            message: opt.type + "," + json['iRet']
        };
        p.operation = ajaxType; //2 是jsonp,1是动态接口
        if (json['iRet'] == 0) {
            p.result = 0;
            if (!json['feed_list'] && opt.pageNo == 1) {
                //第一页为空，认为是异常
                p.result = 1;
                p.message = param.url + ",empty";
                errorHanld(p.message);
            } else {
                ajaxType == 2 && json['feed_list'].map(function (item) {
                    item.currtime = currtime;
                });
                typeof opt.success == "function" && opt.success(json['feed_list']);
            }
        } else {
            p.result = 1;
            errorHanld(p.message);
        }
        JD.report.umpBiz(p);
    };
    ajax.load(param);
    ump(0);
    function errorHanld(ret) {
        console.log('gwqAjaxUtil, loadData error,err:');
        if (indexBack >= 0 && !count && opt.pageNo <= 10) {
            //非容灾模式 容灾最多10页文件
            loadData(opt, index, indexBack, 1); //如果异常，则发起容灾模式请求数据
        } else {
            typeof opt.error == "function" && opt.error({ "iRet": 1, errmsg: ret });
        }
    }
    function ump(result) {
        JD.report.umpBiz({ bizid: 324, source: 0, result: result, operation: 3, message: '' });
    }
}
var _head = {
    //随机昵称
    randomNick: ['剁手党'],
    //随机头像组合
    randomPic: ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png'],
    //用户级别：1普通用户，2达人，3小编    ,4明星，5认证
    nickCls: ['', '', '', 'jd_editor'],
    //用户性别：1男 2女
    sexCls: ['', 'man', 'woman'],
    //用户级别：  1普通用户，2达人，3小编  ,4明星，5认证 名人6，专家7，设计师8
    levelCls: ['', '', 'mod_id_daren', 'mod_id_xiaobian', 'mod_id', 'mod_id_renzheng', 'mod_id', 'mod_id', 'mod_id']
},
    _txt = {
    //文案 标示
    mark: ['', ['精华', 'mk_red'], ['新鲜', 'mk_green'], ['人气', 'mk_orange']]
};
module.exports.FeedItem = function () {
    function FeedItem(item, newItem, opt) {
        _classCallCheck(this, FeedItem);

        this.item = item;
        this.newItem = newItem;
        this.opt = opt;
        this.newItem.currtime = this.item.currtime;
        this.newItem.shareid = this.item.shareid;
        //来自 编辑精选 微信好友
        if (!this.opt.hideSource) {
            if (this.item.fromdiscovery == 1) {
                this.newItem.source = "编辑精选";
            } else {
                if (this.item.chainFrom == 1) {
                    this.newItem.source = "微信好友";
                } else if (this.item.chainFrom == 2) {
                    this.newItem.source = "关注好友";
                } else {
                    this.newItem.source = "购物圈";
                }
            }
        }
        //过滤自己的feed为已关注
        if (getOpenid() == this.item.openid) {
            this.newItem.selfFeed = 1;
        }
        this.newItem.wid = this.item.wid;
        this.newItem.shareType = this.item.sharetype;
        this.newItem.isFollow = this.item.follow;
        this.newItem.isPraise = this.item.commentid > 0 ? 1 : 0;
        this.newItem.isReward = this.item.isreward;
        this.newItem.commentId = this.item.commentid;
        this.newItem.praiseNum = this.item.praisenum;
        this.newItem.rewardNum = this.item.rewardnum;
        this.newItem.openid = this.item.openid;
        this.newItem.wid = this.item.wid;
        this.newItem.tagList = getTagInfo(this.item['tagids'], this.item['commentcontent']);
        this.newItem.unionId = this.item.unionId;
        this.newItem.commentNum = this.item.squarecommentnum;
        this.item.viewnum&&(this.newItem.viewNum = this.item.viewnum);
    }

    _createClass(FeedItem, [{
        key: 'getItem',
        value: function getItem() {
            return this.newItem;
        }
    }, {
        key: 'head',
        value: function head() {
            handleHead(this.item, this.newItem, this.opt);
        }
    }, {
        key: 'content',
        value: function content() {
            var _size = "s240x240_";
            if (this.item.sharepicurl && this.item.sharepicurl.split(",").length == 1) {
                _size = "s640x640_";
            }
            this.newItem.sharePic = getHandleImg(this.item.sharepicurl, _size, true);
            // 分享图片跳转链接
            var shareDetailUrl = getSharepicToUrl(this.item);
            if (this.opt.shareDetailPtag && shareDetailUrl != "javascript:;") shareDetailUrl += "&ptag" + this.opt.shareDetailPtag;
            this.newItem.shareDetailUrl = shareDetailUrl;
            var footFlag = _txt.mark[this.item.superflagid];
            if (footFlag && !this.opt.hideMark) {
                this.newItem.markTxt = footFlag[0];
                this.newItem.markCls = footFlag[1];
            }
            this.newItem.tagids = this.item.tagids;
        }
        //生成 分享 点赞-评论-分享

    }, {
        key: 'action',
        value: function action() {
            //是否显示 点赞-评论-分享 ：容灾模式开关打开，则不显示
            if (gwq.praise_cmt == 1 || this.opt.hideAction) {
                this.newItem.hideAction = 1;
                return;
            }
            //点赞数
            this.newItem.praiseTxt = +this.item.praisenum ? this.item.praisenum : '赞';
            //评论数
            this.newItem.commentTxt = +this.item.squarecommentnum ? this.item.squarecommentnum : '评论';
            if (this.item.isreward > 0 && this.item.rewardnum == 1) {
                this.newItem.rewardTxt = "已打赏";
            } else {
                this.newItem.rewardTxt = +this.item.rewardnum ? this.item.rewardnum : '打赏';
            }
        }
    }]);

    return FeedItem;
}();
function handleHead(item, newItem, opt) {
    //x天前/昨天/x秒前/x分钟前/x小时前
    if (item.sharetime && item.currtime && !window.gwq.hideTime && !opt.hideTimeStamp) {
        newItem.timeStamp = getTimeBefore(item.sharetime, item.currtime);
    }
    if (opt.hideHead) {
        newItem.hideHead = opt.hideHead;
        return;
    }

    if (window.gwq.mine == 1) {
        //开关强制容灾
        newItem.headUrl = "javascript:;";
    } else {
        newItem.headUrl = '//wqs.jd.com/shopping/mine.html?openid=' + item.openid;
        if (opt.headPtag) {
            newItem.headUrl += '&ptag=' + opt.headPtag;
        }
    }
    //小圈妹妹头像 昵称
    if (item.userlevel == 3) {
        !opt.hideNickName && (newItem.nickName = '小圈妹妹');
        !opt.hideHeadImg && (newItem.headImg = getScaleImg('//wq.360buyimg.com/fd/promote/201508/gwq_v6/img/mm.png'));
    } else {
        !opt.hideHeadImg && (newItem.headImg = headImg(item.headimgurl));
        //显示nickname
        !opt.hideNickName && (newItem.nickName = xss(decodeText(cutStr(item.nickname || getArrRandom(_head.randomNick), 20))));
    }

    //昵称样式
    newItem.nickCls = _head.nickCls[item.userlevel] || '';
    newItem.sexCls = _head.sexCls[item.usersex] || '';
    //级别样式
    //用户级别：  1普通用户，2达人，3小编  ,4明星，5认证 名人6，专家7，设计师8
    if (opt.hideWatch) newItem.hideWatch = opt.hideWatch;
    if (!opt.hideLevel) {
        switch (item.userlevel) {
            case 2:
                newItem.levelCls = "mod_id mod_id_daren";
                newItem.levelName = "达人";
                break;
            case 3:
                newItem.levelCls = "mod_id mod_id_xiaobian";
                newItem.levelName = "小编";
                break;
            case 4:
                newItem.levelCls = "mod_id";
                newItem.levelName = "明星";
                break;
            case 5:
            case 9:
                newItem.levelCls = "mod_id mod_id_renzheng";
                newItem.levelName = "认证";
                break;
            case 6:
                newItem.levelCls = "mod_id";
                newItem.levelName = "名人";
                break;
            case 7:
                newItem.levelCls = "mod_id";
                newItem.levelName = "专家";
                break;
            case 8:
                newItem.levelCls = "mod_id";
                newItem.levelName = "设计师";
                break;
            case '':
            case 1:
            default:
                newItem.levelCls = "";
                newItem.levelName = "";
                break;
        }
    }
}
function headImg(img) {
    if (!img) return getScaleImg("//wq.360buyimg.com/fd/promote/201503/gwq/img/placeholder/ava_" + getArrRandom(_head.randomPic));
    img = img.replace(/\/0$/, '/64').replace(/^http(s)?:/, "");
    var r = img.match(/\/s(\d{1,})x(\d{1,})_jfs\//i);
    if (!r || r.length != 3) return getScaleImg(img);
    return getScaleImg(img.replace(r[0], "/s64x64_jfs/"));
}
//为了压缩
function getScaleImg(img) {
    return JD.img.getScaleImg(img);
}
function getArrRandom(arr) {
    return Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : '';
}
//去掉http: https头协议
function removeProto(url) {
    return url ? url.replace(/^http(s)?:/, '') : '';
}
/**
 * 剪字符串，超出补...
 * @param str     原串
 * @param maxLen   最大长度,默认7
 * @param useByteCompare true简单长度比较 false 字节长度比较
 * @returns {*} 缩短后的字符串，默认...
 */
function cutStr(str, maxLen, useSimpleCompare, delimeter) {
    if (!str) return '';
    var strLen = useSimpleCompare ? str.length : getStrByteLen(str);
    maxLen = maxLen || 7;
    delimeter = delimeter || '...';
    return strLen > maxLen ? str.slice(0, maxLen) + delimeter : str;
}

/**
 * 计算字符串字节长度   一个中文按照两个字节
 * @param v
 * @returns {number}
 */
function getStrByteLen(v) {
    //一个中文按照两个字节算，返回长度
    return v ? v.replace(/[\u00FF-\uFFFF]/g, "  ").length : 0;
}
function decodeText(str) {
    try {
        return window.decodeURIComponent(str);
    } catch (e) {
        return str;
    }
}
function xss(str, type) {
    if (type == "htmlEp") {
        return str.replace(/[&'"<>\/\\\-\x00-\x1f\x80-\xff]/g, function (r) {
            return "&#" + r.charCodeAt(0) + ";";
        });
    }

    return str ? str.replace(/[&'"<>\/\\\-\x00-\x09\x0b-\x0c\x1f\x80-\xff]/g, function (r) {
        return "&#" + r.charCodeAt(0) + ";";
    }).replace(/ /g, "&nbsp;").replace(/\r\n/g, "<br />").replace(/\n/g, "<br />").replace(/\r/g, "<br />") : "";
}
/**
 * 格式化时间  返回:  x天前/昨天/x秒前/x分钟前/x小时前
 * @param num    时间秒数
 * @param nowTime   当前时间,默认为客户端时间
 * @returns {string}
 */
function getTimeBefore(num, nowTime) {
    if (!num) return '';
    nowTime = nowTime || ~~(Date.now() / 1000);
    var stamp = nowTime - num;
    if (stamp >= 24 * 60 * 60) {

        var nowDate = new Date(nowTime * 1000);
        var newd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDay());
        dayNum = parseInt(newd / 1000) - num;
        var dayNum = Math.ceil(stamp / (24 * 60 * 60));

        //var dayNum = Math.floor(stamp/(24 * 60 *60));
        if (dayNum <= 1 && dayNum >= 0) {
            return '昨天';
        } else if (dayNum > 1) {
            return Math.floor(dayNum - 1) + "天前";
        }
    }
    if (stamp < 60) {
        return stamp + "秒前";
    }
    if (stamp < 60 * 60) {
        return Math.floor(stamp / 60) + "分钟前";
    }
    return Math.floor(stamp / (60 * 60)) + "小时前";
}
function getOpenid() {
    return JD.cookie.get('open_id') || '';
}
function getHandleImg(img, size, returnArr) {
    //校验参数：这种形式调用 getHandleImg('jfs/xxx', true)
    if (typeof size == 'boolean') {
        returnArr = size;
        size = '';
    }
    if (!img) {
        return '';
    }

    img = Array.isArray(img) ? img : img.split(',');
    img = img.map(function (path) {
        return formatImgUrl(path, size);
    });
    return returnArr ? img : img[0];
}

/**
 * 格式话请求参数
 * @param path
 * @returns {*}
 */
function formatImgUrl(path, size) {
    if (!path) return "";
    //如果已经是// or http:// or https//打头,尝试添加.webp或降质处理
    if (/^(http(s)?:)?\/\//.test(path)) {
        return getScaleImg(path.replace(/^(http(s)?:)/, ""));
    }
    if (!size) {
        //不存在，默认240
        size = 's240x240_';
    } else if (!isNaN(size)) {
        //返回是一个数字
        size = 's' + size + 'x' + size + "_";
    } //否则就是一个完整的size 如  s800x800_
    //以jfs打头：
    if (path.indexOf('jfs') == 0) {
        return getScaleImg('//img1' + ~~(Math.random() * 5) + '.360buyimg.com/evalpic/' + size + path);
    }
    return getScaleImg('//img1' + ~~(Math.random() * 5) + '.360buyimg.com/n2/' + size + path);
}
//获取分享图片的跳转链接
function getSharepicToUrl(item) {
    var tourl;
    if (window.gwq.square && (item.skuid || item.skuids)) {
        var sku = item.skuid;
        if (!sku) {
            sku = item.skuids.split(",")[0];
        }
        tourl = '//wqitem.jd.com/item/view?sku=' + sku + '&GROUP=' + item.shareid + '_' + sku;
        // if(ptag) tourl +='&ptag=' + ptag;
        return tourl;
    }
    if (gwq.square) {
        return "javascript:;";
    }
    tourl = "//wqs.jd.com/shoppingv2/shopping.html#wq.gwq.feeddetail_init_wrapper_nl=1&shareid=" + item.shareid;
    // if(ptag) tourl+="&ptag="+ptag;
    if (item.pps) {
        tourl = tourl + "&pps=" + item.pps;
    }
    return tourl;
}
function getTagInfo(tagidList, contents) {
    var result = [];
    if (!contents || !tagidList) {
        return [];
    }
    //tagidList结构：1.精选[{tagid: xxx}, {tagid: yyy}] , 2.好友 'xx,yy'
    //把tagidList统一称为['xx', 'yy']
    tagidList = tagidList.split(',');
    //由于tagidList和contents里的文案对应恰好倒序，所以 把tagidList倒序 正好就和 contents里的对应一致了
    tagidList.reverse();
    // 转化为['#xx#', '#yy#']格式
    contents = contents.match(/#[^#]*#/g);
    contents && contents.forEach(function (item, idx) {
        if (tagidList[idx] && item) {
            result.push({ id: tagidList[idx], text: item });
        }
    });
    return result;
}
/**
 * 显示和隐藏的文案
 * */
function parseContent(content, maxlen) {
    if (!maxlen) maxlen = 3;
    var w = window.innerWidth > 600 ? 375 : window.innerWidth;
    var subLen = 0,
        oneCount = Math.floor((w - 40 - 10 * 2) / 14),
        obj = {};
    if (!content) {
        return {};
    }
    content = content.trim();
    var s = content.split("&&&");

    //把 &&& 转化为 换行
    content = content.replace(/&&&/g, '\n');
    var temp,
        subLenS = 0;
    for (var i = 0, l = s.length; i < l; i++) {
        subLenS = getStrByteLen(s[i]);
        var max = oneCount * maxlen;
        if (i != 0) {
            subLen++; //补加一个回车
        }
        if (subLenS > max * 2) {
            temp = s[i].substr(0, max);
            temp = max * 2 - getStrByteLen(temp);
            subLen += temp > 0 ? max + Math.floor(temp / 2) - 6 : max - 6;
            break;
        } else {
            subLen += s[i].length;
            maxlen = maxlen - Math.ceil(subLenS / (oneCount * 2));
            if (maxlen == 0) {
                if (subLenS - max * 2 + 6 > oneCount * 2) {
                    subLen = subLen - Math.floor(subLenS - max * 2 + 6 - oneCount * 2);
                }
                break;
            }
        }
    }
    obj.showTxt = content.slice(0, subLen);
    //去掉 文案里面的#xxxx#
    obj.showTxt = xss(obj.showTxt.replace(/(#.*?#)/g, ""), 'htmlEp');
    obj.hideTxt = xss(content.slice(subLen), 'htmlEp');
    return obj;
}});