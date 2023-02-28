import { Action, Getter, HotUpdateOptions, ModuleContext, Mutation, RawModule } from '../types'
import { forEachValue } from '../util'

export default class Module {
  runtime: boolean
  _children: Record<string, Module>
  state: Record<string, any>
  _rawModule: RawModule
  context!: ModuleContext
  
  constructor(rawModule: RawModule, runtime: boolean) {
    this.runtime = runtime
    // Store some children item
    this._children = Object.create(null)
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule
    const rawState = rawModule.state

    // Store the origin module's state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  get namespaced() {
    return !!this._rawModule.namespaced
  }

  getChild(key: string) {
    return this._children[key]
  }

  addChild(key: string, module: Module) {
    this._children[key] = module
  }

  removeChild(key: string) {
    delete this._children[key]
  }

  hasChild(key: string) {
    return key in this._children
  }

  forEachMutation(fn: (mutation: Mutation, key: string) => void) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }

  forEachAction(fn: (action: Action, key: string) => void) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  forEachGetter(fn: (getter: Getter, key: string) => void) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  forEachChild(fn: (child: Module, key: string) => void) {
    forEachValue(this._children, fn)
  }

  update(rawModule: HotUpdateOptions) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }

    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }

    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }
}
