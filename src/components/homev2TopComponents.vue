<template>
  <transition name="fade">
  
    <template v-if = "listnav.isDisplay == 1 && listnav.sData && listnav.sData.length>0">
      <div class="homev2_topnav">
        <div class="homev2_topnav_con">
          <template v-for="item in listnav.sData">
            <template v-if="(new Date()).valueOf() >= (new Date(item.startTime)).valueOf() && (new Date()).valueOf() <= (new Date(item.endTime)).valueOf()">
              <a href="javascript:;"><i><img :src="item.icon | getImg" alt=""></i>{{item.name}}</a>
            </template>
            
          </template>
        </div>
      </div>      
    </template>

  </transition>
</template>

<script>
//computed 计算属性中返回某个状态,  mapState获取多个状态
export default {
  name: 'listnav',
  data () {
    return {

    }
  },
  created () {

  },

  computed: {
    listnav () {
      return this.$store.state.homev2Slogan[0]
    }
  },  

  mounted () {
   
  },

  methods: {

  },

  filters: {
      formatName (imgsrc) {
          if('' == imgsrc){
            return "//jdc.jd.com/img/30x30?fontSize=10"
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
