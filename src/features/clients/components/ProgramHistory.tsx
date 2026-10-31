import { History, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Button, Card } from '@/components/ui'
import { useClientPrograms } from '@/store'
import type { Client } from '@/types'
import { useProgramActions } from '@/features/clients/hooks/useProgramActions'
import { ProgramHistoryRow } from './ProgramHistoryRow'

export interface ProgramHistoryProps {
  client: Client
  onNewProgram: () => void
}

/** Previous (and upcoming) routines other than the current one, newest first. */
export function ProgramHistory({ client, onNewProgram }: ProgramHistoryProps) {
  const programs = useClientPrograms(client.id)
  const actions = useProgramActions(client.id)
  const others = useMemo(() => programs.filter((p) => p.id !== client.currentProgramId), [programs, client.currentProgramId])

  return (
    <Card padding="none">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <History size={19} aria-hidden className="text-fg-subtle" />
        <h2 className="flex-1 text-base font-semibold text-fg">Historial de rutinas</h2>
        <Button variant="ghost" leftIcon={Plus} onClick={onNewProgram}>
          Nueva rutina
        </Button>
      </div>
      {others.length > 0 ? (
        <ul className="divide-y divide-line">
          {others.map((program) => (
            <ProgramHistoryRow key={program.id} program={program} actions={actions} />
          ))}
        </ul>
      ) : (
        <p className="px-4 py-5 text-md text-fg-muted sm:px-5">
          Aquí aparecerán las rutinas anteriores. Cuando termine esta, usa «Duplicar como nueva rutina» para empezar el siguiente.
        </p>
      )}
    </Card>
  )
}
