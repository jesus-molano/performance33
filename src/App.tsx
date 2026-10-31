import { DashboardRoot } from './app/DashboardRoot'
import { ScreenRoutes } from './app/ScreenRoutes'
import { ConfirmHost, Toaster } from './components/ui'
import { useHashRoute } from './hooks/useHashRoute'
import { isScreenRoute } from './lib/routes'

export function App() {
  const route = useHashRoute()
  return (
    <>
      {isScreenRoute(route) ? <ScreenRoutes route={route} /> : <DashboardRoot route={route} />}
      <Toaster />
      <ConfirmHost />
    </>
  )
}
