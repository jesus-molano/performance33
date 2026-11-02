import type { TvSlot } from '@/lib/routes'
import { MobileTvPage } from '@/features/display/components/mobile/MobileTvPage'
import { TvWindow } from '@/features/display/components/tv/TvWindow'
import { usePhoneScreen } from '@/features/display/hooks/usePhoneScreen'

export interface TvPageProps {
  /** Number of the named screen (Pantalla N), from #/tv?pantalla=; old URLs are Pantalla 1. */
  screen: number
  /** TV_MIN_SLOTS..TV_MAX_SLOTS slots (3 by default), parsed from #/tv?slots=. */
  slots: TvSlot[]
}

/** 'Modo TV': a named TV window or, on a phone, a list of people to open. */
export function TvPage({ screen, slots }: TvPageProps) {
  const phone = usePhoneScreen()
  return phone ? <MobileTvPage /> : <TvWindow screen={screen} slots={slots} />
}
