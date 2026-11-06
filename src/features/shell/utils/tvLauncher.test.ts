import { describe, expect, it } from 'vitest'
import { screenRowAction, screenStatusLine, stepSections } from './tvLauncher'

describe('Pantallas menu rows', () => {
  it('steps the sections one by one, between 1 and 6', () => {
    expect(stepSections(3, 1)).toBe(4)
    expect(stepSections(3, -1)).toBe(2)
    expect(stepSections(1, -1)).toBeNull()
    expect(stepSections(6, 1)).toBeNull()
  })

  it('says whether it is open, then where it goes', () => {
    const onTv = { note: 'En «LG TV»', disconnected: false }
    expect(screenStatusLine(false, onTv)).toBe('Sin abrir · En «LG TV»')
    expect(screenStatusLine(true, onTv)).toBe('Abierta · En «LG TV»')
    expect(screenStatusLine(false, { note: null, disconnected: false })).toBe('Sin abrir')
  })

  it('does not repeat its own title when its screen is missing', () => {
    expect(screenStatusLine(false, { note: 'Pantalla 2 desconectada', disconnected: true })).toBe('Sin abrir · Desconectada')
  })

  it('opens a closed one, and puts an open one back in its place', () => {
    expect(screenRowAction(false, true)).toBe('Abrir')
    expect(screenRowAction(true, true)).toBe('Colocar')
    expect(screenRowAction(true, false)).toBe('Ver')
  })
})
