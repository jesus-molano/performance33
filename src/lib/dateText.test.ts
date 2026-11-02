import { describe, expect, it } from 'vitest'
import { isDateWithinLimits, maskDateText, parseDateText, readDateText } from './dateText'

describe('maskDateText', () => {
  it('adds the slashes while typing digits', () => {
    expect(maskDateText('2')).toBe('2')
    expect(maskDateText('23')).toBe('23')
    expect(maskDateText('231')).toBe('23/1')
    expect(maskDateText('23102026')).toBe('23/10/2026')
  })

  it('leaves a typed slash alone so backspace can remove it', () => {
    expect(maskDateText('23/')).toBe('23/')
    expect(maskDateText('23')).toBe('23')
  })

  it('pads a one-digit day or month when a separator comes after it', () => {
    expect(maskDateText('2/')).toBe('02/')
    expect(maskDateText('02/3/')).toBe('02/03/')
    expect(maskDateText('02-03-')).toBe('02/03/')
  })

  it('does not complete a date while it is being corrected', () => {
    expect(maskDateText('03/1/2026')).toBe('03/1/2026')
    expect(maskDateText('3/11/2026')).toBe('3/11/2026')
    expect(maskDateText('1/11/2026')).toBe('1/11/2026')
    expect(maskDateText('13/11/2026')).toBe('13/11/2026')
  })

  it('ignores letters, extra digits and a separator with nothing before it', () => {
    expect(maskDateText('ab/12x')).toBe('12')
    expect(maskDateText('23/10/20269')).toBe('23/10/2026')
  })

  it('turns a pasted ISO date around', () => {
    expect(maskDateText('2026-10-23')).toBe('23/10/2026')
  })
})

describe('parseDateText', () => {
  it('reads day first, never month first', () => {
    expect(parseDateText('03/02/2026')).toBe('2026-02-03')
    expect(parseDateText('23/10/2026')).toBe('2026-10-23')
  })

  it('accepts short forms and other separators', () => {
    expect(parseDateText('3/2/26')).toBe('2026-02-03')
    expect(parseDateText(' 3.2.2026 ')).toBe('2026-02-03')
    expect(parseDateText('3-2-2026')).toBe('2026-02-03')
  })

  it('refuses days that do not exist and incomplete text', () => {
    expect(parseDateText('10/23/2026')).toBeNull()
    expect(parseDateText('31/02/2026')).toBeNull()
    expect(parseDateText('29/02/2027')).toBeNull()
    expect(parseDateText('23/10')).toBeNull()
    expect(parseDateText('23/10/202')).toBeNull()
    expect(parseDateText('')).toBeNull()
    expect(parseDateText('01/01/0026')).toBeNull()
  })

  it('accepts a leap day', () => {
    expect(parseDateText('29/02/2028')).toBe('2028-02-29')
  })
})

describe('readDateText', () => {
  it('returns the date when it is inside the limits', () => {
    expect(readDateText('23/10/2026', { min: '2026-10-23' })).toEqual({ date: '2026-10-23', error: null })
  })

  it('explains what is wrong, with dates in dd/mm/aaaa', () => {
    expect(readDateText('32/10/2026').error).toContain('dd/mm/aaaa')
    expect(readDateText('22/10/2026', { min: '2026-10-23' }).error).toContain('23/10/2026')
    expect(readDateText('24/10/2026', { max: '2026-10-23' }).error).toContain('23/10/2026')
  })
})

describe('isDateWithinLimits', () => {
  it('includes both limits', () => {
    const limits = { min: '2026-01-10', max: '2026-01-20' }
    expect(isDateWithinLimits('2026-01-10', limits)).toBe(true)
    expect(isDateWithinLimits('2026-01-20', limits)).toBe(true)
    expect(isDateWithinLimits('2026-01-09', limits)).toBe(false)
    expect(isDateWithinLimits('2026-01-21', limits)).toBe(false)
    expect(isDateWithinLimits('2026-01-21', {})).toBe(true)
  })
})
