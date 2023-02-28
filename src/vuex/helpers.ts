import { isObject } from './util'
import type VueInstance from 'vue'
import type { Store } from './store'
import { Dispatch, Commit } from './types'
type Namespace = string | Record<string, any> | Array<string>
type Map = Record<string, any> | Array<string>

type MapState = (namespace: Namespace, map?: Map) => Record<string, any>
type MapGetters = (namespace: Namespace, map?: Map) => Record<string, any>
type MapMutations = (namespace: Namespace, map?: Map) => Array<Commit>
type MapActions = (namespace: Namespace, map?: Map) => any

interface NamespacedHelpers {
  mapState: MapState
  mapGetters: MapGetters
  mapMutations: MapMutations
  mapActions: MapActions
} 

/**
 * Reduce the code which written in Vue.js for getting the state.
 * @param namespace
 * @param map
 */
export const mapState: MapState = normalizeNamespace(
  (namespace: string, states: Record<string, any> | Array<string>) => {
    const res: Record<string, any> = {}
    if (process.env.NODE_ENV !== 'production' && !isValidMap(states)) {
      console.error(
        '[vuex] mapState: mapper parameter must be either an Array or an Object'
      )
    }

    normalizeMap(states).forEach(({ key, val }) => {
      res[key] = function mappedState(this: VueInstance) {
        let state = this.$store.state
        let getters = this.$store.getters
        if (namespace) {
          const module = getModuleByNamespace(
            this.$store,
            'mapState',
            namespace
          )
          if (!module) {
            return
          }
          state = module.context.state
          getters = module.context.getters
        }
        return typeof val === 'function'
          ? val.call(this, state, getters)
          : state[val]
      }
      // mark vuex getter for devtools
      res[key].vuex = true
    })
    return res
  }
)

/**
 * Reduce the code which written in Vue.js for getting the getters
 * 
 * @param namespace
 * @param map
 */
export const mapGetters: MapGetters = normalizeNamespace(
  (namespace: string, getters: Record<string, any> | Array<string>) => {
    const res: Record<string, any> = {}
    if (process.env.NODE_ENV !== 'production' && !isValidMap(getters)) {
      console.error(
        '[vuex] mapGetters: mapper parameter must be either an Array or an Object'
      )
    }
    normalizeMap(getters).forEach(({ key, val }) => {
      // The namespace has been mutated by normalizeNamespace
      val = namespace + val
      res[key] = function mapGetter(this: VueInstance) {
        if (
          namespace &&
          !getModuleByNamespace(this.$store, 'mapGetters', namespace)
        ) {
          return
        }

        if (
          process.env.NODE_ENV !== 'production' &&
          !(val in this.$store.getters)
        ) {
          console.error(`[vuex] unknown getter: ${val}`)
          return
        }

        return this.$store.getters[val]
      }
      // mark vuex getter for devtools
      res[key].vuex = true
    })
    return res
  }
)

/**
 * Reduce the code which written in Vue.js for dispatch the action
 * 
 * @param namespace
 * @param map
 */
export const mapActions: MapActions = normalizeNamespace((namespace: string, actions: Record<string, any> | Array<string>) => {
  const res: Record<string, any> = {}
  if (process.env.NODE_ENV !== 'production' && !isValidMap(actions)) {
    console.error('[vuex] mapActions: mapper parameter must be either an Array or an Object')
  }
  normalizeMap(actions).forEach(({key, val}) => {
    res[key] = function mappedAction (this: VueInstance, ...args: Array<any>) {
      // get dispatch function from store
      let dispatch = this.$store.dispatch
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapActions', namespace)
        if (!module) {
          return
        }
        dispatch = module.context.dispatch
      }
      return typeof val === 'function'
        ? val.apply(this, [dispatch].concat(args))
        // @ts-ignore
        : dispatch.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

/**
 * Reduce the code which written in Vue.js for committing the mutation
 * 
 * @param namespace
 * @param map
 */
export const mapMutations: MapMutations = normalizeNamespace((namespace: string, mutations: Record<string, any> | Array<string>) => {
  const res: Record<string, any> = {}
  if (process.env.NODE_ENV !== 'production' && !isValidMap(mutations)) {
    console.error('[vuex] mapMutations: mapper parameter must be either an Array or an Object')
  }
  normalizeMap(mutations).forEach(({key, val}) => {
    res[key] = function mappedMutation(this: VueInstance, ...args: Array<any>) {
      // Get the commit method from store
      let commit = this.$store.commit
      if (namespace) {
        const module = getModuleByNamespace(this.$store, 'mapMutations', namespace)
        if (!module) {
          return
        }
        commit = module.context.commit
      }
      return typeof val === 'function'
        ? val.apply(this, [commit].concat(args))
        // @ts-ignore
        : commit.apply(this.$store, [val].concat(args))
    }
  })
  return res
})

/**
 * Rebinding namespace param for mapXXX function in special scoped, and return them by simple object
 * @param namespace 
 * @returns 
 */
export const createNamespacedHelpers = (namespace: string) => ({
  mapState: mapState.bind(null, namespace),
  mapGetters: mapGetters.bind(null, namespace),
  mapMutations: mapMutations.bind(null, namespace),
  mapActions: mapActions.bind(null, namespace)
})

/**
 * Search a special module from store by namespace. if module not exist, print error message.
 *
 * @param store
 * @param helper
 * @param namespace
 * @returns
 */
function getModuleByNamespace(store: Store, helper: string, namespace: string) {
  const module = store._modulesNamespaceMap[namespace]
  if (process.env.NODE_ENV !== 'production' && !module) {
    console.error(
      `[vuex] module namespace not found in ${helper}(): ${namespace}`
    )
  }
  return module
}

/**
 * Normalize the map
 * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 *
 * @param map
 * @returns
 */
function normalizeMap(map: Record<string, any> | Array<string>) {
  if (!isValidMap(map)) {
    return []
  }
  return Array.isArray(map)
    ? map.map((key) => ({ key, val: key }))
    : Object.keys(map).map((key) => ({ key, val: map[key] }))
}

/**
 * Validate whether given map is valid or not
 *
 * @param map
 * @returns
 */
function isValidMap(map: any) {
  return Array.isArray(map) || isObject(map)
}

/**
 * Return a function expect two param contains namespace and map. it will normalize the namespace and then the param's function will handle the new namespace and the map.
 *
 * @param fn
 * @returns
 */
function normalizeNamespace(fn: Function) {
  return (namespace: Namespace, map?: Map) => {
    if (typeof namespace !== 'string') {
      map = namespace
      namespace = ''
    } else if (namespace.charAt(namespace.length - 1) !== '/') {
      namespace += '/'
    }
    return fn(namespace, map)
  }
}
