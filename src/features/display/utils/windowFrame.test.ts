import { describe, expect, it } from 'vitest'
import { isWindowOn } from './windowFrame'

const tv = { left: 1920, top: 0, width: 1920, height: 1080 }

describe('isWindowOn', () => {
  it('is on the TV when its middle is there', () => {
    expect(isWindowOn({ left: 1920, top: 0, width: 1920, height: 1080 }, tv)).toBe(true)
    expect(isWindowOn({ left: 1500, top: 100, width: 1200, height: 700 }, tv)).toBe(true)
  })

  it('is not when Windows moved it to the laptop (the TV went away)', () => {
    expect(isWindowOn({ left: 0, top: 0, width: 1920, height: 1080 }, tv)).toBe(false)
    expect(isWindowOn({ left: 1000, top: 0, width: 1200, height: 700 }, tv)).toBe(false)
  })
})
