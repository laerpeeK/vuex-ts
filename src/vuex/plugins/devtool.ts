import { Store } from "../store"

const target = typeof window !== 'undefined'
  ? window
  // @ts-ignore
  : typeof global !== 'undefined'
    // @ts-ignore
    ?  global
    : {}

const devtoolHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__

export default function devtoolPlugin(store: Store) {
  if (!devtoolHook) return
  store._devtoolHook = devtoolHook
  devtoolHook.emit('vue:init', store)

  devtoolHook.on('vuex:travel-to-state', (targetState: any) => {
    store.replaceState(targetState)
  })

  store.subscribe((mutation, state) => {
    // console.log('vue-devtool mutationSubscriber')
    devtoolHook.emit('vuex:mutation', mutation, state)
  }, {prepend: true})

  store.subscribeAction((action, state) => {
    // console.log('vue-devtool actionSubscriber')
    devtoolHook.emit('vuex:action', action, state)
  }, { prepend: true })
}