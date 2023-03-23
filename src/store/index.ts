import Vue from 'vue'
import Vuex from '@/vuex'
Vue.use(Vuex)
const TEST = 'TEST'
const mutations = {
  [TEST](state: any, n: number) {
    state.a += n
  },
}

const store = new Vuex.Store({
  state: {
    a: 1,
  },
  mutations,
  modules: {
    nested: {
      state: {
        a: 2,
      },
      mutations,
      modules: {
        one: {
          state: {
            a: 3,
          },
          mutations,
        },
        nested: {
          modules: {
            two: {
              state: {
                a: 4,
              },
              mutations,
            },
            three: {
              state: {
                a: 5,
              },
              mutations,
            },
          },
        },
      },
    },
    four: {
      state: {
        a: 6,
      },
      mutations,
    },
  },
})

export default store
