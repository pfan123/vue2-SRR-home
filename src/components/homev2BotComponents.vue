<template>
  <transition name="fade">
    <div class="wx_nav wx_nav_custom">
      <template v-for="(item, index) of listData">
        <a :href="item.url" :class="{on : index == active}">
          <img class="highlight" :src="item.current | formatName">
          <img class="normal" :src="item.disabled | formatName">
          <span>{{item.name}}</span>
        </a>        
      </template>
    </div>
  </transition>
</template>

<script>
export default {
  name: "listData",  
  data () {
    return {
      active: 0      
    }
  },
  created () {

  },

  computed: {
    listData () {
      let data = this.$store.state.homev2Botnav
      let href = "index.shtml"
      data.map( (item, index) => {
        if( -1 != item.url.indexOf(href) ){
          this.$data.active = index
        }
      })

      return this.$store.state.homev2Botnav
    }
  },      

  mounted () {
   
  },

  methods: {

  },

  filters: {
    formatName (imgsrc) {
        if('' == imgsrc){
          return "//jdc.jd.com/img/40x40?fontSize=10"
        }

        return imgsrc
        
    }
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
