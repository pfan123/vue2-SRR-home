/**
* getUniqueKey()
*
*/
var _loadTime = (new Date()).getTime().toString(), _i = 1;
export default function getUniqueKey(){
	return _loadTime + (_i++);
}