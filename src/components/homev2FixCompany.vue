<template>
    <div class="homev2_company" v-if = "!hidden">
      <h2 class="homev2_company_mtit" v-cloak >{{title}}</h2>
      <template v-if="english_title !== ''">
        <p class="homev2_company_ftit" v-cloak >{{english_title}}</p>
      </template>
      <template v-else>
        <p class="homev2_company_ftit" v-cloak >COMPANY</p>
      </template>
      

      <div class="homev2_flagcompany" v-if="company.length>0">
        <template v-for = "item in company">
          <div class="homev2_flagcompany_con bg_stamp" >
            <a :href="item.userdata2" >
               <div class="homev2_flagcompany_lg" v-cloak >
                <img :src="item.materialext1 | getImg" :alt="item.materialname" class="homev2_flagcompany_lgimg"> {{item.materialname }}
                <template v-if = "item.ppms_img">
                  <img :src="item.ppms_img | getImg" alt="" class="homev2_flagcompany_tagimg">
                </template>
              </div>
              <p class="homev2_flagcompany_detail" v-cloak >{{item.materialdesc }}</p>             
            </a>

            <a :href="item.sUrl" >
              <div class="homev2_flagcompany_layout">
                <div class="homev2_flagcompany_lylf bg_stamp">
                  <img :src="item.material | getImg" alt="">
                  <p v-cloak>{{item.userdata1}}</p>
                </div>

                <div class="homev2_flagcompany_lyrg">
                  <div class="homev2_flagcompany_lyrgimg bg_stamp">
                    <img :src="item.materialext2 | getImg" alt="">
                  </div>

                  <div class="homev2_flagcompany_lyrgimg bg_stamp">
                    <img :init-src="item.materialext3 | getImg" alt="">
                  </div>
                </div>
              </div>              
            </a>

          </div>          
        </template>

      </div>
      <!-- 添加on  旋转箭头 -->
      <a href="javascript:;"  ptag="137578.2.17" class="homev2_company_more" v-if="isCompanyMore" @click="moreCompany" style="margin-bottom: 15px">点击展开更多</a>

      <div class="homev2_column_company" v-if="prods.length>1">
        <template v-for = "item in prods">
          <div class="homev2_column_comitem">
            <a :href="item.sUrl">
              <img :init-src="item.material | getImg" alt="" class="homev2_column_comimg bg_stamp">
              <img :init-src="item.materialext1 | getImg" alt="" class="homev2_column_comlogo">
              <h3>{{item.materialname}}</h3>
              <p>{{item.materialdesc}}</p>
            </a>
          </div>
        </template>
      </div>

      <!-- 添加on  旋转箭头 -->
      <a href="javascript:;" ptag="137578.3.11" class="homev2_company_more" v-if="isProdsMore" @click="moreProds">点击展开更多</a>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data () {
    return {
        company: [],
        totalCompany: [],
        prods: [],
        totalProds: [],
        hidden: false,
        isCompanyMore: false,   //焦点更多
        companyDisNum: 6,
        isProdsMore: false,      //焦点更多
        prodDisNum: 10  
    }
  },

  created () {
    let self = this
    let resultCompanyArr = this.companyArr
    let resultProdsArr = this.prodsArr 
    self.$data.totalCompany = resultCompanyArr

    if(self.$data.totalCompany.length > self.$data.companyDisNum){
        self.$data.isCompanyMore = true
    }

    self.$data.company = resultCompanyArr.slice(0).splice(0, self.$data.companyDisNum)

    self.$data.totalProds = resultProdsArr

    if(self.$data.totalProds.length> self.$data.prodDisNum){
        self.$data.isProdsMore = true
    }        

    self.$data.prods = resultProdsArr.slice(0).splice(0, self.$data.prodDisNum)

    if(3 == self.$data.prods.length){
      self.$data.prods = resultProdsArr.slice(0).splice(0, 2)
    }
    if(5 == self.$data.prods.length){
      self.$data.prods = resultProdsArr.slice(0).splice(0, 4)
    } 
    if( 0 == resultProdsArr.length && 0 == resultCompanyArr.length ){
        self.$data.hidden = true
    }   
  },

  computed: mapState({
    title: state => state.homev2Fixcompany[0].cateTit,
    english_title: state => state.homev2Fixcompany[0].engName,
    companyArr: state => state.companyArr,
    prodsArr: state => state.prodsArr,

    // 传字符串参数 'count' 等同于 `state => state.count`
    countAlias: 'companyArr',

    // 为了能够使用 `this` 获取局部状态，必须使用常规函数
    countPlusLocalState (state) {
      return 2333
    }
  }),  

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
