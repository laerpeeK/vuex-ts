import Vue from 'vue'
import Vuex from '@/vuex'
import { describe, it } from '@jest/globals'
import type { ActionContext, RawModule } from '@/vuex/types'

const TEST = 'TEST'

describe('Modules', () => {
  describe('module registration', () => {
    it('dynamic module registration', () => {
      const store = new Vuex.Store({
        strict: true,
        modules: {
          foo: {
            state: { bar: 1 },
            mutations: { inc: (state) => state.bar++ },
            actions: { incFoo: ({ commit }) => commit('inc') },
            getters: { bar: (state) => state.bar },
          },
        },
      })

      expect(() => {
        store.registerModule('hi', {
          state: { a: 1 },
          mutations: { inc: (state) => state.a++ },
          actions: { inc: ({ commit }) => commit('inc') },
          getters: { a: (state) => state.a },
        })
      }).not.toThrow()

      expect(store._mutations.inc.length).toBe(2)
      expect(store.state.hi.a).toBe(1)
      expect(store.getters.a).toBe(1)

      // assert initial modules work as expected after dynamic registration
      expect(store.state.foo.bar).toBe(1)
      expect(store.getters.bar).toBe(1)

      // test dispatching actions defined in dynamic module
      store.dispatch('inc')
      expect(store.state.hi.a).toBe(2)
      expect(store.getters.a).toBe(2)
      expect(store.state.foo.bar).toBe(2)
      expect(store.getters.bar).toBe(2)

      // unregister
      store.unregisterModule('hi')
      expect(store.state.hi).toBeUndefined()
      expect(store.getters.a).toBeUndefined()
      expect(store._mutations.inc.length).toBe(1)
      expect(store._actions.inc).toBeUndefined()

      // assert initial modules still work as expected after unregister
      store.dispatch('incFoo')
      expect(store.state.foo.bar).toBe(3)
      expect(store.getters.bar).toBe(3)
    })

    it('dynamic module registration with namespace inheritation', () => {
      const store = new Vuex.Store({
        modules: {
          a: {
            namespaced: true,
          },
        },
      })
      const actionSpy = jest.fn()
      const mutationSpy = jest.fn()

      store.registerModule(['a', 'b'], {
        state: { value: 1 },
        getters: { foo: (state) => state.value },
        actions: { foo: actionSpy },
        mutations: { foo: mutationSpy },
      })

      expect(store.state.a.b.value).toBe(1)
      expect(store.getters['a/foo']).toBe(1)

      store.dispatch('a/foo')
      expect(actionSpy).toHaveBeenCalled()

      store.commit('a/foo')
      expect(mutationSpy).toHaveBeenCalled()
    })

    it('dynamic module existance test', () => {
      const store = new Vuex.Store({})
      store.registerModule('bonjour', {})

      expect(store.hasModule('bonjour')).toBe(true)
      store.unregisterModule('bonjour')
      expect(store.hasModule('bonjour')).toBe(false)
    })

    it('dynamic module existance test nested modules', () => {
      const store = new Vuex.Store({})
      store.registerModule('a', {})
      store.registerModule(['a', 'b'], {})

      expect(store.hasModule(['a'])).toBe(true)
      expect(store.hasModule(['a', 'b'])).toBe(true)
      expect(store.hasModule(['c'])).toBe(false)
      expect(store.hasModule(['c', 'd'])).toBe(false)
    })

    it('dynamic module registration preserving hydration', () => {
      const store = new Vuex.Store({})
      store.replaceState({ a: { foo: 'state' } })
      const actionSpy = jest.fn()
      const mutationSpy = jest.fn()
      store.registerModule(
        'a',
        {
          namespaced: true,
          getters: { foo: (state) => state.foo },
          actions: { foo: actionSpy },
          mutations: { foo: mutationSpy },
        },
        { preserveState: true }
      )

      expect(store.state.a.foo).toBe('state')
      expect(store.getters['a/foo']).toBe('state')

      store.dispatch('a/foo')
      expect(actionSpy).toHaveBeenCalled()

      store.commit('a/foo')
      expect(mutationSpy).toHaveBeenCalled()
    })
  })

  it('should not fire an unrelated watcher', (done) => {
    const spy = jest.fn()
    const store = new Vuex.Store({
      modules: {
        a: {
          state: { value: 1 },
        },
        b: {},
      },
    })

    store.watch((state: any) => state.a, spy)
    store.registerModule(['b', 'c'], {
      state: { value: 2 },
    })
    Vue.nextTick(() => {
      expect(spy).not.toHaveBeenCalled()
      done()
    })
  })

  describe('modules usage', () => {
    it('state as function (multiple module in same store)', () => {
      const module = {
        state() {
          return { a: 0 }
        },
        mutations: {
          [TEST](state: any, n: number) {
            state.a += n
          },
        },
      }

      const store = new Vuex.Store({
        modules: {
          one: module,
          two: module,
        },
      })

      expect(store.state.one.a).toBe(0)
      expect(store.state.two.a).toBe(0)

      store.commit(TEST, 1)
      expect(store.state.one.a).toBe(1)
      expect(store.state.two.a).toBe(1)
    })

    it('state as function (same module in multiple stores)', () => {
      const module = {
        state() {
          return { a: 0 }
        },
        mutations: {
          [TEST](state: any, n: number) {
            state.a += n
          },
        },
      }

      const storeA = new Vuex.Store({
        modules: {
          foo: module,
        },
      })

      const storeB = new Vuex.Store({
        modules: {
          bar: module,
        },
      })

      storeA.commit(TEST, 1)
      expect(storeA.state.foo.a).toBe(1)
      expect(storeB.state.bar.a).toBe(0)

      storeB.commit(TEST, 2)
      expect(storeA.state.foo.a).toBe(1)
      expect(storeB.state.bar.a).toBe(2)
    })

    it('module: mutation', function () {
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

      store.commit(TEST, 1)
      expect(store.state.a).toBe(2)
      expect(store.state.nested.a).toBe(3)
      expect(store.state.nested.one.a).toBe(4)
      expect(store.state.nested.nested.two.a).toBe(5)
      expect(store.state.nested.nested.three.a).toBe(6)
      expect(store.state.four.a).toBe(7)
    })

    it('module: action', function () {
      let calls = 0
      const makeAction = (n: number) => {
        return {
          [TEST](context: ActionContext) {
            calls++
            const { state, rootState } = context
            expect(state.a).toBe(n)
            expect(rootState).toBe(store.state)
          },
        }
      }

      const store = new Vuex.Store({
        state: {
          a: 1,
        },
        actions: makeAction(1),
        modules: {
          nested: {
            state: { a: 2 },
            actions: makeAction(2),
            modules: {
              one: {
                state: {
                  a: 3,
                },
                actions: makeAction(3),
              },
              nested: {
                modules: {
                  two: {
                    state: {
                      a: 4,
                    },
                    actions: makeAction(4),
                  },
                  three: {
                    state: {
                      a: 5,
                    },
                    actions: makeAction(5),
                  },
                },
              },
            },
          },
          four: {
            state: {
              a: 6,
            },
            actions: makeAction(6),
          },
        },
      })

      store.dispatch(TEST)
      expect(calls).toBe(6)
    })

    it('module: getters', function () {
      const makeGetter = (n: number) => ({
        [`getter${n}`]: (state: any, getters: any, rootState: any) => {
          expect(getters.constant).toBe(0)
          expect(rootState).toBe(store.state)
          return state.a
        },
      })

      const store = new Vuex.Store({
        state: {
          a: 1,
        },
        getters: {
          constant: () => 0,
          ...makeGetter(1),
        },
        modules: {
          nested: {
            state: { a: 2 },
            getters: makeGetter(2),
            modules: {
              one: {
                state: { a: 3 },
                getters: makeGetter(3),
              },
              nested: {
                modules: {
                  two: {
                    state: { a: 4 },
                    getters: makeGetter(4),
                  },
                  three: {
                    state: { a: 5 },
                    getters: makeGetter(5),
                  },
                },
              },
            },
          },
          four: {
            state: { a: 6 },
            getters: makeGetter(6),
          },
        },
      })

      ;[1, 2, 3, 4, 5, 6].forEach((n: number) => {
        expect(store.getters[`getter${n}`]).toBe(n)
      })
    })

    it('module: namespace', () => {
      const actionSpy = jest.fn()
      const mutationSpy = jest.fn()

      const store = new Vuex.Store({
        modules: {
          a: {
            namespaced: true,
            state: {
              a: 1,
            },
            getters: {
              b: () => 2,
            },
            actions: {
              [TEST]: actionSpy,
            },
            mutations: {
              [TEST]: mutationSpy,
            },
          },
        },
      })

      expect(store.state.a.a).toBe(1)
      expect(store.getters['a/b']).toBe(2)
      store.dispatch('a/' + TEST)
      expect(actionSpy).toHaveBeenCalled()
      store.commit('a/' + TEST)
      expect(mutationSpy).toHaveBeenCalled()
    })

    it('module: nested namespace', () => {
      // mock module generator
      const actionSpys: Array<Function> = []
      const mutationSpys: Array<Function> = []
      const createModule = (
        name: string,
        namespaced: boolean,
        children?: RawModule
      ) => {
        const actionSpy = jest.fn()
        const mutationSpy = jest.fn()

        actionSpys.push(actionSpy)
        mutationSpys.push(mutationSpy)

        return {
          namespaced,
          state: {
            [name]: true,
          },
          getters: {
            [name]: (state: any) => state[name],
          },
          actions: {
            [name]: actionSpy,
          },
          mutations: {
            [name]: mutationSpy,
          },
          modules: children,
        }
      }

      // mock module
      const modules = {
        a: createModule('a', true, {
          b: createModule('b', false, {
            c: createModule('c', true),
          }),
          d: createModule('d', true)
        }),
      }

      const store = new Vuex.Store({ modules })

      const expectedTypes = [
        'a/a', 'a/b', 'a/c/c', 'a/d/d'
      ]

      // getters
      expectedTypes.forEach((type: string) => {
        expect(store.getters[type]).toBe(true)
      })

      // actions
      expectedTypes.forEach(type => {
        store.dispatch(type)
      })
      actionSpys.forEach(spy => {
        expect(spy).toHaveBeenCalledTimes(1)
      })

      // mutations
      expectedTypes.forEach(type => {
        store.commit(type)
      })
      mutationSpys.forEach(spy => {
        expect(spy).toHaveBeenCalledTimes(1)
      })
    })

    it('module: getters are namespaced in namespaced module', () => {
      const store = new Vuex.Store({
        state: { value: 'root' },
        getters: {
          foo: state => state.value
        },
        modules: {
          a: {
            namespaced: true,
            state: { value: 'module' },
            getters: {
              foo: state => state.value,
              bar: (state, getters) => getters.foo,
              baz: (state, getters, rootState, rootGetters) => rootGetters!.foo
            }
          }
        }
      })

      expect(store.getters['a/foo']).toBe('module')
      expect(store.getters['a/bar']).toBe('module')
      expect(store.getters['a/baz']).toBe('root')
    })

  })
})
