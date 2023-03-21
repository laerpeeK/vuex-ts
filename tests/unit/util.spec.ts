import {
  find,
  deepCopy,
  forEachValue,
  isObject,
  isPromise,
  assert,
} from '@/vuex/util'

describe('util', () => {
  it('find: returns item when it was found', () => {
    const list = [33, 22, 112, 222, 43]
    expect(
      find(list, function (a: number) {
        return a % 2 === 0
      })
    ).toEqual(22)
  })

  it('find: returns undefined when item was not found', () => {
    const list = [1, 2, 3]
    expect(
      find(list, function (a: number) {
        return a === 9000
      })
    ).toEqual(undefined)
  })

  it('deepCopy: normal structure', () => {
    const original = {
      a: 1,
      b: 'string',
      c: true,
      d: null,
      e: undefined,
    }
    const copy = deepCopy(original)

    expect(copy).toEqual(original)
  })

  it('deepCopy: nested structure', () => {
    const original = {
      a: {
        b: 1,
        c: [
          2,
          3,
          {
            d: 4,
          },
        ],
      },
    }
    const copy = deepCopy(original)

    expect(copy).toEqual(original)
  })

  it('deepCopy: circular structure', () => {
    const original: Record<string, any> = {
      a: 1,
    }
    original.circular = original

    const copy = deepCopy(original)

    expect(copy).toEqual(original)
  })

  it('forEachValue', () => {
    let number = 1

    function plus(value: number, key: string) {
      number += value
    }

    const origin = {
      a: 1,
      b: 3
    }

    forEachValue(origin, plus)
    expect(number).toEqual(5)
  })

  it('isObject', () => {
    expect(isObject(1)).toBe(false)
    expect(isObject('String')).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject({})).toBe(true)
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(true)
    expect(isObject(new Function())).toBe(false)
  })

  it('isPromise', () => {
    // 调整了new Promise的入参，只允许一个executor
    const promise = new Promise<void>(() => {})
    expect(isPromise(1)).toBe(false)
    expect(isPromise(promise)).toBe(true)
    expect(isPromise(new Function())).toBe(false)
  })

  it('assert', () => {
    expect(assert.bind(null, false, 'Hello')).toThrowError('[vuex] Hello')
  })
})
