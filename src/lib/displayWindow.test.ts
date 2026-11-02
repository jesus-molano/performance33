import { describe, expect, it } from 'vitest'
import { isScreenPopup, tvWindowName } from './displayWindow'

describe('TV window names', () => {
  it('gives each named screen its own window', () => {
    expect(tvWindowName(1)).not.toBe(tvWindowName(2))
  })

  it('recognises a screen popup by its name, not by its width', () => {
    expect(isScreenPopup(tvWindowName(2))).toBe(true)
    expect(isScreenPopup('p33-pantalla-abc')).toBe(true)
    expect(isScreenPopup('')).toBe(false)
    expect(isScreenPopup('otra-ventana')).toBe(false)
  })
})
