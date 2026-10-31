import { UserX } from 'lucide-react'
import { Button, EmptyState } from '../../../components/ui'
import { useDisclosure } from '../../../hooks/useDisclosure'
import { navigate, paths } from '../../../lib/routes'
import { useClient, useCurrentProgram } from '../../../store'
import { BackLink, PageContainer } from '../../shell'
import { ClientFormModal } from '../components/ClientFormModal'
import { ClientProfileHeader } from '../components/ClientProfileHeader'
import { CurrentProgramSection } from '../components/CurrentProgramSection'
import { NewProgramModal } from '../components/NewProgramModal'
import { NotesPanel } from '../components/NotesPanel'
import { PinnedAlerts } from '../components/PinnedAlerts'
import { ProgramHistory } from '../components/ProgramHistory'

export interface ClientDetailPageProps {
  clientId: string
}

function MissingClient() {
  return (
    <PageContainer>
      <EmptyState
        icon={UserX}
        title="Este cliente ya no existe"
        description="Puede que se haya eliminado desde otro dispositivo."
        action={<Button onClick={() => navigate(paths.clients())}>Volver a clientes</Button>}
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
      <BackLink href={paths.clients()}>Clientes</BackLink>
      <ClientProfileHeader client={client} onEdit={editClient.open} />
      <PinnedAlerts clientId={client.id} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <CurrentProgramSection client={client} onNewProgram={newProgram.open} />
          <ProgramHistory client={client} onNewProgram={newProgram.open} />
        </div>
        <NotesPanel clientId={client.id} />
      </div>
      {editClient.isOpen && <ClientFormModal client={client} onClose={editClient.close} />}
      {newProgram.isOpen && <NewProgramModal client={client} current={current} onClose={newProgram.close} />}
    </PageContainer>
  )
}
