import { describe, expect, it } from 'vitest'
import { TV_MAX_SECTIONS } from '@/config/app'
import { parseLegacyTvSlots, parseRoute, parseTvScreen, paths, serializeTvSlots } from './routes'

describe('old TV links (?slots=)', () => {
  it('keeps old 3-slot URLs working', () => {
    expect(parseLegacyTvSlots('a:1,b:2,')).toEqual([
      { clientId: 'a', day: 1 },
      { clientId: 'b', day: 2 },
      { clientId: null, day: 1 },
    ])
  })

  it('has no list when it is missing or empty', () => {
    expect(parseLegacyTvSlots(null)).toBeNull()
    expect(parseLegacyTvSlots('')).toBeNull()
  })

  it('keeps the actual number of slots, repeated clients included', () => {
    expect(parseLegacyTvSlots('a:1,b:1,a:2,c:1')?.map((s) => s.clientId)).toEqual(['a', 'b', 'a', 'c'])
  })

  it('clamps the count to the maximum', () => {
    expect(parseLegacyTvSlots('a,b,c,d,e,f,g,h')).toHaveLength(TV_MAX_SECTIONS)
  })

  it('round-trips empty columns, a single empty column included', () => {
    const slots = [{ clientId: null, day: 1 }]
    expect(parseLegacyTvSlots(serializeTvSlots(slots))).toEqual(slots)
    const mixed = [
      { clientId: 'x y', day: 3 },
      { clientId: null, day: 1 },
    ]
    expect(parseLegacyTvSlots(serializeTvSlots(mixed))).toEqual(mixed)
  })

  it('falls back to day 1 for invalid days', () => {
    expect(parseLegacyTvSlots('a:0,b:abc')).toEqual([
      { clientId: 'a', day: 1 },
      { clientId: 'b', day: 1 },
    ])
  })

  it('still opens their screen, with the list to fill it', () => {
    expect(parseRoute('#/tv?slots=a:2,-&pantalla=3')).toEqual({
      name: 'tv',
      screen: 3,
      legacySlots: [
        { clientId: 'a', day: 2 },
        { clientId: null, day: 1 },
      ],
    })
  })
})

describe('TV route', () => {
  it('names only the screen', () => {
    expect(paths.tv(3)).toBe('#/tv?pantalla=3')
    expect(paths.tv()).toBe('#/tv?pantalla=1')
    expect(parseRoute(paths.tv(3))).toEqual({ name: 'tv', screen: 3, legacySlots: null })
  })

  it('maps old URLs and invalid numbers to Pantalla 1', () => {
    expect(parseRoute('#/tv?slots=a:1,b:1')).toMatchObject({ name: 'tv', screen: 1 })
    expect(parseRoute('#/tv')).toEqual({ name: 'tv', screen: 1, legacySlots: null })
    for (const raw of ['0', '-1', 'abc', '1.5', '999', null]) expect(parseTvScreen(raw)).toBe(1)
  })
})
