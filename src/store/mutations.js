import Vue from 'vue'

export default{
  SET_HOMEV2_SLOGAN : (state, {data}) => {
    state.homev2Slogan = data
  },
  SET_HOMEV2_WISHLIST : (state, {data}) => {
    state.homev2Wishlist = data
  },  
  SET_HOMEV2_FIXCOMPANG : (state, {data}) => {
    state.homev2Fixcompany = data
  },  
  SET_HOMEV2_FIXNAV : (state, {data}) => {
    state.homev2Fixnav = data
  },    
  SET_HOMEV2_FLOATING : (state, {data}) => {
    state.homev2Floating = data
  },    
  SET_HOMEV2_BOTNAV : (state, {data}) => {
    state.homev2Botnav = data
  },
  SET_COMPANY_ARR : (state, {data}) => {
    state.companyArr = data
  },
  SET_PRODS_ARR : (state, {data}) => {
    state.prodsArr = data
  }       
}

// export default {
//   SET_ACTIVE_TYPE: (state, { type }) => {
//     state.activeType = type
//   },

//   SET_LIST: (state, { type, ids }) => {
//     state.lists[type] = ids
//   },

//   SET_ITEMS: (state, { items }) => {
//     items.forEach(item => {
//       if (item) {
//         Vue.set(state.items, item.id, item)
//       }
//     })
//   },

//   SET_USER: (state, { id, user }) => {
//     Vue.set(state.users, id, user || false) /* false means user not found */
//   }
// }
