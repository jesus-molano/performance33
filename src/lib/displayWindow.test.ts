import { describe, expect, it } from 'vitest'
import { isScreenPopup, popupFeatures, tvWindowName } from './displayWindow'

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

describe('popupFeatures', () => {
  const size = { width: 1600, height: 900 }
  const laptop = { left: 0, top: 0, width: 1920, height: 1080 }

  it('centres the window on the area it gets', () => {
    expect(popupFeatures(size, laptop)).toBe('popup=yes,width=1600,height=900,left=160,top=90')
  })

  it('puts the window on a TV to the right of the laptop, filling it', () => {
    const tvArea = { left: 1920, top: 0, width: 1920, height: 1080 }
    expect(popupFeatures({ width: 1920, height: 1080 }, tvArea)).toBe('popup=yes,width=1920,height=1080,left=1920,top=0')
  })

  it('also reaches a TV placed left of or above the laptop', () => {
    expect(popupFeatures({ width: 1920, height: 1080 }, { left: -1920, top: -200, width: 1920, height: 1080 })).toBe(
      'popup=yes,width=1920,height=1080,left=-1920,top=-200',
    )
  })

  it('moves each window by its cascade and never past the top left of its screen', () => {
    expect(popupFeatures(size, laptop, 40)).toBe('popup=yes,width=1600,height=900,left=200,top=130')
    expect(popupFeatures({ width: 2000, height: 1200 }, laptop)).toBe('popup=yes,width=2000,height=1200,left=0,top=0')
  })
})
