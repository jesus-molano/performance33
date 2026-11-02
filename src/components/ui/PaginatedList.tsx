import { useRef, type ReactNode } from 'react'
import type { PaginationApi } from '@/hooks/usePagination'
import { cn } from '@/lib/cn'
import { formatPageRange } from '@/lib/pagination'
import { Pagination } from './Pagination'

export interface PaginatedListProps<T> {
  pagination: PaginationApi<T>
  /** Accessible name of the list. */
  label: string
  /** Content of one row. */
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string
  className?: string
  listClassName?: string
}

/** One page of rows + '1–20 de 223' + page controls. Changing page goes back to the top of the list. */
export function PaginatedList<T>({ pagination, label, renderItem, getKey, className, listClassName }: PaginatedListProps<T>) {
  const topRef = useRef<HTMLDivElement>(null)
  const goToPage = (page: number) => {
    pagination.setPage(page)
    topRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div ref={topRef} className={cn('scroll-mt-header', className)}>
      <ul aria-label={label} className={listClassName}>
        {pagination.items.map((item) => (
          <li key={getKey(item)}>{renderItem(item)}</li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 sm:px-5">
        <p className="text-sm text-fg-muted tabular">{formatPageRange(pagination)}</p>
        <Pagination page={pagination.page} pageCount={pagination.pageCount} onChange={goToPage} />
      </div>
    </div>
  )
}
