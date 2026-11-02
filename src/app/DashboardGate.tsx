import { SplashScreen } from '@/components/SplashScreen'
import { CreatePasswordPage, LoginPage, NoAccessPage, SessionOfflinePage } from '@/features/auth'
import type { Route } from '@/lib/routes'
import { useSessionStatus } from '@/store'
import { DashboardRoot } from './DashboardRoot'

/** Nothing of the dashboard (not even its data) exists until the session is ready. */
export function DashboardGate({ route }: { route: Route }) {
  switch (useSessionStatus()) {
    case 'ready':
      return <DashboardRoot route={route} />
    case 'signed-out':
      return <LoginPage />
    case 'must-change-password':
      return <CreatePasswordPage />
    case 'no-access':
      return <NoAccessPage />
    case 'offline':
      return <SessionOfflinePage />
    case 'loading':
      return <SplashScreen />
  }
}
