import { cn } from '@/lib/cn'
import { paths, type Route } from '@/lib/routes'
import { useBranding } from '@/store'
import { NAV_LINKS } from '@/features/shell/config'
import { isNavActive } from '@/features/shell/utils/nav'
import { BrandLogo } from './BrandLogo'
import { SidebarLink } from './SidebarLink'
import { TvScreensMenu } from './TvScreensMenu'

/** Black column with the gym logo: only icons on portrait tablets, so the page keeps its width (hidden below 768 px). */
export function Sidebar({ route }: { route: Route }) {
  const { tagline, iconUrl } = useBranding()

  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-18 shrink-0 flex-col bg-ink text-white md:flex lg:w-64">
      <a href={paths.clients()} aria-label="Ir a usuarios" className="flex h-24 items-center overflow-hidden px-3 lg:px-6">
        {iconUrl && <img src={iconUrl} alt="" className="size-11 rounded-xl object-cover lg:hidden" />}
        <BrandLogo className={cn('h-16', iconUrl && 'hidden lg:block')} />
      </a>
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_LINKS.map((link) => (
          <SidebarLink key={link.id} href={link.href} icon={link.icon} label={link.label} active={isNavActive(link, route)} />
        ))}
        <div className="my-3 h-px bg-ink-line" aria-hidden />
        <TvScreensMenu />
      </nav>
      {tagline && <p className="hidden px-6 pb-6 text-xs leading-relaxed text-ink-muted lg:block">{tagline}</p>}
    </aside>
  )
}
