import { SplashScreen } from '@/components/SplashScreen'
import { DataLoadFailedPage } from '@/features/auth'
import { AppLayout } from '@/features/shell'
import { useBrandingStyles, useDashboardBootstrap, useUndoShortcuts } from '@/hooks'
import type { Route } from '@/lib/routes'
import { useBranding } from '@/store'
import { DashboardPage } from './DashboardPage'

/** Dashboard windows (signed in): loads data, starts autosave + live sync, applies branding, enables Ctrl+Z / Ctrl+Y. */
export function DashboardRoot({ route }: { route: Route }) {
  const boot = useDashboardBootstrap()
  useBrandingStyles(useBranding())
  useUndoShortcuts()

  if (boot.status === 'loading') return <SplashScreen />
  if (boot.status === 'error') return <DataLoadFailedPage onRetry={boot.retry} />
  return (
    <AppLayout route={route}>
      <DashboardPage route={route} />
    </AppLayout>
  )
}
