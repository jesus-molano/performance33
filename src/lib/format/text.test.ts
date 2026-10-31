import { describe, expect, it } from 'vitest'
import { foldLines, joinParts } from './text'

describe('joinParts', () => {
  it('skips empty and missing parts', () => {
    expect(joinParts(['tempo 3-1-1-0', '', null, ' Pecho alto ', undefined])).toBe('tempo 3-1-1-0 · Pecho alto')
  })

  it('returns an empty string when nothing is left', () => {
    expect(joinParts(['', '  ', null])).toBe('')
  })

  it('accepts a custom separator', () => {
    expect(joinParts(['a', 'b'], ' / ')).toBe('a / b')
  })
})

describe('foldLines', () => {
  it('folds lines and drops blank ones', () => {
    expect(foldLines('5′ remo suave\n\n10 gato-camello \n')).toBe('5′ remo suave · 10 gato-camello')
  })

  it('keeps single-line text as is', () => {
    expect(foldLines('Movilidad libre')).toBe('Movilidad libre')
  })
})
