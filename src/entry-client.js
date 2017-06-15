import Vue from 'vue'
import Async from './Async.vue'
import { createApp } from './app'

// HMR interface
if(module.hot) {
  // Capture hot update
  module.hot.accept()
}

//将服务端渲染时候的状态写入vuex
if(window.__INITIAL_STATE__){
    createApp().store.replaceState(window.__INITIAL_STATE__)
}

createApp().app.$mount('#app')

new Vue({
	render: h => h(Async)
}).$mount('#app-async')


// service worker
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}