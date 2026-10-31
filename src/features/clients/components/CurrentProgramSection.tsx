import { ClipboardList, Plus } from 'lucide-react'
import { Button, Card, EmptyState } from '../../../components/ui'
import { DEFAULT_PROGRAM_WEEKS } from '../../../config/app'
import { plural } from '../../../lib/format'
import type { Client } from '../../../types'
import { useClientStatus } from '../hooks/useClientStatus'
import { useProgramActions } from '../hooks/useProgramActions'
import { CurrentProgramCard } from './CurrentProgramCard'

export interface CurrentProgramSectionProps {
  client: Client
  onNewProgram: () => void
}

/** The client's current routine, or a big 'Crear rutina' when there is none. */
export function CurrentProgramSection({ client, onNewProgram }: CurrentProgramSectionProps) {
  const { program, status } = useClientStatus(client.id)
  const actions = useProgramActions(client.id)

  if (program) return <CurrentProgramCard program={program} status={status} actions={actions} onNewProgram={onNewProgram} />
  return (
    <Card padding="none">
      <EmptyState
        icon={ClipboardList}
        title={`${client.firstName} no tiene rutina`}
        description={`Crea su rutina: ${plural(client.trainingDays, 'día', 'días')} de entrenamiento durante ${plural(DEFAULT_PROGRAM_WEEKS, 'semana', 'semanas')}. Podrás cambiarlo después.`}
        action={
          <Button size="lg" leftIcon={Plus} onClick={() => actions.create()}>
            Crear rutina
          </Button>
        }
      />
    </Card>
  )
}
