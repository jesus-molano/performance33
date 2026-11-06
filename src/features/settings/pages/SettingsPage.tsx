import type { ComponentType } from 'react'
import type { SettingsTab } from '@/lib/routes'
import { ScreensPanel } from '@/features/screens'
import { TeamPanel } from '@/features/team'
import { PageContainer, PageHeader } from '@/features/shell'
import { BrandingPanel } from '@/features/settings/components/BrandingPanel'
import { DataPanel } from '@/features/settings/components/DataPanel'
import { LibraryPanel } from '@/features/settings/components/LibraryPanel'
import { SettingsTabs } from '@/features/settings/components/SettingsTabs'
import { SETTINGS_TAB_META } from '@/features/settings/config'
import { useSettingsTabs } from '@/features/settings/hooks/useSettingsTabs'

export interface SettingsPageProps {
  tab: SettingsTab
}

const PANELS: Record<SettingsTab, ComponentType> = {
  marca: BrandingPanel,
  biblioteca: LibraryPanel,
  pantallas: ScreensPanel,
  equipo: TeamPanel,
  datos: DataPanel,
}

export function SettingsPage({ tab }: SettingsPageProps) {
  const { tabs, active } = useSettingsTabs(tab)
  const Panel = PANELS[active]
  return (
    <PageContainer>
      <PageHeader title="Ajustes" description={SETTINGS_TAB_META[active].description} />
      <SettingsTabs tabs={tabs} active={active} />
      <div key={active} className="animate-fade-in">
        <Panel />
      </div>
    </PageContainer>
  )
}
