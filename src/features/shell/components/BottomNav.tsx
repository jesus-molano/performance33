import { MonitorPlay, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Route } from '@/lib/routes'
import { NAV_LINKS, TV_LAUNCHER } from '@/features/shell/config'
import { usePhoneTvButton } from '@/features/shell/hooks/useTvLauncher'
import { isNavActive } from '@/features/shell/utils/nav'

const ITEM_CLASSES = 'flex h-bottom-nav flex-1 flex-col items-center justify-center gap-1 text-xs font-medium'

function ItemBody({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <>
      <span className={cn('flex h-7 w-12 items-center justify-center rounded-full', active && 'bg-white/10')}>
        <Icon size={21} aria-hidden className={active ? 'text-brand' : undefined} />
      </span>
      {label}
    </>
  )
}

/** Mobile navigation bar (below 768 px). */
export function BottomNav({ route }: { route: Route }) {
  const openTv = usePhoneTvButton()
  const [clientsLink, settingsLink] = NAV_LINKS

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 flex bg-ink pb-[env(safe-area-inset-bottom)] text-ink-muted md:hidden"
    >
      {[clientsLink, null, settingsLink].map((link) =>
        link ? (
          <a
            key={link.id}
            href={link.href}
            aria-current={isNavActive(link, route) ? 'page' : undefined}
            className={cn(ITEM_CLASSES, isNavActive(link, route) && 'text-white')}
          >
            <ItemBody icon={link.icon} label={link.label} active={isNavActive(link, route)} />
          </a>
        ) : (
          <button key="tv" type="button" onClick={openTv} className={ITEM_CLASSES}>
            <ItemBody icon={MonitorPlay} label={TV_LAUNCHER.label} active={false} />
          </button>
        ),
      )}
    </nav>
  )
}
