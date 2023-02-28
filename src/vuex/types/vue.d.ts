/**
 * Extends interfaces in Vue.js
 */

import Vue, { ComponentOptions } from 'vue'
import { Store } from '../index'

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: Store
  }

  interface WatchOptions {
    sync?: boolean
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: Store
    _data: Record<string, any>
  }
}