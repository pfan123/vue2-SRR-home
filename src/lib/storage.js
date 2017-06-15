/**
* localStorage-支持cookie兼容
*
*/

export default function storage(){
	var objDS = window.localStorage;
	if (objDS) {
		return {
			get: function(key){
				return unescape(objDS.getItem(key));
			},
			set: function(key, value, exp){
				objDS.setItem(key, escape(value));
			},
			del: function(key){
				objDS.removeItem(key);
			},
			clear: function(){
				objDS.clear();
			},
			getAll: function(){
				var l = objDS.length, key = null, ac = [];
				for (var i = 0; i < l; i++) {
					key = objDS.key(i);
					ac.push(key + '=' + this.get(key));
				}
				return ac.join('; ');
			}
		};
	}
	else 
		if (window.ActiveXObject) {
			
			var store = document.documentElement;
			var STORE_NAME = 'localstorage';
			try {
				store.addBehavior('#default#userdata');
				store.save('localstorage');
			} 
			catch (e) {
			//throw "don't support userData";
			}
			
			return {
				set: function(key, value){
					store.setAttribute(key, value);
					store.save(STORE_NAME);
				},
				get: function(key){
					store.load(STORE_NAME);
					return store.getAttribute(key);
				},
				del: function(key){
					store.removeAttribute(key);
					store.save(STORE_NAME);
				}
			};
		}
		else {
			return {
				get: function(key){
					var aCookie = document.cookie.split("; "), l = aCookie.length, aCrumb = [];
					for (var i = 0; i < l; i++) {
						aCrumb = aCookie[i].split("=");
						if (key === aCrumb[0]) {
							return unescape(aCrumb[1]);
						}
					}
					return null;
				},
				set: function(key, value, exp){
					if (!(exp && (exp instanceof Date))) {
						exp = new Date();
						exp.setDate(exp.getDate() + 1);
					}
					document.cookie = key + "=" + escape(value) + "; expires=" + exp.toGMTString();
				},
				del: function(key){
					document.cookie = key + "=''; expires=Fri, 31 Dec 1999 23:59:59 GMT;";
				},
				clear: function(){
					var aCookie = document.cookie.split("; "), l = aCookie.length, aCrumb = [];
					for (var i = 0; i < l; i++) {
						aCrumb = aCookie[i].split("=");
						this.deleteKey(aCrumb[0]);
					}
				},
				getAll: function(){
					return unescape(document.cookie.toString());
				}
			};
		}
}