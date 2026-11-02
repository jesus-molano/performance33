import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getPageNumbers, PAGE_GAP } from '@/lib/pagination'
import { IconButton } from './IconButton'

export interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

/** Previous / next with page numbers; phones show 'Página 3 de 12' instead of the numbers. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null
  return (
    <nav aria-label="Páginas" className="flex items-center gap-1">
      <IconButton icon={ChevronLeft} size="sm" label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)} />
      <span className="px-2 text-sm text-fg-muted tabular sm:hidden">
        Página {page} de {pageCount}
      </span>
      <ol className="hidden items-center gap-1 sm:flex">
        {getPageNumbers(page, pageCount).map((n, index) =>
          n === PAGE_GAP ? (
            <li key={`gap-${index}`} aria-hidden className="w-6 text-center text-fg-subtle">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                aria-label={`Página ${n}`}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => onChange(n)}
                className={cn(
                  'inline-flex size-11 items-center justify-center rounded-lg text-sm font-medium tabular transition-colors md:size-9',
                  n === page ? 'bg-brand-soft font-semibold text-brand-strong' : 'text-fg-muted hover:bg-fg/5 hover:text-fg',
                )}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <IconButton icon={ChevronRight} size="sm" label="Página siguiente" disabled={page >= pageCount} onClick={() => onChange(page + 1)} />
    </nav>
  )
}
