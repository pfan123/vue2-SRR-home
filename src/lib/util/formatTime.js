export default function formatTime(format, dateObj){
	var dateObj = dateObj || new Date();

	var o = {
      "M+": dateObj.getMonth() + 1, //month
      "d+": dateObj.getDate(), //day
      "h+": dateObj.getHours(), //hour
      "m+": dateObj.getMinutes(), //minute
      "s+": dateObj.getSeconds(), //second
      "q+": Math.floor((dateObj.getMonth() + 3) / 3), //quarter
      "S": dateObj.getMilliseconds() //millisecond
    }

    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (dateObj.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp("(" + k + ")").test(format))
        format = format.replace(RegExp.$1,
          RegExp.$1.length == 1 ? o[k] :
          ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}