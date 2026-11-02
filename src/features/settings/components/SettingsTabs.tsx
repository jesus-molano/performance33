import { cn } from '@/lib/cn'
import { paths, type SettingsTab } from '@/lib/routes'
import { SETTINGS_TAB_META } from '@/features/settings/config'

/** Settings sections as tabs (links, so each tab has its own URL). Phones share the row: icon over a short label, nothing hidden off screen. */
export function SettingsTabs({ tabs, active }: { tabs: readonly SettingsTab[]; active: SettingsTab }) {
  return (
    <nav aria-label="Secciones de ajustes" className="mb-6">
      <div className="flex w-full gap-1 rounded-2xl bg-fg/5 p-1 sm:inline-flex sm:w-auto">
        {tabs.map((tab) => {
          const { label, icon: Icon } = SETTINGS_TAB_META[tab]
          const selected = tab === active
          return (
            <a
              key={tab}
              href={paths.settings(tab)}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'inline-flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-xs font-medium whitespace-nowrap transition-colors sm:h-11 sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:text-md',
                selected ? 'bg-surface text-fg shadow-card' : 'text-fg-muted hover:text-fg',
              )}
            >
              <Icon size={17} aria-hidden className={selected ? 'text-brand-strong' : undefined} />
              {label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
