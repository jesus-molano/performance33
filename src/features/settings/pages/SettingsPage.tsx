import { PagePlaceholder } from '../../../components/PagePlaceholder'
import type { SettingsTab } from '../../../lib/routes'

export interface SettingsPageProps {
  tab: SettingsTab
}

export function SettingsPage(_props: SettingsPageProps) {
  return <PagePlaceholder title="Ajustes" />
}
