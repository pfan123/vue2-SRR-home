/**
 * JSON 克隆
 * @param {Object | Json} jsonObj json对象
 * @return {Object | Json} 新的json对象
 * @author chenpan@jd.com
 */
export default function clone(jsonObj) {
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