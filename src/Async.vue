<template>
  <div>
    <homev2-dec-pro></homev2-dec-pro>   
    <home-dongdong></home-dongdong>   
    <home-dongdong></home-dongdong>   
    <back-to-top></back-to-top>
  </div>
</template>

<script>
import  homev2DecoPro from "./components/homev2DecoPro.vue"
import  homeDongdong from "./components/homeDongdong.vue"
import  backToTop from "./components/backToTop.vue"

export default {
  name: 'app',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },

  components: {
    "homev2-dec-pro": homev2DecoPro,
    "home-dongdong": homeDongdong,
    "back-to-top": backToTop
  },

  beforeCreate () {

  },

  created () {

  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

</style>