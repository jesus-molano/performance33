// Pure pagination logic (pages are 1-based).

export interface PageSlice<T> {
  items: T[]
  /** Current page, always within 1..pageCount. */
  page: number
  /** At least 1, so an empty list is still 'page 1 of 1'. */
  pageCount: number
  total: number
  /** Position of the first and last visible row (both 0 when empty). */
  from: number
  to: number
}

export const PAGE_GAP = 'gap'
export type PageNumber = number | typeof PAGE_GAP

export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function clampPage(page: number, pageCount: number): number {
  return Math.min(Math.max(1, Math.trunc(page) || 1), pageCount)
}

export function slicePage<T>(items: readonly T[], page: number, pageSize: number): PageSlice<T> {
  const total = items.length
  const pageCount = getPageCount(total, pageSize)
  const current = clampPage(page, pageCount)
  const start = (current - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return {
    items: pageItems,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + pageItems.length,
  }
}

/** First, last and the pages around the current one: [1, 'gap', 5, 6, 7, 'gap', 12]. A gap never hides a single page. */
export function getPageNumbers(page: number, pageCount: number, siblings = 1): PageNumber[] {
  const out: PageNumber[] = []
  let previous = 0
  for (let n = 1; n <= pageCount; n++) {
    if (n !== 1 && n !== pageCount && Math.abs(n - page) > siblings) continue
    if (n - previous === 2) out.push(n - 1)
    else if (n - previous > 2) out.push(PAGE_GAP)
    out.push(n)
    previous = n
  }
  return out
}

/** '1–20 de 223', or '0 de 0' when empty. */
export function formatPageRange({ from, to, total }: Pick<PageSlice<unknown>, 'from' | 'to' | 'total'>): string {
  return total === 0 ? '0 de 0' : `${from}–${to} de ${total}`
}
