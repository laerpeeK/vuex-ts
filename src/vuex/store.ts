import type { VueConstructor, WatchOptions } from 'vue'
import type VueInstance from 'vue'
import type {
  StoreOptions,
  ObjectType,
  ModuleContext,
  Mutation,
  Getter,
  ActionHandler,
  SubscribeActionOptions,
  ActionSubscribersObject,
  MutationSubscriber,
  RawModule,
  HotUpdateOptions,
} from './types'
import { assert, isObject, isPromise, forEachValue, partial } from './util'
import applyMixin from './mixin'
import ModuleCollection from './module/module-collection'
import Module from './module/module'
import devtoolPlugin from './plugins/devtool'

let Vue: VueConstructor
export class Store {
  _committing: boolean
  _actions: Record<string, Array<(payload: any) => Promise<any> | undefined>>
  _actionSubscribers: Array<Function | Object>
  _mutations: Record<string, Array<(payload: any) => any>>
  _subscribers: Array<Function>
  _wrappedGetters: Record<string, (store: Store) => any>
  _watcherVM: VueInstance
  _modules: ModuleCollection
  _modulesNamespaceMap: Record<string, Module>
  strict?: boolean
  getters!: Record<string, () => unknown>
  _makeLocalGettersCache!: Record<string, any>
  _devtoolHook?: any
  _vm?: VueInstance

  constructor(options: StoreOptions = {}) {
    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    if (process.env.NODE_ENV !== 'production') {
      assert(
        typeof Vue !== 'undefined',
        `must call Vue.use(Vuex) before creating a store instance.`
      )
      assert(
        typeof Promise !== 'undefined',
        `vuex requires a Promise polyfill in this browser.`
      )
      assert(
        this instanceof Store,
        `store must be called with the new operator.`
      )
    }

    const { plugins = [], strict = false } = options

    this._committing = false // 用于区分是否为合理修改state的情况，为false时，修改state在严格模式下会报错
    this._actions = Object.create(null) // 存储所有包装完成的actions
    this._actionSubscribers = [] // action的订阅处理函数
    this._mutations = Object.create(null) // 存储所有包装完成的mutations
    this._wrappedGetters = Object.create(null) // 存储所有包装完成的getters
    this._modules = new ModuleCollection(options) // moduleCollection, 主要有一个root属性，指向根module。 该实例可以理解为多个module连接起来的“连接中间件”
    this._modulesNamespaceMap = Object.create(null) // 存储除了根module以外的所有module, 比如accountModule会存储为 {account: accountModule}
    this._subscribers = [] // mutation的订阅处理函数
    this._watcherVM = new Vue() // store.watch所用到的Vue实例

    // bind commit and dispatch to self
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch(
      type: string | ObjectType,
      payload?: any
    ) {
      return dispatch.call(store, type, payload)
    }

    this.commit = function boundCommit(
      type: string | ObjectType,
      payload?: any,
      options?: any
    ) {
      return commit.call(store, type, payload, options)
    }

    // strict mode
    this.strict = strict

    const state = this._modules.root.state

    // init root state
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state)

    // apply plugins
    plugins.forEach(plugin => plugin(this))

    // devtools
    const useDevtools = options.devtools !== undefined ? options.devtools : Vue.config.devtools
    if (useDevtools) {
      devtoolPlugin(this)
    }
  }

  get state(): Record<string, any> {
    return this._vm?._data.$$state
  }

  set state(v) {
    if (process.env.NODE_ENV !== 'production') {
      assert(false, `use store.replaceState() to explicit replace store state.`)
    }
  }

  commit(_type: string | ObjectType, _payload?: any, _options?: any) {
    // check object-style commit
    const { type, payload, options } = unifyObjectStyle(
      _type,
      _payload,
      _options
    )

    const mutation = { type, payload }
    // @ts-ignore
    const entry = this._mutations[type]
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }

    this._withCommit(() => {
      entry.forEach(function commitIterator(handler: Function) {
        handler(payload)
      })
    })

    this._subscribers
      .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
      .forEach((sub) => sub(mutation, this.state))

    if (process.env.NODE_ENV !== 'production' && options && options.silent) {
      console.warn(
        `[vuex] mutation type: ${type}. Silent option has been removed. ` +
          'Use the filter functionality in the vue-devtools'
      )
    }
  }

  dispatch(_type: string | ObjectType, _payload?: any) {
    // check object-style dispatch
    const { type, payload } = unifyObjectStyle(_type, _payload)

    const action = { type, payload }
    // @ts-ignore
    const entry = this._actions[type]
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    try {
      this._actionSubscribers
        .slice()
        .filter((sub: any) => {
          return sub.before
        })
        .forEach((sub: any) => sub.before(action, this.state))
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[vuex] error in before action subscribers: `)
        console.error(e)
      }
    }

    const result: Promise<any> =
      entry.length > 1
        ? Promise.all(entry.map((handler: Function) => handler(payload)))
        : entry[0](payload)

    return new Promise<any>((resolve, reject) => {
      result.then(
        (res: any) => {
          try {
            this._actionSubscribers
              .filter((sub: any) => sub.after)
              .forEach((sub: any) => sub.after(action, this.state))
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`[vuex] error in after action subscribers: `)
              console.error(e)
            }
          }
          resolve(res)
        },
        (error: any) => {
          try {
            this._actionSubscribers
              .filter((sub:any) => sub.error)
              .forEach((sub:any) => sub.error(action, this.state, error))
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`[vuex] error in error action subscribers: `)
              console.error(e)
            }
          }
          reject(error)
        }
      )
    })
  }

  _withCommit(fn: Function) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = false
  }

  /**
   * 响应式地侦听 fn 的返回值，当值改变时调用回调函数。
   *
   * @param getter
   * @param cb
   * @param options
   * @returns
   */
  watch(getter: Function, cb: Function, options: WatchOptions) {
    if (process.env.NODE_ENV !== 'production') {
      assert(
        typeof getter === 'function',
        `store.watch only accepts a function.`
      )
    }

    // @ts-ignore
    return this._watcherVM.$watch(
      () => getter(this.state, this.getters),
      cb,
      options
    )
  }

  replaceState(state: any) {
    this._withCommit(() => {
      this._vm!._data.$$state = state
    })
  }

  subscribe(fn: MutationSubscriber, options?: { prepend: boolean }) {
    return genericSubscribe(fn, this._subscribers, options)
  }

  subscribeAction(fn: SubscribeActionOptions, options?: { prepend: boolean }) {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, this._actionSubscribers, options)
  }

  registerModule(path: string | Array<string>, rawModule: RawModule, options?: {preserveState: boolean}) {
    if (typeof path === 'string') path = [path]
    
    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
      assert(path.length > 0, 'cannot register the root module by using registerModule.')
    }

    this._modules.register(path, rawModule)
    installModule(this, this.state, path, this._modules.get(path), options?.preserveState)
    // reset store to update getters
    resetStoreVM(this, this.state)
  }

  unregisterModule(path: string | Array<string>) {
    if (typeof path === 'string') path = [path]

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    this._modules.unregister(path)
    this._withCommit(() => {
      const parentState = getNestedState(this.state, path.slice(0, -1) as Array<string>)
      Vue.delete(parentState, path[path.length - 1])
    })
    resetStore(this)
  }

  hasModule(path: string | Array<string>): boolean {
    if (typeof path === 'string') path = [path]

    if (process.env.NODE_ENV !== 'production') {
      assert(Array.isArray(path), `module path must be a string or an Array.`)
    }

    return this._modules.isRegistered(path)
  }

  hotUpdate(newOptions: HotUpdateOptions) {
    this._modules.update(newOptions)
    resetStore(this, true)
  }
}

export function install(_Vue: VueConstructor) {
  if (Vue && _Vue === Vue) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      )
    }
    return
  }
  Vue = _Vue
  applyMixin(Vue)
}

function resetStore(store: Store, hot?: boolean) {
  store._actions = Object.create(null)
  store._mutations = Object.create(null)
  store._wrappedGetters = Object.create(null)
  store._modulesNamespaceMap = Object.create(null)
  const state = store.state
  // init all modules
  installModule(store, state, [], store._modules.root, true)
  // reset vm
  resetStoreVM(store, state, hot)
}

function genericSubscribe(
  fn: MutationSubscriber | ActionSubscribersObject,
  subs: Array<Function | ActionSubscribersObject>,
  options?: { prepend: boolean }
) {
  if (subs.indexOf(fn) < 0) {
    options && options.prepend ? subs.unshift(fn) : subs.push(fn)
  }
  return () => {
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}

function resetStoreVM(store: Store, state: any, hot?: boolean) {
  const oldVm = store._vm

  // bind store public getters
  store.getters = {}
  // reset local getters cache
  store._makeLocalGettersCache = Object.create(null)
  const wrappedGetters = store._wrappedGetters
  const computed: Record<string, () => unknown> = {}
  forEachValue(wrappedGetters, (fn: (store: Store) => any, key: string) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure enviroment.
    computed[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      // @ts-ignore
      get: () => store._vm[key],
      enumerable: true, // for local getters
    })
  })

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      $$state: state,
    },
    computed,
  })
  Vue.config.silent = silent

  // enable strict mode for new vm
  if (store.strict) {
    enableStrictMode(store)
  }

  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}

function enableStrictMode(store: Store) {
  store._vm?.$watch(
    function () {
      return this._data.$$state
    },
    () => {
      if (process.env.NODE_ENV !== 'production') {
        assert(
          store._committing,
          `do not mutate vuex store state outside mutation handlers.`
        )
      }
    },
    { deep: true, sync: true }
  )
}

function unifyObjectStyle(
  type: string | ObjectType,
  payload?: any,
  options?: any
) {
  if (isObject(type) && (type as ObjectType).type) {
    options = payload
    payload = type
    type = (type as ObjectType).type
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(
      typeof type === 'string',
      `expects string as the type, but found ${typeof type}.`
    )
  }

  return {
    type,
    payload,
    options,
  }
}

function installModule(
  store: Store,
  rootState: Record<string, any>,
  path: Array<string>,
  module: Module,
  hot?: boolean
) {
  const isRoot = !path.length
  const namespace = store._modules.getNamespace(path)

  // register in namespace map
  if (module.namespaced) {
    if (
      store._modulesNamespaceMap[namespace] &&
      process.env.NODE_ENV !== 'production'
    ) {
      console.error(
        `[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join(
          '/'
        )}`
      )
    }
    store._modulesNamespaceMap[namespace] = module
  }

  // set state
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      if (process.env.NODE_ENV !== 'production') {
        if (moduleName in parentState) {
          console.warn(
            `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join(
              '.'
            )}"`
          )
        }
      }
      Vue.set(parentState, moduleName, module.state)
    })
  }

  const local = (module.context = makeLocalContext(store, namespace, path))

  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key
    registerMutation(store, namespacedType, mutation, local)
  })

  module.forEachAction((action, key) => {
    // @ts-ignore
    const type = action.root ? key : namespace + key
    // @ts-ignore
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })

  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })

  module.forEachChild((child: Module, key: string) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

/**
 * 填充store._mutations
 * @param store
 * @param type
 * @param handler
 * @param local
 */
function registerMutation(
  store: Store,
  type: string,
  handler: Mutation,
  local: ModuleContext
) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler(payload?) {
    handler.call(store, local.state, payload)
  })
}

function registerAction(
  store: Store,
  type: string,
  handler: ActionHandler,
  local: ModuleContext
) {
  const entry = store._actions[type] || (store._actions[type] = [])
  entry.push(function wrappedActionHandler(payload?) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload
    )

    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }

    if (store._devtoolHook) {
      return res.catch((err: any) => {
        store._devtoolHook.emit('vuex:error', err)
        throw err
      })
    } else {
      return res
    }
  })
}

function registerGetter(
  store: Store,
  type: string,
  rawGetter: Getter,
  local: ModuleContext
) {
  if (store._wrappedGetters[type]) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }

  store._wrappedGetters[type] = function wrappedGetter(store: Store) {
    return rawGetter(local.state, local.getters, store.state, store.getters)
  }
}

/**
 * 返回某个模块上下文的state
 * @param state
 * @param path
 * @returns localState
 */
function getNestedState(state: Record<string, any>, path: Array<string>) {
  return path.reduce((state, key) => state[key], state)
}

/**
 * make localized dispatch, commit, getters and state
 * if there is no namespace, just use root ones
 *
 * @param store
 * @param namespace
 * @param path
 * @returns localContext
 */
function makeLocalContext(
  store: Store,
  namespace: string,
  path: Array<string>
) {
  const noNamespace = namespace === ''
  const local = {
    dispatch: noNamespace
      ? store.dispatch
      : (_type: string | ObjectType, _payload?: any, _options?: any) => {
          const args = unifyObjectStyle(_type, _payload, _options)
          const { payload, options } = args
          let { type } = args
          if (!options || !options.root) {
            type = namespace + type
            if (
              process.env.NODE_ENV !== 'production' &&
              !store._actions[type]
            ) {
              console.error(
                `[vuex] unknown local action type: ${args.type}, global type: ${type}`
              )
              return
            }
          }
          return store.dispatch(type, payload)
        },

    commit: noNamespace
      ? store.commit
      : (_type: string | ObjectType, _payload?: any, _options?: any) => {
          const args = unifyObjectStyle(_type, _payload, _options)
          const { payload, options } = args
          let { type } = args

          if (!options || !options.root) {
            type = namespace + type
            if (
              process.env.NODE_ENV !== 'production' &&
              !store._mutations[type]
            ) {
              console.error(
                `[vuex] unknown local mutation type: ${args.type}, global type: ${type}`
              )
              return
            }
          }
          store.commit(type, payload, options)
        },
  } as ModuleContext
  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace),
    },
    state: {
      get: () => getNestedState(store.state, path),
    },
  })

  return local
}

/**
 * 返回当前模块上下文的getters
 * @param store
 * @param namespace
 * @returns
 */
function makeLocalGetters(store: Store, namespace: string) {
  if (!store._makeLocalGettersCache[namespace]) {
    const getterProxy = {}
    const splitPos = namespace.length
    Object.keys(store.getters).forEach((type: string) => {
      // skip if the target getter is not match this namespace
      if (type.slice(0, splitPos) !== namespace) return

      // extract local getter type
      const localType = type.slice(splitPos)

      // Add a port to the getters proxy.
      // Define as getter property because
      // we do not want to evaluate the getters in this time.
      Object.defineProperty(getterProxy, localType, {
        get: () => store.getters[type],
        enumerable: true,
      })
    })
    store._makeLocalGettersCache[namespace] = getterProxy
  }

  return store._makeLocalGettersCache[namespace]
}
