import { describe, expect, it } from 'vitest'
import { TV_DEFAULT_SLOTS, TV_MAX_SLOTS } from '@/config/app'
import { parseRoute, parseTvScreen, parseTvSlots, paths, serializeTvSlots } from './routes'

describe('TV slots in the URL', () => {
  it('keeps old 3-slot URLs working', () => {
    expect(parseTvSlots('a:1,b:2,')).toEqual([
      { clientId: 'a', day: 1 },
      { clientId: 'b', day: 2 },
      { clientId: null, day: 1 },
    ])
  })

  it('uses the default count when the list is missing', () => {
    expect(parseTvSlots(null)).toHaveLength(TV_DEFAULT_SLOTS)
    expect(parseTvSlots('')).toHaveLength(TV_DEFAULT_SLOTS)
  })

  it('keeps the actual number of slots, repeated clients included', () => {
    expect(parseTvSlots('a:1,b:1,a:2,c:1').map((s) => s.clientId)).toEqual(['a', 'b', 'a', 'c'])
  })

  it('clamps the count to the maximum', () => {
    expect(parseTvSlots('a,b,c,d,e,f')).toHaveLength(TV_MAX_SLOTS)
  })

  it('round-trips empty columns, a single empty column included', () => {
    const slots = [{ clientId: null, day: 1 }]
    expect(parseTvSlots(serializeTvSlots(slots))).toEqual(slots)
    const mixed = [
      { clientId: 'x y', day: 3 },
      { clientId: null, day: 1 },
    ]
    expect(parseTvSlots(serializeTvSlots(mixed))).toEqual(mixed)
  })

  it('falls back to day 1 for invalid days', () => {
    expect(parseTvSlots('a:0,b:abc')).toEqual([
      { clientId: 'a', day: 1 },
      { clientId: 'b', day: 1 },
    ])
  })

  it('parses the tv route', () => {
    expect(parseRoute(paths.tv([{ clientId: 'a', day: 2 }]))).toEqual({ name: 'tv', screen: 1, slots: [{ clientId: 'a', day: 2 }] })
  })

  it('keeps each named screen in its URL', () => {
    expect(paths.tv([{ clientId: 'a', day: 2 }], 3)).toBe('#/tv?slots=a:2&pantalla=3')
    expect(parseRoute(paths.tv([{ clientId: 'a', day: 2 }], 3))).toMatchObject({ name: 'tv', screen: 3 })
  })

  it('maps old URLs and invalid numbers to Pantalla 1', () => {
    expect(parseRoute('#/tv?slots=a:1,b:1')).toMatchObject({ name: 'tv', screen: 1 })
    expect(parseRoute('#/tv')).toMatchObject({ name: 'tv', screen: 1 })
    expect(paths.tv([], 1)).toBe('#/tv?slots=')
    for (const raw of ['0', '-1', 'abc', '1.5', '999', null]) expect(parseTvScreen(raw)).toBe(1)
  })
})
