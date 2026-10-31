import type { ComponentType } from 'react'
import type { SettingsTab } from '@/lib/routes'
import { CoachManager } from '@/features/coaches'
import { PageContainer, PageHeader } from '@/features/shell'
import { BrandingPanel } from '@/features/settings/components/BrandingPanel'
import { DataPanel } from '@/features/settings/components/DataPanel'
import { LibraryPanel } from '@/features/settings/components/LibraryPanel'
import { SettingsTabs } from '@/features/settings/components/SettingsTabs'
import { SETTINGS_TAB_META } from '@/features/settings/config'

export interface SettingsPageProps {
  tab: SettingsTab
}

const PANELS: Record<SettingsTab, ComponentType> = {
  marca: BrandingPanel,
  biblioteca: LibraryPanel,
  monitores: CoachManager,
  datos: DataPanel,
}

export function SettingsPage({ tab }: SettingsPageProps) {
  const Panel = PANELS[tab]
  return (
    <PageContainer>
      <PageHeader title="Ajustes" description={SETTINGS_TAB_META[tab].description} />
      <SettingsTabs active={tab} />
      <div key={tab} className="animate-fade-in">
        <Panel />
      </div>
    </PageContainer>
  )
}
