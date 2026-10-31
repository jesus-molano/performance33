import { PagePlaceholder } from '../../../components/PagePlaceholder'
import type { TvSlot } from '../../../lib/routes'

export interface TvPageProps {
  /** Always TV_SLOT_COUNT (3) slots, parsed from #/tv?slots=. */
  slots: TvSlot[]
}

/** 'Modo TV (3 columnas)' window. Persist slot changes with replaceRoute(paths.tv(slots)). */
export function TvPage(_props: TvPageProps) {
  return <PagePlaceholder title="Modo TV" />
}
