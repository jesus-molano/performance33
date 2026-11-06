import { MobileDisplayPage } from '@/features/display/components/mobile/MobileDisplayPage'
import { DisplayWindow } from '@/features/display/components/screen/DisplayWindow'
import { usePhoneScreen } from '@/hooks'

export interface DisplayPageProps {
  clientId: string
  /** 1-based day from ?dia= (null → first day). */
  day: number | null
  /** From ?programa= (null → client's current program). */
  programId: string | null
}

/** #/pantalla/:clientId: a TV window or, on a phone, a normal page with scroll. */
export function DisplayPage(props: DisplayPageProps) {
  const phone = usePhoneScreen()
  return phone ? <MobileDisplayPage {...props} /> : <DisplayWindow {...props} />
}
