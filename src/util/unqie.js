export const unqie = function (arr) { 
	if(Object.prototype.toString.call(arr) != "[object Array]"){
		arr = []
	}
  	var len=arr.length, obj={}, newArr=[];      

	  while(len--){ 
	           if(obj[ arr[len] ] !== arr[len]){ 
	                obj[arr[len]] = arr[len];   
	                newArr.push( arr[len]); 
	          }  
	  } 
	return newArr.reverse(); 
}


export const clean = function (arr, deleteValue) { 
	    for (var i = 0; i < arr.length; i++) {  
	      if (arr[i] == deleteValue) {           
	        arr.splice(i, 1);//返回指定的元素  
	        i--;  
	      }  
	    }  
	    return arr;  	
}