import { MonitorPlay, type LucideIcon } from 'lucide-react'
import { useDisclosure, usePhoneScreen } from '@/hooks'
import { cn } from '@/lib/cn'
import type { Route } from '@/lib/routes'
import { NAV_LINKS, TV_LAUNCHER } from '@/features/shell/config'
import { useCloseOnPhoneChange } from '@/features/shell/hooks/useCloseOnPhoneChange'
import { isNavActive } from '@/features/shell/utils/nav'
import { ScreensRemoteSheet } from './remote/ScreensRemoteSheet'

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

/** Mobile navigation bar (below 768 px). 'Pantallas' opens the remote control of what each gym screen shows. */
export function BottomNav({ route }: { route: Route }) {
  const remote = useDisclosure()
  const phone = usePhoneScreen()
  useCloseOnPhoneChange(phone, remote.close)
  const [clientsLink, classesLink, settingsLink] = NAV_LINKS

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 flex bg-ink pb-[env(safe-area-inset-bottom)] text-ink-muted md:hidden"
      >
        {[clientsLink, classesLink, null, settingsLink].map((link) =>
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
            <button key="tv" type="button" onClick={remote.open} aria-expanded={remote.isOpen} className={cn(ITEM_CLASSES, remote.isOpen && 'text-white')}>
              <ItemBody icon={MonitorPlay} label={TV_LAUNCHER.label} active={remote.isOpen} />
            </button>
          ),
        )}
      </nav>
      <ScreensRemoteSheet open={phone && remote.isOpen} onClose={remote.close} />
    </>
  )
}
