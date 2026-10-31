import { CoachPickerPage } from '../features/coaches'
import { AppLayout } from '../features/shell'
import { useBrandingStyles } from '../hooks/useBrandingStyles'
import { useDashboardBootstrap } from '../hooks/useDashboardBootstrap'
import { useUndoShortcuts } from '../hooks/useUndoShortcuts'
import type { Route } from '../lib/routes'
import { useBranding, useCurrentCoach } from '../store'
import { DashboardPage } from './DashboardPage'

/**
 * Dashboard windows: loads data, starts autosave + live sync, applies branding, enables
 * Ctrl+Z / Ctrl+Y. Without a valid current coach every route shows '¿Quién eres?'.
 */
export function DashboardRoot({ route }: { route: Route }) {
  useDashboardBootstrap()
  useBrandingStyles(useBranding())
  useUndoShortcuts()
  const coach = useCurrentCoach()

  if (!coach || route.name === 'pick-coach') return <CoachPickerPage />
  return (
    <AppLayout route={route}>
      <DashboardPage route={route} />
    </AppLayout>
  )
}
