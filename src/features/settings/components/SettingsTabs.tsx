import { cn } from '@/lib/cn'
import { paths, SETTINGS_TABS, type SettingsTab } from '@/lib/routes'
import { SETTINGS_TAB_META } from '@/features/settings/config'

/** Settings sections as tabs (links, so each tab has its own URL). Scrolls sideways on mobile. */
export function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <nav aria-label="Secciones de ajustes" className="-mx-4 mb-6 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
      <div className="inline-flex gap-1 rounded-2xl bg-fg/5 p-1">
        {SETTINGS_TABS.map((tab) => {
          const { label, icon: Icon } = SETTINGS_TAB_META[tab]
          const selected = tab === active
          return (
            <a
              key={tab}
              href={paths.settings(tab)}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl px-4 text-md font-medium whitespace-nowrap transition-colors',
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
