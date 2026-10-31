import type { ReactNode } from 'react'
import type { Route } from '@/lib/routes'
import { AppHeader } from './AppHeader'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export interface AppLayoutProps {
  /** Current dashboard route (to highlight the active nav item). */
  route: Route
  children: ReactNode
}

/** Dashboard chrome: black sidebar with logo + nav (bottom nav on mobile) and header. */
export function AppLayout({ route, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar route={route} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 pb-[calc(var(--spacing-bottom-nav)+env(safe-area-inset-bottom)+1rem)] md:pb-12">{children}</main>
      </div>
      <BottomNav route={route} />
    </div>
  )
}
