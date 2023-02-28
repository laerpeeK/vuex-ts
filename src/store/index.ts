import Vue from 'vue'
import Vuex from '@/vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    count: 0,
  },
  getters: {
    evenOrOdd: (state) => (state.count % 2 === 0 ? 'even' : 'odd'),
  },
  mutations: {
    increment(state) {
      state.count++
    },
    decrement(state) {
      state.count--
    },
  },
  actions: {
    increment({ commit }) {
      commit('increment')
    },
    decrement({ commit }) {
      commit('decrement')
    },
    incrementIfOdd({ commit, state }) {
      if ((state.count + 1) % 2 === 0) {
        commit('increment')
      }
    },
    incrementAsync({ commit }) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          commit('increment')
          resolve(null)
        }, 1000)
      })
    },
  },
  modules: {
    account: {
      namespaced: true,
      state: {
        name: 'jack',
      },
    },
  },
})

const commitSubscriber = store.subscribe((mutation, state) => {
  console.log('commitSubscribe exec')
  console.log('mutation.type: ', mutation.type)
  console.log('mutation.payload: ', mutation.payload)
  console.log('state: ', state)

  // cancel commitSubscriber
  commitSubscriber()
})

const actionSubscriber = store.subscribeAction({
  before(action, state) {
    console.log('actionSubscriber before')
    console.log(action.type)
    console.log(action.payload)
    console.log(state)
  },
  after(action, state) {
    console.log('actionSubscriber after')
    console.log(action.type)
    console.log(action.payload)
    console.log(state)
    // cancel actionSubscriber
    actionSubscriber()
  }
})

store.registerModule('pet', {
  namespaced: true,
  state: {
    name: 'goldenBM',
    level: 10
  },
  getters: {
    attribute(state) {
      return state.name.replace('BM', '')
    }
  }
})

console.log(store.hasModule('pet'))

store.unregisterModule('pet')


store.hotUpdate({
  mutations: {
    increment(state) {
      state.count +=2
    }
  },
  getters: {
    evenOrOdd: (state) => (state.count % 2 === 0 ? 'hot-even' : 'hot-odd'),
  },
  actions: {
    increment({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 500)
    },
  },
  modules: {
    account: {
      namespaced: true,
      getters: {
        zhName() {
          return 'Zhijie Fang'
        }
      }
    },
  }
})

console.log(store.getters['account/zhName'])

export default store
