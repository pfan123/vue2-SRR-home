var con;

// 信息打印
export function log(){
	function getEl(txt){
		var p = document.createElement('p');
			p.style.cssText = '' + 
				'line-height:18px;' + 
				'';
			p.innerHTML = txt;
		return p;
	}
	var arr = [];
	for(var i in arguments){
		arr.push(arguments[i].toString())
	}
	con && con.appendChild(getEl(arr.join(',')));
}


function init(){
	con = document.createElement('div');
	con.style.cssText = '' + 
			'position: fixed;' +
			'width: 260px;' +
			'height: 120px;' +
			'padding: 5px;' +
			'background: #000;' +
			'opacity: 0.6;' + 
			'left: 0;' +
			'bottom: 60px;' +
			'color: #fff;' +
			'z-index: 9999;' +
			'overflow-y: scroll' +
			'';
	document.body.appendChild(con);
}

if(/debugs=js/i.test(location.href)){
	init();
}