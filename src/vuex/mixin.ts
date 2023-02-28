import type { VueConstructor } from 'vue'
export default function (Vue: VueConstructor) {
  const version = Number(Vue.version.split('.')[0])
  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    console.warn(`此处忽略了Vue@1, 处理方式请参照官方仓库https://github.dev/vuejs/vuex/tree/v3.6.2.`)
  }
}

function vuexInit(this: any) {
  const options = this.$options
  if (options.store) {
    this.$store = typeof options.store === 'function'
      ? options.store()
      : options.store
  } else if (options.parent && options.parent.$store) {
    this.$store = options.parent.$store
  }
}