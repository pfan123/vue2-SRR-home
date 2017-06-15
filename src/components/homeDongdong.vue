<template>
  <transition name="fade">
    <a href="#" class="home_dongdong">
      咨询
    </a>
  </transition>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {
      nav: []
    }
  },
  created () {

  },

  mounted () {
   
  },

  methods: {

  },

  filters: {

  },

  events: {

  }
}
</script>

<style lang="scss">

.main_floating{
    position: fixed;
    bottom: 100px;
    right: 0;
    width: 40px;
    height: 40px;
    background-color: rgba(0, 0, 0, 0.9);
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    text-align: center;
    font-size: 10px;
    color: #fff;
    line-height: 18px;
    z-index: 4;
    img{
      display: block;
      width: 18px;
      height: 20px;
      margin: 10px auto;
      cursor: pointer;     
    }
}
</style>
