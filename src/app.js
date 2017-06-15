import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import App from './App.vue'
import store from './store'

// window.homev2_slogan1= [{"sData":[{"name":"精选","icon":"//img20.360buyimg.com/jdphoto/s30x30_jfs/t4651/4/3221804846/801/913523da/58f99bc0Ne6ea71af.png","startTime":"2017/04/26 00:00:00","endTime":"2017/12/01 00:00:00","description":"精选"},{"name":"省心","icon":"//img11.360buyimg.com/jdphoto/s30x30_jfs/t4876/153/2194271839/698/5322a437/58f99be5N12b1d5b0.png","startTime":"2017/04/12 15:22:00","endTime":"2017/10/01 00:00:00","description":"省心"},{"name":"安心","icon":"//img12.360buyimg.com/jdphoto/s30x30_jfs/t5149/127/154935089/792/d5c03450/58f99beeNc49e07a0.png","startTime":"2017/04/11 15:22:00","endTime":"2017/09/01 00:00:00","description":"安心"},{"name":"无忧","icon":"//img13.360buyimg.com/jdphoto/s30x30_jfs/t4540/314/3314351718/658/6ca95a26/58f99c04N78277626.png","startTime":"2017/04/27 15:00:00","endTime":"2017/12/01 00:00:00","description":"无忧"}],"isDisplay":"1"}] 

Vue.use(VueAxios, axios)

export function createApp () {
  const app = new Vue({
    store,
    render: (createElement) => {
    	return createElement(App)
    }
  })	
  return { app, store }  
}



Vue.filter('getImg', function(value, w, h) {
    // return JD.performance.getScaleImg(value, 400, 400).replace(/^http:/, '')
    // 设置图片尺寸
    return value.replace(/^http:/, '')
})