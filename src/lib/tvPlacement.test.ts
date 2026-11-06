import { describe, expect, it } from 'vitest'
import { displaysOf, tv } from './screenDetails.fakes'
import { describeTvPlacement } from './tvPlacement'

const [lg] = displaysOf(tv(1920, 'LG TV'))

describe('describeTvPlacement', () => {
  it('names the TV it opens on', () => {
    expect(describeTvPlacement({ title: 'Pantalla 1', isOpen: false, display: lg, tvsDetected: true })).toEqual({
      note: 'En «LG TV»',
      disconnected: false,
      openLabel: 'Abrir Pantalla 1 en «LG TV»',
    })
  })

  it('says a screen is disconnected when the TVs are seen but not its own', () => {
    expect(describeTvPlacement({ title: 'Pantalla 2', isOpen: false, display: null, tvsDetected: true })).toEqual({
      note: 'Pantalla 2 desconectada',
      disconnected: true,
      openLabel: 'Abrir Pantalla 2',
    })
  })

  it('puts an open window back on its TV', () => {
    expect(describeTvPlacement({ title: 'Pantalla 1', isOpen: true, display: lg, tvsDetected: true }).openLabel).toBe(
      'Colocar Pantalla 1 en su tele («LG TV»)',
    )
  })

  it('says nothing about TVs it cannot see, and brings an open window to the front', () => {
    expect(describeTvPlacement({ title: 'Pantalla 1', isOpen: true, display: null, tvsDetected: false })).toEqual({
      note: null,
      disconnected: false,
      openLabel: 'Ir a Pantalla 1',
    })
  })
})
