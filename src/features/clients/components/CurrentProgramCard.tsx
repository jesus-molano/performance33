import { CopyPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, DropdownMenu, type MenuItem } from '@/components/ui'
import { formatDateRange } from '@/lib/dates'
import { getProgramDisplayName, type ProgramStatus } from '@/lib/program'
import type { Program } from '@/types'
import type { ProgramActionsApi } from '@/features/clients/hooks/useProgramActions'
import { formatProgramShape } from '@/features/clients/utils/programSummary'
import { ExpiryCallout } from './ExpiryCallout'
import { ProgramDayList } from './ProgramDayList'
import { ProgramProgressBar } from './ProgramProgressBar'

export interface CurrentProgramCardProps {
  program: Program
  status: ProgramStatus
  actions: ProgramActionsApi
  onNewProgram: () => void
}

export function CurrentProgramCard({ program, status, actions, onNewProgram }: CurrentProgramCardProps) {
  const menu: MenuItem[] = [
    { label: 'Duplicar como nueva rutina', icon: CopyPlus, onSelect: () => actions.duplicateAsNext(program) },
    { label: 'Nueva rutina…', icon: Plus, onSelect: onNewProgram },
    'separator',
    { label: 'Eliminar rutina…', icon: Trash2, danger: true, onSelect: () => actions.remove(program) },
  ]

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-brand-strong uppercase">Rutina actual</p>
          <h2 className="mt-1 truncate text-xl font-semibold text-fg">{getProgramDisplayName(program)}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">
            {formatDateRange(program.startDate, program.endDate)} · {formatProgramShape(program)}
          </p>
        </div>
        <Badge tone={status.tone} className="mt-1">
          {status.label}
        </Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        <ProgramProgressBar status={status} />
        <p className="text-sm text-fg-subtle">{status.detail}</p>
      </div>
      <ExpiryCallout status={status} onDuplicate={() => actions.duplicateAsNext(program)} />
      <ProgramDayList program={program} />
      <div className="flex items-center gap-2">
        <Button size="lg" leftIcon={Pencil} onClick={() => actions.open(program)} className="flex-1">
          Editar rutina
        </Button>
        <DropdownMenu items={menu} label="Más acciones de la rutina" />
      </div>
    </Card>
  )
}
