import { lazy, Suspense } from 'react'
import { ConfirmHost, Toaster } from './components/ui'
import { useHashRoute } from './hooks/useHashRoute'
import { isScreenRoute } from './lib/routes'

// Separate chunks: TV windows never download the dashboard (editor, settings…) and vice versa.
const DashboardRoot = lazy(() => import('./app/DashboardRoot').then((m) => ({ default: m.DashboardRoot })))
const ScreenRoutes = lazy(() => import('./app/ScreenRoutes').then((m) => ({ default: m.ScreenRoutes })))

export function App() {
  const route = useHashRoute()
  return (
    <>
      <Suspense fallback={null}>
        {isScreenRoute(route) ? <ScreenRoutes route={route} /> : <DashboardRoot route={route} />}
      </Suspense>
      <Toaster />
      <ConfirmHost />
    </>
  )
}
