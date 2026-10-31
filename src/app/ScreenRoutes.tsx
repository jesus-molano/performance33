import { DisplayPage, TvPage } from '../features/display'
import type { Route } from '../lib/routes'

type ScreenRoute = Extract<Route, { name: 'display' | 'tv' }>

/** TV windows: no dashboard chrome, no private data loaded (they read useDisplayData()). */
export function ScreenRoutes({ route }: { route: ScreenRoute }) {
  if (route.name === 'tv') return <TvPage slots={route.slots} />
  return <DisplayPage clientId={route.clientId} day={route.day} programId={route.programId} />
}
