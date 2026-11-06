import { describe, expect, it } from 'vitest'
import { displaysOf, LAPTOP, tv } from '@/lib/screenDetails.fakes'
import { AUTOMATIC_DISPLAY, choiceFromValue, displayChoiceRows } from './detectedDisplays'

const gym = displaysOf(LAPTOP, tv(1920, 'Izquierda'), tv(3840, 'Derecha'))
const screens = [
  { id: 1, name: 'Pantalla 1' },
  { id: 2, name: 'Sala' },
]

describe('displayChoiceRows', () => {
  it('shows which TV automatic picks now, and every screen to choose from', () => {
    const [first, second] = displayChoiceRows(screens, {}, gym)
    expect(first.value).toBe(AUTOMATIC_DISPLAY)
    expect(first.options.map((o) => o.label)).toEqual(['Automática (Izquierda)', 'Pantalla integrada (este portátil)', 'Izquierda', 'Derecha'])
    expect(second.options[0].label).toBe('Automática (Derecha)')
  })

  it('keeps a choice and works out automatic for the others around it', () => {
    const [first, second] = displayChoiceRows(screens, { 2: 'Izquierda' }, gym)
    expect(second.value).toBe('Izquierda')
    expect(second.options[0].label).toBe('Automática (Derecha)')
    expect(first.options[0].label).toBe('Automática (Derecha)')
  })

  it('keeps a chosen TV that is not connected, marked as such', () => {
    const [first] = displayChoiceRows(screens, { 1: 'Vieja' }, gym)
    expect(first.disconnected).toBe(true)
    expect(first.value).toBe('Vieja')
    expect(first.options.at(-1)).toEqual({ value: 'Vieja', label: 'Vieja desconectada' })
  })

  it('says when automatic has no TV left', () => {
    const rows = displayChoiceRows([...screens, { id: 3, name: 'Pantalla 3' }], {}, gym)
    expect(rows[2].options[0].label).toBe('Automática (ninguna libre)')
  })

  it('turns the select value into what is saved', () => {
    expect(choiceFromValue(AUTOMATIC_DISPLAY)).toBeNull()
    expect(choiceFromValue('LG TV')).toBe('LG TV')
  })
})
