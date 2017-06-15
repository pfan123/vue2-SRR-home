<template>
  <div id="app">
    <homev2-top-components ></homev2-top-components> 
    <homev2-banner-components ></homev2-banner-components> 
    <homev2-fix-components ></homev2-fix-components> 
    <homev2-bot-components ></homev2-bot-components>
  </div>
</template>

<script>
import  homev2TopComponents from "./components/homev2TopComponents.vue"
import  homev2TopBanner from "./components/homev2TopBanner.vue"
import  homev2FixCompany from "./components/homev2FixCompany.vue"
import  homev2BotComponents from "./components/homev2BotComponents.vue"

export default {
  name: 'app',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },

  components: {
    "homev2-top-components": homev2TopComponents,
    "homev2-banner-components": homev2TopBanner,
    "homev2-fix-components": homev2FixCompany,
    "homev2-bot-components": homev2BotComponents
  },

  beforeCreate () {

  },

  created () {

  }
}
</script>

<style lang="scss">
$color_red: red;
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}


</style>