/**
 * 断言函数
 * @param condiition 
 * @param msg 
 */
export function assert(condiition: boolean, msg: string) {
  if (!condiition) throw new Error(`[vuex] ${msg}`)
}

/**
 * 对obj对象的每一项均执行fn, fn执行时第一个入参为obj[key], 第二个入参为key
 * @param obj 
 * @param fn 
 */
export function forEachValue(obj: Record<string, any>, fn: Function) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

/**
 * 判断入参obj是否为对象类型-typeof
 * @param obj 
 * @returns 
 */
export function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}


/**
 * 判断val是否为Promise实例
 * @param val 
 * @returns 
 */
export function isPromise(val: any): boolean {
  return val && typeof val.then === 'function'
}

/**
 * 缓存fn, 调用该函数返回值时返回fn调用结果
 * @param fn 
 * @param arg 
 * @returns 
 */
export function partial(fn: Function, arg: any) {
  return function() {
    return fn(arg)
  }
}

/**
 * Get the first item that pass the test
 * by second argument function
 * 
 * @param list 
 * @param f 
 * @returns 
 */
export function find(list: Array<any>, f: (c: any) => boolean) {
  return list.filter(f)[0]
}

/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 * 
 * @param obj 
 * @param cache 
 * @returns 
 */
export function deepCopy(obj: any, cache: Array<Record<string, any>> = []) {
  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // if obj is hit, it is in circular structure
  const hit = find(cache, (c: any) => c.original === obj)
  if (hit) {
    return hit.copy
  }

  const copy: Record<string, any> | Array<any> = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach((key:string) => {
    // @ts-ignore
    copy[key] = deepCopy(obj[key], cache)
  })

  return copy
}