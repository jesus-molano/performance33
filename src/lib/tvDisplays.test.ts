import { describe, expect, it } from 'vitest'
import type { DetectedDisplay } from './screenDetails'
import { displaysOf, LAPTOP, tv } from './screenDetails.fakes'
import { assignTvDisplay, lostTvScreens, parseTvDisplayMap, rememberTvDisplays, resolveTvDisplays, serializeTvDisplayMap, tvCandidates } from './tvDisplays'

const gym = displaysOf(LAPTOP, tv(3840, 'Derecha'), tv(1920, 'Izquierda'))
const keysOf = (resolved: ReadonlyMap<number, DetectedDisplay>) => Object.fromEntries([...resolved].map(([screen, d]) => [screen, d.key]))

describe('the TV map of this computer', () => {
  it('reads back what it saves and ignores anything else', () => {
    expect(parseTvDisplayMap(serializeTvDisplayMap({ 1: 'LG TV', 2: 'Wireless Display' }))).toEqual({ 1: 'LG TV', 2: 'Wireless Display' })
    expect(parseTvDisplayMap(null)).toEqual({})
    expect(parseTvDisplayMap('no json')).toEqual({})
    expect(parseTvDisplayMap('[1,2]')).toEqual({})
    expect(parseTvDisplayMap('{"0":"a","9":"b","2":5,"3":"","4":"ok"}')).toEqual({ 4: 'ok' })
  })

  it('gives a TV to one screen only, and goes back to automatic with null', () => {
    expect(assignTvDisplay({ 1: 'A', 2: 'B' }, 2, 'A')).toEqual({ 2: 'A' })
    expect(assignTvDisplay({ 1: 'A', 2: 'B' }, 1, null)).toEqual({ 2: 'B' })
  })
})

describe('resolveTvDisplays', () => {
  it('uses every screen but the main one, left to right, by default', () => {
    expect(tvCandidates(gym).map((d) => d.key)).toEqual(['Izquierda', 'Derecha'])
    expect(keysOf(resolveTvDisplays({}, gym))).toEqual({ 1: 'Izquierda', 2: 'Derecha' })
  })

  it('keeps the choice made on this computer and fills the rest', () => {
    expect(keysOf(resolveTvDisplays({ 1: 'Derecha' }, gym))).toEqual({ 1: 'Derecha', 2: 'Izquierda' })
    expect(keysOf(resolveTvDisplays({ 3: 'Izquierda' }, gym))).toEqual({ 1: 'Derecha', 3: 'Izquierda' })
  })

  it('may send a screen to the laptop when chosen', () => {
    expect(keysOf(resolveTvDisplays({ 2: 'Pantalla integrada' }, gym))).toEqual({ 1: 'Izquierda', 2: 'Pantalla integrada', 3: 'Derecha' })
  })

  it('leaves a screen without TV when its TV is not connected, instead of taking another one', () => {
    const oneTv = displaysOf(LAPTOP, tv(1920, 'Izquierda'))
    expect(keysOf(resolveTvDisplays({ 2: 'Derecha' }, oneTv))).toEqual({ 1: 'Izquierda' })
  })

  it('an automatic screen keeps its TV: when the left one goes, Pantalla 1 is left without and Pantalla 2 keeps the right', () => {
    const first = resolveTvDisplays({}, gym)
    const remembered = rememberTvDisplays({}, first, {})
    expect(remembered).toEqual({ 1: 'Izquierda', 2: 'Derecha' })
    const rightOnly = displaysOf(LAPTOP, tv(3840, 'Derecha'))
    const without = resolveTvDisplays({}, rightOnly, remembered)
    expect(keysOf(without)).toEqual({ 2: 'Derecha' })
    const kept = rememberTvDisplays({}, without, remembered)
    expect(keysOf(resolveTvDisplays({}, gym, kept))).toEqual({ 1: 'Izquierda', 2: 'Derecha' })
  })

  it('a new TV goes to the screen that lost its own, and a choice made by hand still wins', () => {
    const remembered = { 1: 'Izquierda', 2: 'Derecha' }
    const replaced = displaysOf(LAPTOP, tv(3840, 'Derecha'), tv(5760, 'Nueva'))
    expect(keysOf(resolveTvDisplays({}, replaced, remembered))).toEqual({ 1: 'Nueva', 2: 'Derecha' })
    expect(keysOf(resolveTvDisplays({ 2: 'Izquierda' }, gym, remembered))).toEqual({ 1: 'Derecha', 2: 'Izquierda' })
    expect(rememberTvDisplays({ 2: 'Izquierda' }, resolveTvDisplays({ 2: 'Izquierda' }, gym, remembered), remembered)).toEqual({ 1: 'Derecha' })
  })

  it('gives the TVs only to the screens the gym has: a removed screen frees its TV for one without', () => {
    const remembered = { 1: 'Izquierda', 2: 'Derecha' }
    const resolved = resolveTvDisplays({}, gym, remembered, [2, 3])
    expect(keysOf(resolved)).toEqual({ 2: 'Derecha', 3: 'Izquierda' })
    expect(rememberTvDisplays({}, resolved, remembered)).toEqual({ 2: 'Derecha', 3: 'Izquierda' })
    expect(keysOf(resolveTvDisplays({ 1: 'Derecha' }, gym, {}, [2, 3]))).toEqual({ 2: 'Izquierda', 3: 'Derecha' })
    expect(keysOf(resolveTvDisplays({}, gym, {}, [3, 1]))).toEqual({ 1: 'Izquierda', 3: 'Derecha' })
  })

  it('has nothing to place without TVs', () => {
    expect(resolveTvDisplays({ 1: 'Izquierda' }, []).size).toBe(0)
    expect(resolveTvDisplays({}, displaysOf(LAPTOP)).size).toBe(0)
  })
})

describe('lostTvScreens', () => {
  it('lists the screens that had a TV and have none now', () => {
    const before = new Map([
      [1, 'A'],
      [2, 'B'],
    ])
    expect(lostTvScreens(before, new Map([[1, 'A']]))).toEqual([2])
    expect(lostTvScreens(before, before)).toEqual([])
  })
})
