import { describe, expect, it } from 'vitest'
import { parseTvControlMessage, tileArea, tileGrid } from './tvControl'

describe('parseTvControlMessage', () => {
  it('reads the three orders', () => {
    expect(parseTvControlMessage({ type: 'close-all' })).toEqual({ type: 'close-all' })
    expect(parseTvControlMessage({ type: 'place', screen: 2 })).toEqual({ type: 'place', screen: 2 })
    expect(parseTvControlMessage({ type: 'bring-all', screens: [3, 1, 3] })).toEqual({ type: 'bring-all', screens: [1, 3] })
  })

  it('drops what is not one of its messages', () => {
    expect(parseTvControlMessage(null)).toBeNull()
    expect(parseTvControlMessage('close-all')).toBeNull()
    expect(parseTvControlMessage({ type: 'open', screen: 1 })).toBeNull()
    expect(parseTvControlMessage({ type: 'place', screen: 0 })).toBeNull()
    expect(parseTvControlMessage({ type: 'place', screen: 1.5 })).toBeNull()
    expect(parseTvControlMessage({ type: 'place', screen: '2' })).toBeNull()
  })

  it('keeps only valid screen numbers when bringing them', () => {
    expect(parseTvControlMessage({ type: 'bring-all', screens: [2, 'x', 99, -1] })).toEqual({ type: 'bring-all', screens: [2] })
    expect(parseTvControlMessage({ type: 'bring-all' })).toEqual({ type: 'bring-all', screens: [] })
  })
})

describe('tileGrid', () => {
  it('is as square as possible, wider than tall', () => {
    expect(tileGrid(0)).toEqual({ columns: 1, rows: 1 })
    expect(tileGrid(1)).toEqual({ columns: 1, rows: 1 })
    expect(tileGrid(2)).toEqual({ columns: 2, rows: 1 })
    expect(tileGrid(3)).toEqual({ columns: 2, rows: 2 })
    expect(tileGrid(5)).toEqual({ columns: 3, rows: 2 })
    expect(tileGrid(8)).toEqual({ columns: 3, rows: 3 })
  })
})

describe('tileArea', () => {
  const laptop = { left: 0, top: 0, width: 1920, height: 1040 }

  it('gives one window the whole laptop', () => {
    expect(tileArea(1, [1], laptop, 0)).toEqual(laptop)
  })

  it('puts the windows side by side by screen number, never overlapping', () => {
    const one = tileArea(1, [2, 1], laptop, 8)
    const two = tileArea(2, [2, 1], laptop, 8)
    expect(one).toEqual({ left: 0, top: 0, width: 956, height: 1040 })
    expect(two).toEqual({ left: 964, top: 0, width: 956, height: 1040 })
    expect(one.left + one.width).toBeLessThan(two.left)
  })

  it('fills rows in a grid and stays inside the laptop', () => {
    const screens = [1, 2, 3]
    const third = tileArea(3, screens, laptop, 0)
    expect(third).toEqual({ left: 0, top: 520, width: 960, height: 520 })
    for (const screen of screens) {
      const cell = tileArea(screen, screens, laptop, 0)
      expect(cell.left + cell.width).toBeLessThanOrEqual(laptop.width)
      expect(cell.top + cell.height).toBeLessThanOrEqual(laptop.height)
    }
  })

  it('follows a laptop that is not at the origin and a window missing from the list', () => {
    const area = { left: -1920, top: 100, width: 1920, height: 1080 }
    expect(tileArea(4, [1], area, 0)).toEqual({ left: -960, top: 100, width: 960, height: 1080 })
  })
})
