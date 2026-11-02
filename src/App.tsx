import { lazy, Suspense } from 'react'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { SplashScreen } from './components/SplashScreen'
import { ConfirmHost, Toaster } from './components/ui'
import { useHashRoute } from './hooks/useHashRoute'
import { useSessionBootstrap } from './hooks/useSessionBootstrap'
import { isScreenRoute } from './lib/routes'
import { resetStoredDataAndReload } from './persistence/backup'

// Separate chunks: TV windows never download the dashboard (editor, settings…) and vice versa.
const DashboardGate = lazy(() => import('./app/DashboardGate').then((m) => ({ default: m.DashboardGate })))
const ScreenRoutes = lazy(() => import('./app/ScreenRoutes').then((m) => ({ default: m.ScreenRoutes })))

export function App() {
  useSessionBootstrap()
  const route = useHashRoute()
  return (
    <AppErrorBoundary onReset={() => void resetStoredDataAndReload()}>
      <Suspense fallback={<SplashScreen />}>
        {isScreenRoute(route) ? <ScreenRoutes route={route} /> : <DashboardGate route={route} />}
      </Suspense>
      <Toaster />
      <ConfirmHost />
    </AppErrorBoundary>
  )
}
