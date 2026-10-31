import type { ComponentType } from 'react'
import type { SettingsTab } from '../../../lib/routes'
import { CoachManager } from '../../coaches'
import { PageContainer, PageHeader } from '../../shell'
import { BrandingPanel } from '../components/BrandingPanel'
import { DataPanel } from '../components/DataPanel'
import { LibraryPanel } from '../components/LibraryPanel'
import { SettingsTabs } from '../components/SettingsTabs'
import { SETTINGS_TAB_META } from '../config'

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
