import { CalendarX2, MonitorOff, UserX } from 'lucide-react'
import type { Branding } from '@/types'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { ScreenMessage } from './ScreenMessage'

interface DisplayFallbackProps {
  /** False when nothing has ever been saved on this device. */
  hasData: boolean
  /** Client's first name when the client exists. */
  name: string | null
  branding: Branding
  theme: DisplayThemeClasses
}

/** Pantalla window without a routine to show. */
export function DisplayFallback({ hasData, name, branding, theme }: DisplayFallbackProps) {
  if (!hasData) {
    return (
      <ScreenMessage
        branding={branding}
        theme={theme}
        icon={MonitorOff}
        title="Sin datos todavía"
        description="Se cargará en cuanto haya conexión. Si no aparece nada, comprueba que el gimnasio ya tiene clientes en el panel."
      />
    )
  }
  if (!name) {
    return (
      <ScreenMessage
        branding={branding}
        theme={theme}
        icon={UserX}
        title="Cliente no encontrado"
        description="Puede que se haya borrado. Cierra esta ventana y ábrela de nuevo desde el panel."
      />
    )
  }
  return (
    <ScreenMessage
      branding={branding}
      theme={theme}
      icon={CalendarX2}
      name={name}
      title="Sin rutina asignada"
      description="En cuanto tu monitor la prepare, aparecerá aquí automáticamente."
    />
  )
}
