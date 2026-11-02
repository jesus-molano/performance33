import { SplashScreen } from '@/components/SplashScreen'
import { DisplayPage, ScreenSignInRequired, TvPage } from '@/features/display'
import type { Route } from '@/lib/routes'
import { useSessionStatus } from '@/store'

type ScreenRoute = Extract<Route, { name: 'display' | 'tv' }>

/**
 * TV windows: no dashboard chrome and only sanitised data (they read useDisplayData(), which follows the server by
 * itself). They share the login of this browser; signed out, or until the first password is set, they show no client
 * data. Without connection they keep the last copy.
 */
export function ScreenRoutes({ route }: { route: ScreenRoute }) {
  const status = useSessionStatus()
  if (status === 'loading') return <SplashScreen />
  if (status !== 'ready' && status !== 'offline') return <ScreenSignInRequired />
  if (route.name === 'tv') return <TvPage slots={route.slots} />
  return <DisplayPage clientId={route.clientId} day={route.day} programId={route.programId} />
}
