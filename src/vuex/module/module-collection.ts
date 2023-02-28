import type { RawModule, HotUpdateOptions } from '../types'
import { forEachValue, assert } from '../util'
import Module from './module'

type assertOptions = { assert: (value: any) => boolean; expected: string }

type assertTypes = {
  getters: assertOptions
  mutations: assertOptions
  actions: assertOptions
  [key: string]: assertOptions
}

export default class ModuleCollection {
  root!: Module

  constructor(rawRootModule: RawModule) {
    this.register([], rawRootModule, false)
  }

  update(rawRootModule: HotUpdateOptions) {
    update([], this.root, rawRootModule)
  }

  register(path: Array<string>, rawModule: RawModule, runtime: boolean = true) {
    if (process.env.NODE_ENV !== 'production') {
      assertRawModule(path, rawModule)
    }

    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) {
      this.root = newModule
    } else {
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // register nested modules
    if (rawModule.modules) {
      forEachValue(
        rawModule.modules,
        (rawChildModule: RawModule, key: string) => {
          this.register(path.concat(key), rawChildModule, runtime)
        }
      )
    }
  }

  unregister(path: Array<string>) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    const child = parent.getChild(key)

    if (!child) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[vuex] trying to unregister module '${key}', which is ` +
            `not registered`
        )
      }
      return
    }

    if (!child.runtime) {
      return
    }

    parent.removeChild(key)
  }

  isRegistered(path: Array<string>) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]

    if (parent) {
      return parent.hasChild(key)
    }

    return false
  }

  get(path: Array<string>) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }

  getNamespace(path: Array<string>) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }
}

const functionAssert: assertOptions = {
  assert: (value: any): boolean => {
    return typeof value === 'function'
  },
  expected: 'function',
}

const objectAssert: assertOptions = {
  assert: (value: any): boolean => {
    return (
      typeof value === 'function' ||
      (typeof value === 'object' && typeof value.handler === 'function')
    )
  },
  expected: 'function or object with "handler" function',
}

const assertTypes: assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert,
}

function update(
  path: Array<string>,
  targetModule: Module,
  newModule: HotUpdateOptions
) {
  if (process.env.NODE_ENV !== 'production') {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
              'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}

/**
 * 校验getters, mutations, actions类型是否正确
 * @param path
 * @param rawModule
 */
function assertRawModule(path: Array<string>, rawModule: RawModule) {
  Object.keys(assertTypes).forEach((key: string) => {
    if (!rawModule[key]) return

    const assertOptions: assertOptions = assertTypes[key]
    forEachValue(rawModule[key], (value: any, type: string) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}

/**
 * 生成完整的报错提示信息
 * @param path
 * @param key
 * @param type
 * @param value
 * @param expected
 * @returns
 */
function makeAssertionMessage(
  path: Array<string>,
  key: string,
  type: string,
  value: any,
  expected: string
): string {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
