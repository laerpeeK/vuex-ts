import type { Store } from '../store'

export interface ActionContext {
  dispatch: Dispatch
  commit: Commit
  state: any
  getters: any
  rootState: any
  rootGetters: any
}
export type ActionHandler = (
  this: Store,
  injectee: ActionContext,
  payload?: any
) => any
export interface ActionObject {
  root?: boolean
  handler: ActionHandler
}

export type Plugin = (store: Store) => any
export type Mutation = (state: any, payload?: any) => any
export type Action = ActionHandler | ActionObject
export type Getter = (
  state: any,
  getters: Record<string, Getter>,
  rootState?: any,
  rootGetters?: Record<string, Getter>
) => any

export interface StoreOptions {
  strict?: boolean
  plugins?: Array<Plugin>
  state?: Record<string, any> | (() => Record<string, any>)
  modules?: Record<string, RawModule>
  mutations?: Record<string, Mutation>
  actions?: Record<string, Action>
  getters?: Record<string, Getter>
  devtools?: boolean
}

export interface RawModule {
  namespaced?: boolean
  state?: Record<string, any> | (() => Record<string, any>)
  [key: string]: any
  modules?: Record<string, RawModule>
  mutations?: Record<string, Mutation>
  actions?: Record<string, Action>
  getters?: Record<string, Getter>
}

export interface DispatchOptions {
  root?: boolean
}

export interface ObjectType {
  type: string
  [key: string]: any
}

export interface Dispatch {
  (type: string | ObjectType, payload?: any, options?: DispatchOptions):
    | Promise<any>
    | undefined
  (type: string | ObjectType, payload?: any): Promise<any> | undefined
}

export interface Commit {
  (type: string | ObjectType, payload?: any, options?: any): void
}

export interface Getters {}

export interface ModuleContext {
  dispatch: Dispatch
  commit: Commit
  getters: Record<string, () => unknown>
  state: Record<string, any>
}

export type ActionSubscriber = (action: { type: string | ObjectType; payload?: any }, state: any) => any
export type ActionErrorSubscriber = (
  action: { type: string | ObjectType; payload?: any },
  state: any,
  error: Error
) => any

export interface ActionSubscribersObject {
  before?: ActionSubscriber
  after?: ActionSubscriber
  error?: ActionErrorSubscriber
}

export type SubscribeActionOptions = ActionSubscriber | ActionSubscribersObject
export type MutationSubscriber = (
  mutation: { type: string | ObjectType; payload?: any },
  state: any
) => any

export interface HotUpdateOptions {
  namespaced?: boolean
  modules?: Record<string, RawModule>
  mutations?: Record<string, Mutation>
  actions?: Record<string, Action>
  getters?: Record<string, Getter>
}
