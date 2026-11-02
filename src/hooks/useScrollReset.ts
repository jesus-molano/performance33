import { useEffect, useLayoutEffect, useRef } from 'react'
import { markHistoryEntry } from '@/lib/scrollPosition'

/** Each new page of the dashboard opens at its top, not at the scroll of the page before. */
export function useScrollReset(pageKey: unknown): void {
  const first = useRef(true)
  useEffect(() => {
    markHistoryEntry()
  }, [])
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (markHistoryEntry()) window.scrollTo(0, 0)
  }, [pageKey])
}
