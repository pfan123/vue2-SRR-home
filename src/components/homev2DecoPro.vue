<template>
  <div class="homev2_decopro">
    <h2 class="homev2_decopro_mtit" v-cloak> {{listData.name}}</h2>
    <template v-if="listData.eng_name">
      <p class="homev2_decopro_ftit" v-cloak>{{listData.eng_name}}</p>
    </template>
    <template v-else>
      <p class="homev2_decopro_ftit">SERVICE</p>
    </template>

    <!-- 开发注意添加 fixed -->
    <template v-if="fixnav && fixnav.length <= 4">
      <div class="homev2_menu_position"></div>      
      <div class="homev2_menu on">
        <div class="homev2_menu_nav">
          <template v-for = "(item, index) in fixnav">

            <a href="javascript:;" :class="{cur: index == active}" :ptag="item.rd" @click = "selectTab(index)"><i v-cloak>{{item.nav_name}}</i></a>
          }
          </template>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="homev2_menu_position"></div>      
      <div class="homev2_menu on">
        <div class="homev2_menu_nav1">
          <div class="homev2_menu_navscroll">
            <template v-for = "(item, index) in fixnav">
              <a href="javascript:;" :class="{cur: index == active}" :ptag="item.rd" @click = "selectTab(index)"><i v-cloak>{{item.nav_name}}</i></a>
            </template>
          </div>
        </div>
      </div>
    </template>

    <div class="homev2_decopro_t" v-if = "content.data && content.data.length>1">
      <h3 v-cloak>{{content.nav_name}}</h3>
      <p v-cloak>{{content.nav_desc}}</p>
    </div>  

    <template v-if = "content.data && content.data.length>1">
      <div class="homev2_decopro_m">
        
        <div class="homev2_decopro_item" v-for = "item in content.data">
        {{item.sItemName}}
          <a :href="item.sUrl" >
            <div class="bg_stamp" >
              <template v-if="item.sImg200x200">
                  <img :init-src="item.sImg200x200 | getImg" :alt="item.sItemName">
              </template>
              <template v-else>
                  <img :init-src="item.sImg | getImg" :alt="item.sItemName" >               
              </template> 
            </div>

              <template v-if="item.sItemName">
                <h3 v-cloak>{{item.sItemName}}</h3>
              </template>
              <template v-else>
                <h3 v-cloak>{{item.sFullName}}</h3>
              </template>               
              
            <p v-cloak><em style="font-family: arial">&yen; </em>{{item.dwActMinPrice | initPrice}}<em>.{{item.dwActMinPrice | OnePointPrice}}</em></p>
          </a>
        </div>


      </div>

    </template>

  </div>
</template>

<script>
import throttle     from '../util/throttle'

require('../jdk/vendor.inline.js')

  export default {
    data() {
      return {
        listData: {},
        fixnav: [],
        content: {nav_name:'', nav_desc:'', data: []},
        active: 0
      }
    },

    created() {
      let self = this
      this.$data.listData = window["homev2_fixnav"][0]
      this.$data.fixnav = window["homev2_fixnav"][0]["navdata"]
      if(sessionStorage.getItem("ppms_tab")){
          let data  =  JSON.parse(sessionStorage.getItem("ppms_tab"))
          this.$data.active = data.active
          self.$data.content = data.content

          self.$nextTick( () => {
              JDK.lazyLoad.autoLoadImage({
                initSrcName: 'init-src',
                fadeIn: true
              });
          })
          return ;
      }

      let serviceData = this.getData({
            "actid": self.$data.fixnav[self.active]["active_id"],
            "areaid": self.$data.fixnav[self.active]["erea_id"],
            callback: function(data){
              self.$data.content = {
                nav_name: self.$data.fixnav[self.active]["nav_name"],
                nav_desc: self.$data.fixnav[self.active]["nav_desc"],
                data: data,
                ptag: self.$data.fixnav[self.active]
              }
     
              self.$nextTick(() => {
                  JDK.lazyLoad.autoLoadImage({
                    initSrcName: 'init-src'
                  });
              })       

              //存储选择信息
             sessionStorage.setItem("ppms_tab", JSON.stringify({"active": self.$data.active , "content": self.$data.content, "dis": 0}) )
            }
      })
    },

    mounted() {
      this.initScroll()
      if(sessionStorage.getItem("ppms_tab")){
          let data  =  JSON.parse(sessionStorage.getItem("ppms_tab"))
          $(".homev2_menu").find(".homev2_menu_navscroll").scrollLeft( data.dis )
      }

    },

    methods: {
      //actid, areaid, callback
      getData(opts){
        var actid = opts.actid
        var areaid = opts.areaid
        var self = this;

        let actWfdataArguments = {
          "dataType": "MART",
          "preload":  "true",
          "param": {
            "actid": actid,
            "areaid": areaid,
            "pc": 0,
            "callback" : "homev2_fixnav_callback"+self.$data.active,
            "cacheKey" : "homev2_fixnav_cache"+self.$data.active           
          }
        }

        JDK.load.loadWfdata(actWfdataArguments, (res) => {
            if (res && 0 == res.errCode && res.data && res.data.list.length > 0) {
              opts.callback(res.data.list)

            } else {
              opts.callback([])
            }
        })
      },

      selectTab(index){
        let self = this;
        this.$data.active = index

        let $nav = $(".homev2_menu")
        let $tar = $(".homev2_menu").find(".homev2_menu_navscroll")
        let $navItem = $(".homev2_menu").find(".homev2_menu_navscroll").find("a");
        let dis = 0

        if($nav.hasClass("fixed")){
          window.scrollTo(0, $(".homev2_menu_position").offset().top)
        }
         
        if($navItem.length*80 - index*80 <= $nav.width()){
          dis = $navItem.length*80 - $nav.width()
          $tar.scrollLeft( dis )
        }else{
          dis = index*80
          $tar.scrollLeft( dis )
        }  



        this.getData({
            "actid": self.$data.fixnav[self.active]["active_id"],
            "areaid": self.$data.fixnav[self.active]["erea_id"],      
            callback: function(data){
              self.$data.content = {
                nav_name: self.$data.fixnav[self.active]["nav_name"],
                nav_desc: self.$data.fixnav[self.active]["nav_desc"],
                data: data
              }
              self.$nextTick(() => {
                  JDK.lazyLoad.autoLoadImage({
                    initSrcName: 'init-src'
                  });
              })   
              
              //存储选择信息
             sessionStorage.setItem("ppms_tab", JSON.stringify({"active": self.$data.active , "content": self.$data.content, "dis": dis}) )
            }          
        })

      },

      initScroll(){
        function fn(){
            let $nav = $(".homev2_menu")
            let top = $nav[0].getBoundingClientRect().top
            if (top <= 0) {
              $nav.addClass('fixed');
            } else {
              $nav.removeClass('fixed');
            }
        }  

        window.addEventListener('scroll', function() {
          throttle(fn);
        })                
      }

    },  

    filters: {
      initPrice (value){
        if(!value || '' == value){
          return value
        }        
        let price = value.toString().split(".");
        return price[0]
      },

      OnePointPrice (value){
        if(!value || '' == value){
          return value
        }        
        let price = value.toString().split(".");
        if(1 == price.length){
          return 0
        }else{
          return price[1].split("")[0]
        }
      },

      formatName (imgsrc) {
          if('' == imgsrc){
            return "//jdc.jd.com/img/30x30?fontSize=10"
          }

          return imgsrc
          
      },

      addPtag (value) {
        if( '' == value){
          return ''
        }else{
          return value + "&ptag=" + this.fixnav[this.active]["pro_rd"]
        }
        
      }
    }
  }
</script>

<style lang="scss">


</style>
