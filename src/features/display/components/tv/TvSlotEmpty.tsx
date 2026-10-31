import { CalendarX2, MousePointerClick, UserX } from 'lucide-react'
import type { Branding, DisplayData } from '@/types'
import { findClientFirstName } from '@/features/display/utils/tvSlots'
import type { DisplayThemeClasses } from '@/features/display/utils/theme'
import { ScreenMessage } from '@/features/display/components/screen/ScreenMessage'

interface TvSlotEmptyProps {
  data: DisplayData | null
  clientId: string | null
  hasClients: boolean
  branding: Branding
  theme: DisplayThemeClasses
}

/** Empty third: nothing chosen yet, or the chosen client has no routine any more. */
export function TvSlotEmpty({ data, clientId, hasClients, branding, theme }: TvSlotEmptyProps) {
  if (clientId) {
    const name = findClientFirstName(data, clientId)
    return (
      <ScreenMessage
        branding={branding}
        theme={theme}
        icon={name ? CalendarX2 : UserX}
        name={name}
        title={name ? 'Sin rutina asignada' : 'Cliente no disponible'}
        description="Elige otro cliente arriba."
      />
    )
  }
  return (
    <ScreenMessage
      branding={branding}
      theme={theme}
      icon={MousePointerClick}
      title={hasClients ? 'Elige un cliente' : 'Aún no hay rutinas'}
      description={hasClients ? 'Usa el selector de arriba.' : 'Crea una rutina desde el panel y aparecerá aquí.'}
    />
  )
}
