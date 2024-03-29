import Vue from 'vue'
import Vuex, {
  mapState,
  mapGetters,
  mapMutations,
  mapActions,
  createNamespacedHelpers,
} from '@/vuex'
import { Commit, Dispatch } from '@/vuex/types'

describe('Helpers', () => {
  it('mapState (array)', () => {
    const store = new Vuex.Store({
      state: {
        a: 1,
      },
    })
    const vm = new Vue({
      store,
      computed: mapState(['a']),
    })
    expect(vm.a).toBe(1)
    store.state.a++
    expect(vm.a).toBe(2)
  })

  it('mapState (object)', () => {
    const store = new Vuex.Store({
      state: {
        a: 1,
      },
      getters: {
        b: () => 2,
      },
    })
    const vm = new Vue({
      store,
      computed: mapState({
        a: (state: any, getters: any) => {
          return state.a + getters.b
        },
      }),
    })
    expect(vm.a).toBe(3)
    store.state.a++
    expect(vm.a).toBe(4)
  })

  it('mapState (with namespace)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { a: 1 },
          getters: {
            b: (state) => state.a + 1,
          },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: mapState('foo', {
        a: (state: any, getters: any) => {
          return state.a + getters.b
        },
      }),
    })
    expect(vm.a).toBe(3)
    store.state.foo.a++
    expect(vm.a).toBe(5)
    store.replaceState({
      foo: { a: 3 },
    })
    expect(vm.a).toBe(7)
  })

  // #708
  it('mapState (with namespace and a nested module)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { a: 1 },
          modules: {
            bar: {
              state: { b: 2 },
            },
          },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: mapState('foo', {
        value: (state: any) => state,
      }),
    })

    const val = vm.value as Record<string, any>
    expect(val.a).toBe(1)
    expect(val.bar.b).toBe(2)
    expect(val.b).toBeUndefined()
  })

  it('mapState (with undefined states)', () => {
    jest.spyOn(console, 'error').mockImplementation()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { a: 1 },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: mapState('foo'),
    })
    expect(vm.a).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[vuex] mapState: mapper parameter must be either an Array or an Object'
    )
  })

  it('mapMutations (array)', () => {
    const store = new Vuex.Store({
      state: { count: 0 },
      mutations: {
        inc: (state) => state.count++,
        dec: (state) => state.count--,
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations(['inc', 'dec']),
    })
    // @ts-expect-error
    vm.inc()
    expect(store.state.count).toBe(1)
    // @ts-expect-error
    vm.dec()
    expect(store.state.count).toBe(0)
  })

  it('mapMutations (object)', () => {
    const store = new Vuex.Store({
      state: { count: 0 },
      mutations: {
        inc: (state) => state.count++,
        dec: (state) => state.count--,
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations({
        plus: 'inc',
        minus: 'dec',
      }),
    })

    // @ts-expect-error
    vm.plus()
    expect(store.state.count).toBe(1)
    // @ts-expect-error
    vm.minus()
    expect(store.state.count).toBe(0)
  })

  it('mapMutations (function)', () => {
    const store = new Vuex.Store({
      state: { count: 0 },
      mutations: {
        inc(state, amount) {
          state.count += amount
        },
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations({
        plus(commit: Commit, amount: number) {
          commit('inc', amount + 1)
        },
      }),
    })
    // @ts-expect-error
    vm.plus(42)
    expect(store.state.count).toBe(43)
  })

  it('mapMutations (with namespace)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            inc: (state) => state.count++,
            dec: (state) => state.count--,
          },
        },
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations('foo', {
        plus: 'inc',
        minus: 'dec',
      }),
    })
    // @ts-expect-error
    vm.plus()
    expect(store.state.foo.count).toBe(1)
    // @ts-expect-error
    vm.minus()
    expect(store.state.foo.count).toBe(0)
  })

  it('mapMutations (function with namepsace)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            inc(state, amount) {
              state.count += amount
            },
          },
        },
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations('foo', {
        plus(commit: Commit, amount: number) {
          commit('inc', amount + 1)
        },
      }),
    })
    // @ts-expect-error
    vm.plus(42)
    expect(store.state.foo.count).toBe(43)
  })

  it('mapMutations (with undefined mutations)', () => {
    jest.spyOn(console, 'error').mockImplementation()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            inc: (state) => state.count++,
            dec: (state) => state.count--,
          },
        },
      },
    })
    const vm = new Vue({
      store,
      methods: mapMutations('foo'),
    })
    // @ts-expect-error
    expect(vm.inc).toBeUndefined()
    // @ts-expect-error
    expect(vm.dec).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[vuex] mapMutations: mapper parameter must be either an Array or an Object'
    )
  })

  it('mapGetters (array)', () => {
    const store = new Vuex.Store({
      state: { count: 0 },
      mutations: {
        inc: (state) => state.count++,
        dec: (state) => state.count--,
      },
      getters: {
        hasAny: ({ count }) => count > 0,
        negative: ({ count }) => count < 0,
      },
    })
    const vm = new Vue({
      store,
      computed: mapGetters(['hasAny', 'negative']),
    })
    expect(vm.hasAny).toBe(false)
    expect(vm.negative).toBe(false)
    store.commit('inc')
    expect(vm.hasAny).toBe(true)
    expect(vm.negative).toBe(false)
    store.commit('dec')
    store.commit('dec')
    expect(vm.hasAny).toBe(false)
    expect(vm.negative).toBe(true)
  })

  it('mapGetters (object)', () => {
    const store = new Vuex.Store({
      state: { count: 0 },
      mutations: {
        inc: (state) => state.count++,
        dec: (state) => state.count--,
      },
      getters: {
        hasAny: ({ count }) => count > 0,
        negative: ({ count }) => count < 0,
      },
    })
    const vm = new Vue({
      store,
      computed: mapGetters({
        a: 'hasAny',
        b: 'negative',
      }),
    })
    expect(vm.a).toBe(false)
    expect(vm.b).toBe(false)
    store.commit('inc')
    expect(vm.a).toBe(true)
    expect(vm.b).toBe(false)
    store.commit('dec')
    store.commit('dec')
    expect(vm.a).toBe(false)
    expect(vm.b).toBe(true)
  })

  it('mapGetters (with namespace)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            inc: (state) => state.count++,
            dec: (state) => state.count--,
          },
          getters: {
            hasAny: ({ count }) => count > 0,
            negative: ({ count }) => count < 0,
          },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: mapGetters('foo', {
        a: 'hasAny',
        b: 'negative',
      }),
    })
    expect(vm.a).toBe(false)
    expect(vm.b).toBe(false)
    store.commit('foo/inc')
    expect(vm.a).toBe(true)
    expect(vm.b).toBe(false)
    store.commit('foo/dec')
    store.commit('foo/dec')
    expect(vm.a).toBe(false)
    expect(vm.b).toBe(true)
  })

  it('mapGetters (with namespace and nested module)', () => {
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          modules: {
            bar: {
              namespaced: true,
              state: { count: 0 },
              mutations: {
                inc: (state) => state.count++,
                dec: (state) => state.count--,
              },
              getters: {
                hasAny: ({ count }) => count > 0,
                negative: ({ count }) => count < 0,
              },
            },
            cat: {
              state: { count: 9 },
              getters: {
                count: ({ count }) => count,
              },
            },
          },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: {
        ...mapGetters('foo/bar', ['hasAny', 'negative']),
        ...mapGetters('foo', ['count']),
      },
    })
    expect(vm.hasAny).toBe(false)
    expect(vm.negative).toBe(false)
    store.commit('foo/bar/inc')
    expect(vm.hasAny).toBe(true)
    expect(vm.negative).toBe(false)
    store.commit('foo/bar/dec')
    store.commit('foo/bar/dec')
    expect(vm.hasAny).toBe(false)
    expect(vm.negative).toBe(true)

    expect(vm.count).toBe(9)
  })

  it('mapGetters (with undefined getters)', () => {
    jest.spyOn(console, 'error').mockImplementation()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          mutations: {
            inc: (state) => state.count++,
            dec: (state) => state.count--,
          },
          getters: {
            hasAny: ({ count }) => count > 0,
            negative: ({ count }) => count < 0,
          },
        },
      },
    })
    const vm = new Vue({
      store,
      computed: mapGetters('foo'),
    })
    expect(vm.a).toBeUndefined()
    expect(vm.b).toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(
      '[vuex] mapGetters: mapper parameter must be either an Array or an Object'
    )
  })

  it('mapActions (array)', () => {
    const a = jest.fn()
    const b = jest.fn()
    const store = new Vuex.Store({
      actions: {
        a,
        b
      }
    })
    const vm = new Vue({
      store,
      methods: mapActions(['a', 'b'])
    })
    vm.a()
    expect(a).toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    vm.b()
    expect(b).toHaveBeenCalled()
  })

  it('mapActions (object)', () => {
    const a = jest.fn()
    const b = jest.fn()
    const store = new Vuex.Store({
      actions: {
        a,
        b
      }
    })
    const vm = new Vue({
      store,
      methods: mapActions({
        foo: 'a',
        bar: 'b'
      })
    })
    vm.foo()
    expect(a).toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    vm.bar()
    expect(b).toHaveBeenCalled()
  })

  it('mapActions (function)', () => {
    const a = jest.fn()
    const store = new Vuex.Store({
      actions: { a }
    })
    const vm = new Vue({
      store,
      methods: mapActions({
        foo (dispatch: Dispatch, arg: any) {
          dispatch('a', arg + 'bar')
        }
      })
    })
    vm.foo('foo')
    expect(a.mock.calls[0][1]).toBe('foobar')
  })

  it('mapActions (with namespace)', () => {
    const a = jest.fn()
    const b = jest.fn()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          actions: {
            a,
            b
          }
        }
      }
    })
    const vm = new Vue({
      store,
      methods: mapActions('foo/', {
        foo: 'a',
        bar: 'b'
      })
    })
    vm.foo()
    expect(a).toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
    vm.bar()
    expect(b).toHaveBeenCalled()
  })

  it('mapActions (function with namespace)', () => {
    const a = jest.fn()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          actions: { a }
        }
      }
    })
    const vm = new Vue({
      store,
      methods: mapActions('foo/', {
        foo (dispatch: Dispatch, arg: any) {
          dispatch('a', arg + 'bar')
        }
      })
    })
    vm.foo('foo')
    expect(a.mock.calls[0][1]).toBe('foobar')
  })

  it('mapActions (with undefined actions)', () => {
    jest.spyOn(console, 'error').mockImplementation()
    const a = jest.fn()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          actions: {
            a
          }
        }
      }
    })
    const vm = new Vue({
      store,
      methods: mapActions('foo/')
    })
    expect(vm.a).toBeUndefined()
    expect(a).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('[vuex] mapActions: mapper parameter must be either an Array or an Object')
  })

  it('createNamespacedHelpers', () => {
    const actionA = jest.fn()
    const actionB = jest.fn()
    const store = new Vuex.Store({
      modules: {
        foo: {
          namespaced: true,
          state: { count: 0 },
          getters: {
            isEven: state => state.count % 2 === 0
          },
          mutations: {
            inc: state => state.count++,
            dec: state => state.count--
          },
          actions: {
            actionA,
            actionB
          }
        }
      }
    })
    const {
      mapState,
      mapGetters,
      mapMutations,
      mapActions
    } = createNamespacedHelpers('foo/')
    const vm = new Vue({
      store,
      computed: {
        ...mapState(['count']),
        ...mapGetters(['isEven'])
      },
      methods: {
        ...mapMutations(['inc', 'dec']),
        ...mapActions(['actionA', 'actionB'])
      }
    })
    expect(vm.count).toBe(0)
    expect(vm.isEven).toBe(true)
    store.state.foo.count++
    expect(vm.count).toBe(1)
    expect(vm.isEven).toBe(false)
    vm.inc()
    expect(store.state.foo.count).toBe(2)
    expect(store.getters['foo/isEven']).toBe(true)
    vm.dec()
    expect(store.state.foo.count).toBe(1)
    expect(store.getters['foo/isEven']).toBe(false)
    vm.actionA()
    expect(actionA).toHaveBeenCalled()
    expect(actionB).not.toHaveBeenCalled()
    vm.actionB()
    expect(actionB).toHaveBeenCalled()
  })
})
