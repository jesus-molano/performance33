import { PagePlaceholder } from '../../../components/PagePlaceholder'

export interface DisplayPageProps {
  clientId: string
  /** 1-based day from ?dia= (null → first day). */
  day: number | null
  /** From ?programa= (null → client's current program). */
  programId: string | null
}

/** Single-client TV window (#/pantalla/:clientId). Reads ONLY useDisplayData() (sanitised). */
export function DisplayPage(_props: DisplayPageProps) {
  return <PagePlaceholder title="Pantalla" />
}
