<template>
  <transition name="fade">
	<div class="WX_back_wrap" style="bottom: 60px;">
      <a href="javascript:;" class="WX_backtop" v-bind:style="{ display: display,bottom: '60px', zIndex:'200'} " @click="backToTop">返回顶部</a>
    </div>
  </transition>    
</template>

<script>
export default {
	data () {
		return {
			display: 'none'
		}
	},

	created () {
	 
	},	

	mounted () {
		function throttle(func, threshold) {
		    func.tId && clearTimeout(func.tId);
		    func.tId = setTimeout(func, threshold || 200)
		}
		
		let winHeight = document.documentElement.clientHeight
		let that = this

	    window.addEventListener('scroll', function() {
	        throttle(function() {
	            if (document.body.scrollTop > winHeight) {
	                that.display = 'block';
	            } else {
	                that.display = 'none';
	            }
	        })
	    })
	},

	methods: {
		backToTop: function(){
			window.scrollTo(0, 0);
		}
	}
}
</script>

