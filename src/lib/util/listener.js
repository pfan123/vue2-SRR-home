var listener = (function(){
	var dispatchList = {};	
	
	var fireTaskList = [];
	var fireTaskTimer;
	
	function runFireTaskList(){
		if (fireTaskList.length == 0) {
			return;
		}
		clearTimeout(fireTaskTimer);
		var curFireTask = fireTaskList.splice(0, 1)[0];
		try{
			curFireTask['func'].apply(curFireTask['func'], [].concat(curFireTask['data']));
		}catch(exp){
			console.log('[error][listener]: One of ' + curFireTask + '-' + curFireTask + ' function execute error.');
		}
		
		
		fireTaskTimer = setTimeout(runFireTaskList, 25);
	}
	
	var dispatch = {
		register: function(sChannel, sEventType, fCallBack){
			dispatchList[sChannel] = dispatchList[sChannel] || {};
			dispatchList[sChannel][sEventType] = dispatchList[sChannel][sEventType] || [];
			dispatchList[sChannel][sEventType].push(fCallBack);
		},
		fire: function(sChannel, sEventType, oData){
			var funcArray;
			var i, len;
			if (dispatchList[sChannel] && dispatchList[sChannel][sEventType] && dispatchList[sChannel][sEventType].length > 0) {
				funcArray = dispatchList[sChannel][sEventType];
				funcArray.data_cache = oData;
				for (i = 0, len = funcArray.length; i < len; i++) {
					fireTaskList.push({
						channel: sChannel,
						evt:sEventType,
						func: funcArray[i],
						data: oData
					});
				}
				runFireTaskList();
			}
		},
		remove: function(sChannel, sEventType, fCallBack){
			if (dispatchList[sChannel]) {
				if (dispatchList[sChannel][sEventType]) {
					for (var i = 0, len = dispatchList[sChannel][sEventType].length; i < len; i++) {
						if (dispatchList[sChannel][sEventType][i] === fCallBack) {
							dispatchList[sChannel][sEventType].splice(i, 1);
							break;
						}
					}
				}
			}
		},
		list: function(){
			return dispatchList;
		},
		cache: function(sChannel, sEventType){

			if (dispatchList[sChannel] && dispatchList[sChannel][sEventType]) {
				return dispatchList[sChannel][sEventType].data_cache;
			}

		}
	};
	return dispatch;
})();
export { listener }