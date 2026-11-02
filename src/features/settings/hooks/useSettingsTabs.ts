import { SETTINGS_TABS, type SettingsTab } from '@/lib/routes'
import { useIsAdmin } from '@/store'
import { MONITOR_SETTINGS_TABS } from '@/features/settings/config'

export interface SettingsTabsApi {
  tabs: readonly SettingsTab[]
  /** The requested tab if this person can see it, else their first tab. */
  active: SettingsTab
}

/** Marca, Equipo and Datos are for administrators (hidden here, enforced by the database). */
export function useSettingsTabs(requested: SettingsTab): SettingsTabsApi {
  const tabs = useIsAdmin() ? SETTINGS_TABS : MONITOR_SETTINGS_TABS
  return { tabs, active: tabs.includes(requested) ? requested : tabs[0] }
}
