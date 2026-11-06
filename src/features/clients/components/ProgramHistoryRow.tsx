import { CopyPlus, Star, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button, DropdownMenu, type MenuItem } from '@/components/ui'
import { formatDateRange } from '@/lib/dates'
import { getProgramDisplayName, getProgramStatus } from '@/lib/program'
import type { Program } from '@/types'
import type { ProgramActionsApi } from '@/features/clients/hooks/useProgramActions'
import { formatProgramShape } from '@/features/clients/utils/programSummary'

export interface ProgramHistoryRowProps {
  program: Program
  actions: ProgramActionsApi
}

export function ProgramHistoryRow({ program, actions }: ProgramHistoryRowProps) {
  const status = useMemo(() => getProgramStatus(program), [program])
  const menu: MenuItem[] = [
    { label: 'Marcar como actual', icon: Star, onSelect: () => actions.makeCurrent(program) },
    { label: 'Duplicar como nueva rutina', icon: CopyPlus, onSelect: () => actions.duplicateAsNext(program) },
    'separator',
    { label: 'Eliminar rutina…', icon: Trash2, danger: true, onSelect: () => actions.remove(program) },
  ]

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-5">
      <div className="w-full min-w-0 sm:w-auto sm:flex-1">
        <p className="truncate text-md font-medium text-fg">{getProgramDisplayName(program)}</p>
        <p className="text-sm text-fg-muted sm:truncate">
          {formatDateRange(program.startDate, program.endDate)} · {formatProgramShape(program)}
        </p>
      </div>
      <Badge tone={status.kind === 'expired' ? 'neutral' : status.tone} size="sm" className="mr-auto sm:mr-0">
        {status.label}
      </Badge>
      <Button variant="secondary" size="sm" onClick={() => actions.open(program)} className="h-11 px-4">
        Ver
      </Button>
      <DropdownMenu items={menu} label={`Más acciones de ${getProgramDisplayName(program)}`} />
    </li>
  )
}
