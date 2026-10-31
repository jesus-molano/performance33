import type { ReactNode } from 'react'
import type { Route } from '../../../lib/routes'

export interface AppLayoutProps {
  /** Current dashboard route (to highlight the active nav item). */
  route: Route
  children: ReactNode
}

/** Dashboard chrome: black sidebar with logo + nav (bottom nav on mobile) and header. */
export function AppLayout({ children }: AppLayoutProps) {
  return <main className="min-h-dvh">{children}</main>
}
