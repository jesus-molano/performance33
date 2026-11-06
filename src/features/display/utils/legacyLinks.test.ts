import { describe, expect, it } from 'vitest'
import { LEGACY_TV_LINKS_REMEMBERED } from '@/features/display/config/tv'
import { legacyLinkId, parseUsedLinks, withUsedLink } from './legacyLinks'

describe('old ?slots= links used on this device', () => {
  it('are told apart by screen and list', () => {
    const slots = [{ clientId: 'laura', day: 2 }, { clientId: null, day: 1 }]
    expect(legacyLinkId(2, slots)).toBe('2|laura:2,-')
    expect(legacyLinkId(1, slots)).not.toBe(legacyLinkId(2, slots))
  })

  it('reads back what it keeps, ignores anything else and keeps only the newest', () => {
    expect(parseUsedLinks(JSON.stringify(['1|a:1', 5]))).toEqual(['1|a:1'])
    expect(parseUsedLinks('nope')).toEqual([])
    expect(parseUsedLinks(null)).toEqual([])
    const many = Array.from({ length: LEGACY_TV_LINKS_REMEMBERED + 3 }, (_, i) => `1|c${i}:1`).reduce(withUsedLink, [] as string[])
    expect(many).toHaveLength(LEGACY_TV_LINKS_REMEMBERED)
    expect(many.at(-1)).toBe(`1|c${LEGACY_TV_LINKS_REMEMBERED + 2}:1`)
    expect(withUsedLink(['a', 'b'], 'a')).toEqual(['b', 'a'])
  })
})
