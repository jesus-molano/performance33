import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import type { SectionContent } from '@/features/screens/types'
import { gridFor } from '@/features/screens/utils/sections'

export interface ScreenLayoutPreviewProps {
  /** One per section, in order. */
  contents: readonly SectionContent[]
  label: string
  className?: string
}

/** A small TV (16:9) split like the real one: numbered sections, the ones with someone filled in. */
export function ScreenLayoutPreview({ contents, label, className }: ScreenLayoutPreviewProps) {
  const { columns, rows } = gridFor(contents.length)
  const grid: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }
  return (
    <div role="img" aria-label={label} className={cn('aspect-video w-full rounded-xl bg-ink p-1.5 shadow-card', className)}>
      <div className="grid h-full gap-1 rounded-lg bg-tv-gutter p-1" style={grid}>
        {contents.map((content, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center rounded-md text-sm font-semibold tabular-nums transition-colors',
              content.clientId ? 'bg-brand-soft text-brand-strong' : 'bg-white text-fg-muted',
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
