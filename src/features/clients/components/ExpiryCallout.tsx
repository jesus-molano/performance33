import { CopyPlus, Hourglass } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ProgramStatus } from '@/lib/program'

const COPY: Partial<Record<ProgramStatus['kind'], { title: string; text: string; tone: string }>> = {
  expired: {
    title: 'Esta rutina ha finalizado',
    text: 'Crea la siguiente rutina a partir de esta y ajusta solo lo que cambie.',
    tone: 'border-red-200 bg-red-50 text-red-800',
  },
  expiring: {
    title: 'Queda poco para terminar la rutina',
    text: 'Puedes preparar ya la siguiente partiendo de esta rutina.',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
}

/** Nudge to start the next block when the current one is ending or over. */
export function ExpiryCallout({ status, onDuplicate }: { status: ProgramStatus; onDuplicate: () => void }) {
  const copy = COPY[status.kind]
  if (!copy) return null
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center', copy.tone)}>
      <Hourglass size={20} aria-hidden className="hidden shrink-0 sm:block" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{copy.title}</p>
        <p className="text-sm opacity-90">{copy.text}</p>
      </div>
      <Button variant="secondary" leftIcon={CopyPlus} onClick={onDuplicate}>
        Duplicar como nueva rutina
      </Button>
    </div>
  )
}
