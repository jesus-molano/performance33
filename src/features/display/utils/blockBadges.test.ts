import { describe, expect, it } from 'vitest'
import type { DisplayBlock } from '@/lib/display'
import { getBandChips } from './blockBadges'

const block = (patch: Partial<DisplayBlock>): DisplayBlock => ({
  id: 'b',
  type: 'normal',
  letter: 'A',
  title: 'Fuerza',
  headline: 'Fuerza',
  note: '',
  text: '',
  muted: false,
  exercises: [],
  ...patch,
})

describe('getBandChips', () => {
  it('shows the acronym, rep scheme and rest between rounds, in that order', () => {
    const chips = getBandChips(block({ badge: 'FOR TIME', chip: '21-15-9', footer: 'Descanso 2′ entre rondas' }))
    expect(chips).toEqual(['FOR TIME', '21-15-9', 'Descanso 2′ entre rondas'])
  })

  it('leaves out an acronym the headline already spells, and empty parts', () => {
    expect(getBandChips(block({ headline: 'EMOM 12′', badge: 'EMOM' }))).toEqual([])
  })
})
