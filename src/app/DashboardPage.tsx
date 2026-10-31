import { ClientDetailPage, ClientsPage } from '../features/clients'
import { ProgramEditorPage } from '../features/editor'
import { SettingsPage } from '../features/settings'
import { NotFoundPage } from '../features/shell'
import type { Route } from '../lib/routes'

/** Page for a dashboard route (inside AppLayout). */
export function DashboardPage({ route }: { route: Route }) {
  switch (route.name) {
    case 'clients':
      return <ClientsPage />
    case 'client':
      return <ClientDetailPage clientId={route.clientId} />
    case 'program':
      return <ProgramEditorPage clientId={route.clientId} programId={route.programId} />
    case 'settings':
      return <SettingsPage tab={route.tab} />
    default:
      return <NotFoundPage />
  }
}
