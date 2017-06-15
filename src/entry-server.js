import Vue from 'vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { createApp } from './app'
import { unqie, clean } from './util/unqie'

Vue.use(VueAxios, axios)

const path = require('path')
	
const isDev = process.env.NODE_ENV !== 'production'

export default context => {
	const s = isDev && Date.now()
	const { app, store } = createApp()

	var pages = [
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_slogan1.shtml"-->',
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_wishlist.shtml"-->',
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_fixcompany.shtml"-->',
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_fixscompany.shtml"-->',
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_floating.shtml"-->',
		'<!--#include virtual="/sinclude/update/wx/2017/4/homev2_botnav.shtml"-->'
	]

	var promiseARR = []

	pages.map( (item) => {
		let filepath = item.match(/virtual="([^"]+)"/)[1]
		let url = 'http://wqs.jd.com' + filepath  //页面片URL

		let p = new Promise((resolve, reject) => { 
			Vue.axios.get(url).then((response) => {
				let data = response.data.replace(/<script>(.+)<\/script>/, '$1')
				data = JSON.parse( data.substring(data.indexOf('=')+1).replace(/^\s+|\s+$/g, '') )
				store.dispatch(path.basename(filepath, '.shtml'), {data})
				resolve()
			}).catch(function (error) {
			    console.log(error);
			    reject();
			});
		})
		promiseARR.push(p)
	})

	return new Promise((resolve, reject) => { 

		Promise.all(promiseARR).then( () => {
			isDev && console.log(`data pre-fetch: ${Date.now() - s}ms`)

			var promise = new Promise( (resolve, reject) => {

			    let pmps_company = store.state.homev2Fixcompany[0].data
			    let pmps_prods = store.state.homev2Fixnav

			    let gids = [], gids1 = [], gids2 = []
			    let pids = [], pids1 = [], pids2 = []

			    pmps_company.map((item)=>{
		          gids1.push(item.groupID) 
		          pids1.push(item.ID)
		          pids.push(item.ID) 
		        })

		      	pmps_prods.map((item)=>{
		          gids2.push(item.gid) 
		          pids.push(item.pid)         
		          pids2.push(item.pid)         
		      	})

			    pids.map( (item ,i) => {
			       pids[i] = item + ":1"
			    })
			    gids = gids1.concat(gids2)

			    
			  	//顺序返回groupid数据
			      function extractData (opt, data) {
			        let arr = []

			        if(Object.prototype.toString.call(opt) == "[object Array]"){
			            for(let key in opt){
			              for(let i = 0,len = data.length;i<len;i++){
			                if(opt[key] == data[i].groupid){
			                  arr = arr.concat(data[i].locations)
			                }
			              }
			            }

			        }else if(Object.prototype.toString.call(opt) == "[object String]"){
			          for(let i = 0,len = data.length;i<len;i++){
			            if(opt == data[i].groupid){
			              arr = data[i].locations
			            }
			          }
			          
			        }

			        return arr
			      }

		      	Vue.axios.get("http://wq.jd.com/mcoss/focusbi/show_new?gids="+unqie(gids).join("|")+"&pc=0&pcs="+pids.join(",")+"&callback=flagcompany_callback&cacheKey=flagcompany_cacheThu%20May%2025%202017%2010:20:41%20GMT+0800%20(HKT)&t="+(new Date()).valueOf()+"&g_tk=5381&g_ty=ls").then( (response) =>{
		      		var data =  response.data.replace("<!-- for 'http://wq.jd.com/mcoss/focusbi/' -->", '').replace(/^\s+|\s$/g, '')
					global.flagcompany_callback = function (data) {
		      			return data
		      		}
	
		      		data = eval(data).list
		  
			        let companyArr = [], resultCompanyArr = []  //companyArr用来中转 resultCompanyArr用来排序
			        let prodsArr = [], resultProdsArr = []
					extractData(unqie(gids1), data).map( (item) => {
					  if(item.plans[0]){
					    pmps_company.map((item)=>{
					        gids1.push(item.groupID) 
					        pids.push(item.ID) 
					    })

					    for(let i = 0, len = pmps_company.length;i<len;i++){
					        if(item.locationid == pmps_company[i].ID){
					          if(pmps_company[i].rd1)item.plans[0].ppms_rd1 = pmps_company[i].rd1
					          if(pmps_company[i].rd2)item.plans[0].ppms_rd2 = pmps_company[i].rd2
					          if(pmps_company[i].img)item.plans[0].ppms_img = pmps_company[i].img
					        }
					    }

					    companyArr.push(item)
					   }
					})

			        clean(clean(pids1, 'undefined'), '').forEach( (item, key) => {
			            
			            companyArr.map( (cell) => {
			              if(item == cell.locationid && cell.plans[0]){
			                resultCompanyArr.push(cell.plans[0])
			              }
			            } )
			        })

					extractData(unqie(gids2), data).map( (item) => {
			          if(item.plans[0]){
			             prodsArr.push(item)
			           }
			        })		

			        clean(clean(pids2, 'undefined'), '').forEach( (item, key) => {
			            
			            prodsArr.map( (cell) => {
			              if(item == cell.locationid && cell.plans[0]){
			                resultProdsArr.push(cell.plans[0])
			              }
			            } )
			        })       			        
			  
			        var data = resultCompanyArr //必须要data转换
			        store.dispatch('FETCH_COMPANY_ARR', {data})	
			        data = resultProdsArr	
			        store.dispatch('FETCH_PRODS_ARR', {data})		

			        // store.commit('SET_COMPANY_ARR', {data})

			        resolve()
		      	} ).catch(function (error) {
			   		 console.log(error);
			   		 reject()
				});

			} )

			Promise.all([promise]).then( () => {
				context.state = store.state
				resolve(app)		
			}, (err) => {
				throw err
			})

	
		}, (err) => {
			throw err
		})

	})

}
