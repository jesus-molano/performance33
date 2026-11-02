import { useMemo, useState } from 'react'
import { slicePage, type PageSlice } from '@/lib/pagination'

export interface PaginationApi<T> extends PageSlice<T> {
  setPage: (page: number) => void
}

/** Current page over a list. If the list shrinks, it falls back to the last page that still exists. */
export function usePagination<T>(items: readonly T[], pageSize: number): PaginationApi<T> {
  const [page, setPage] = useState(1)
  const slice = useMemo(() => slicePage(items, page, pageSize), [items, page, pageSize])
  return { ...slice, setPage }
}
