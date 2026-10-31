import { MonitorPlay } from 'lucide-react'
import { paths, type Route } from '@/lib/routes'
import { useBranding } from '@/store'
import { NAV_LINKS, TV_LAUNCHER } from '@/features/shell/config'
import { useTvLauncher } from '@/features/shell/hooks/useTvLauncher'
import { isNavActive } from '@/features/shell/utils/nav'
import { BrandLogo } from './BrandLogo'
import { SidebarAction, SidebarLink } from './SidebarLink'

/** Desktop navigation: black column with the gym logo (hidden below 768 px). */
export function Sidebar({ route }: { route: Route }) {
  const { tagline } = useBranding()
  const openTv = useTvLauncher()

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink text-white md:flex lg:w-64">
      <a href={paths.clients()} aria-label="Ir a clientes" className="flex h-24 items-center px-6">
        <BrandLogo className="h-16" />
      </a>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => (
          <SidebarLink key={link.id} href={link.href} icon={link.icon} label={link.label} active={isNavActive(link, route)} />
        ))}
        <div className="my-3 h-px bg-ink-line" aria-hidden />
        <SidebarAction icon={MonitorPlay} label={TV_LAUNCHER.label} hint={TV_LAUNCHER.hint} onClick={openTv} />
        <p className="px-3 text-xs leading-relaxed text-ink-muted">{TV_LAUNCHER.hint}</p>
      </nav>
      {tagline && <p className="px-6 pb-6 text-xs leading-relaxed text-ink-muted">{tagline}</p>}
    </aside>
  )
}
