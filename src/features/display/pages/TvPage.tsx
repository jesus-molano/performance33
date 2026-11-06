import type { TvSlot } from '@/lib/routes'
import { MobileTvPage } from '@/features/display/components/mobile/MobileTvPage'
import { TvWindow } from '@/features/display/components/tv/TvWindow'
import { usePhoneScreen } from '@/hooks'

export interface TvPageProps {
  /** Number of the named screen (Pantalla N), from #/tv?pantalla=; old URLs are Pantalla 1. */
  screen: number
  /** The list of an old #/tv?slots= link (fills the screen once, if it is empty), else null. */
  legacySlots: TvSlot[] | null
}

/** 'Modo TV': a named TV window or, on a phone, a list of people to open. */
export function TvPage({ screen, legacySlots }: TvPageProps) {
  const phone = usePhoneScreen()
  return phone ? <MobileTvPage /> : <TvWindow screen={screen} legacySlots={legacySlots} />
}
