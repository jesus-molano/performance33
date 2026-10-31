import { describe, expect, it } from 'vitest'
import { TV_DEFAULT_SLOTS, TV_MAX_SLOTS } from '@/config/app'
import { parseRoute, parseTvSlots, paths, serializeTvSlots } from './routes'

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
    expect(parseRoute(paths.tv([{ clientId: 'a', day: 2 }]))).toEqual({ name: 'tv', slots: [{ clientId: 'a', day: 2 }] })
  })
})
