import { CalendarPlus } from 'lucide-react'
import { Modal } from '../../../../components/ui'
import { formatDayTitle, plural } from '../../../../lib/format'
import type { Day } from '../../../../types'

export interface CopyToDayModalProps {
  open: boolean
  onClose: () => void
  /** Days other than the block's own day. */
  days: Day[]
  onPick: (day: Day) => void
}

export function CopyToDayModal({ open, onClose, days, onPick }: CopyToDayModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Copiar bloque a…" description="Se añade una copia al día que elijas.">
      <ul className="flex flex-col gap-2 pb-2">
        {days.map((day) => (
          <li key={day.id}>
            <button
              type="button"
              onClick={() => {
                onPick(day)
                onClose()
              }}
              className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line px-4 text-left hover:border-brand-line hover:bg-brand-soft"
            >
              <CalendarPlus size={20} aria-hidden className="text-brand-strong" />
              <span className="flex-1 font-medium text-fg">{formatDayTitle(day)}</span>
              <span className="text-sm text-fg-muted">{plural(day.blocks.length, 'bloque', 'bloques')}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
