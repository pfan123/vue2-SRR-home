<template>
    <div class="homev2_banner" v-if="!hidden" >
      <a :href="banner.url" >
        <transition name="fade">
          <div class="homev2_banner_img bg_stamp"><img :src="banner.img | getImg" alt="" ></div>
        </transition>
        <div class="homev2_banner_txt">
          <h4>{{banner.title}}</h4>
          <h3>{{banner.desc_cn}}</h3>
          <template v-if="banner.desc_eng">
            <p>{{banner.desc_eng}}</p>
          </template>
          <template v-else>
            <p>DECORATION SERVICES</p>
          </template>
          
          <i>{{banner.btnTitle}}</i>
        </div>        
      </a>
    </div>
</template>

<script>

export default {
  name: 'banner',
  data () {
    return {
      hidden: false
    }
  },

  created () {

  },

  computed: {
    banner () {
      if(0 == this.$store.state.homev2Wishlist.length){
        this.$data.hidden = true
      }
      return this.$store.state.homev2Wishlist[0]
    }
  },    

  mounted () {
   
  },

  methods: {

  },

  filters: {

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
