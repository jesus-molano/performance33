import { Monitor } from 'lucide-react'
import { cn } from '@/lib/cn'
import { STATUS_COPY } from '@/features/screens/config/copy'
import type { ScreensSummary, ScreensSummaryTone } from '@/features/screens/utils/picker'

export interface ScreensStatusChipProps {
  summary: ScreensSummary
  expanded: boolean
  onClick: () => void
}

const TONES: Record<ScreensSummaryTone, { chip: string; dot: string }> = {
  all: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  some: { chip: 'border-amber-300 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  none: { chip: 'border-line-strong bg-surface text-fg-muted', dot: 'bg-fg-subtle' },
}

function ChipText({ summary }: { summary: ScreensSummary }) {
  if (summary.tone === 'all') return STATUS_COPY.allOpen(summary.open, summary.total)
  if (summary.tone === 'some') return STATUS_COPY.someClosed(summary.closed.length)
  return (
    <>
      {STATUS_COPY.noneOpen} <span aria-hidden>→</span> <span className="font-semibold text-brand-strong">{STATUS_COPY.open}</span>
    </>
  )
}

/** 'Pantallas 2/2' (green), '1 sin conexión' (amber) or 'Ninguna abierta → Abrir' (grey) in the top bar. */
export function ScreensStatusChip({ summary, expanded, onClick }: ScreensStatusChipProps) {
  const tone = TONES[summary.tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="menu"
      title={STATUS_COPY.label(summary.closed)}
      className={cn('inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors hover:brightness-95', tone.chip)}
    >
      <Monitor size={16} aria-hidden />
      <span className={cn('size-2 rounded-full', tone.dot)} aria-hidden />
      <span>
        <ChipText summary={summary} />
      </span>
      <span className="sr-only">. {STATUS_COPY.label(summary.closed)}</span>
    </button>
  )
}
