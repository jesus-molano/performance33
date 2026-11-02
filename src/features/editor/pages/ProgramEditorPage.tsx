import { FileQuestion } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { navigate, paths } from '@/lib/routes'
import { ProgramEditor } from '@/features/editor/components/ProgramEditor'
import { useEditorData } from '@/features/editor/hooks/useEditorData'

export interface ProgramEditorPageProps {
  clientId: string
  programId: string
}

export function ProgramEditorPage({ clientId, programId }: ProgramEditorPageProps) {
  const { client, program } = useEditorData(clientId, programId)

  if (!client || !program) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No encontramos esta rutina"
        description="Puede que se haya eliminado. Vuelve a la ficha del usuario para ver sus rutinas."
        action={
          <Button onClick={() => navigate(client ? paths.client(client.id) : paths.clients())}>
            {client ? `Volver a ${client.firstName}` : 'Ver usuarios'}
          </Button>
        }
        className="min-h-[60dvh]"
      />
    )
  }
  return <ProgramEditor key={program.id} client={client} program={program} />
}
