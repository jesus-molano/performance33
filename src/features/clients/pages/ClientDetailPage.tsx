import { UserX } from 'lucide-react'
import { Button, EmptyState } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import { navigate, paths } from '@/lib/routes'
import { useClient, useCurrentProgram } from '@/store'
import { ClientClassesCard } from '@/features/classes'
import { MemberAccessCard } from '@/features/members'
import { BackLink, PageContainer } from '@/features/shell'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
import { ClientProfileHeader } from '@/features/clients/components/ClientProfileHeader'
import { CurrentProgramSection } from '@/features/clients/components/CurrentProgramSection'
import { NewProgramModal } from '@/features/clients/components/NewProgramModal'
import { NotesPanel } from '@/features/clients/components/NotesPanel'
import { ImportantNotes } from '@/features/clients/components/ImportantNotes'
import { ProgramHistory } from '@/features/clients/components/ProgramHistory'

export interface ClientDetailPageProps {
  clientId: string
}

function MissingClient() {
  return (
    <PageContainer>
      <EmptyState
        icon={UserX}
        title="Este usuario ya no existe"
        description="Puede que se haya eliminado desde otro dispositivo."
        action={<Button onClick={() => navigate(paths.clients())}>Volver a usuarios</Button>}
      />
    </PageContainer>
  )
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const client = useClient(clientId)
  const current = useCurrentProgram(clientId)
  const editClient = useDisclosure()
  const newProgram = useDisclosure()

  if (!client) return <MissingClient />
  return (
    <PageContainer>
      <BackLink href={paths.clients()}>Usuarios</BackLink>
      <ClientProfileHeader client={client} onEdit={editClient.open} />
      <ImportantNotes clientId={client.id} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <CurrentProgramSection client={client} onNewProgram={newProgram.open} />
          <ProgramHistory client={client} onNewProgram={newProgram.open} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <ClientClassesCard clientId={client.id} />
          <MemberAccessCard client={client} />
          <NotesPanel clientId={client.id} />
        </div>
      </div>
      {editClient.isOpen && <ClientFormModal client={client} onClose={editClient.close} />}
      {newProgram.isOpen && <NewProgramModal client={client} current={current} onClose={newProgram.close} />}
    </PageContainer>
  )
}
