import { describe, expect, it } from 'vitest'
import { clampPage, formatPageRange, getPageCount, getPageNumbers, PAGE_GAP, slicePage } from './pagination'

const numbers = (count: number) => Array.from({ length: count }, (_, i) => i + 1)

describe('getPageCount', () => {
  it('rounds up and never goes below one page', () => {
    expect(getPageCount(0, 20)).toBe(1)
    expect(getPageCount(20, 20)).toBe(1)
    expect(getPageCount(21, 20)).toBe(2)
    expect(getPageCount(223, 20)).toBe(12)
  })
})

describe('clampPage', () => {
  it('keeps the page within range', () => {
    expect(clampPage(0, 5)).toBe(1)
    expect(clampPage(-3, 5)).toBe(1)
    expect(clampPage(9, 5)).toBe(5)
    expect(clampPage(3, 5)).toBe(3)
    expect(clampPage(Number.NaN, 5)).toBe(1)
  })
})

describe('slicePage', () => {
  it('returns the rows of the page and their position', () => {
    const slice = slicePage(numbers(45), 2, 20)
    expect(slice.items[0]).toBe(21)
    expect(slice.items).toHaveLength(20)
    expect(slice).toMatchObject({ page: 2, pageCount: 3, total: 45, from: 21, to: 40 })
  })

  it('gives a shorter last page', () => {
    expect(slicePage(numbers(45), 3, 20)).toMatchObject({ from: 41, to: 45 })
  })

  it('falls back to the last page when rows disappear', () => {
    const slice = slicePage(numbers(20), 2, 20)
    expect(slice).toMatchObject({ page: 1, pageCount: 1, from: 1, to: 20 })
  })

  it('handles an empty list', () => {
    expect(slicePage([], 4, 20)).toEqual({ items: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0 })
  })
})

describe('getPageNumbers', () => {
  it('shows every page when there are few', () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
    expect(getPageNumbers(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('collapses the far pages', () => {
    expect(getPageNumbers(6, 12)).toEqual([1, PAGE_GAP, 5, 6, 7, PAGE_GAP, 12])
    expect(getPageNumbers(1, 12)).toEqual([1, 2, PAGE_GAP, 12])
    expect(getPageNumbers(12, 12)).toEqual([1, PAGE_GAP, 11, 12])
  })

  it('never uses a gap to hide a single page', () => {
    expect(getPageNumbers(4, 12)).toEqual([1, 2, 3, 4, 5, PAGE_GAP, 12])
    expect(getPageNumbers(9, 12)).toEqual([1, PAGE_GAP, 8, 9, 10, 11, 12])
  })
})

describe('formatPageRange', () => {
  it('reads like a count of rows', () => {
    expect(formatPageRange({ from: 1, to: 20, total: 223 })).toBe('1–20 de 223')
    expect(formatPageRange({ from: 0, to: 0, total: 0 })).toBe('0 de 0')
  })
})
