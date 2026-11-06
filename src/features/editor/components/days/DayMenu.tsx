import { Cast } from 'lucide-react'
import { DropdownMenu, type MenuItem } from '@/components/ui'
import { ScreenPicker, SEND_COPY, useSendToScreen, type SendToScreenInput } from '@/features/screens'

const MENU_LABEL = 'Opciones del día'

export interface DayMenuProps {
  menuItems: MenuItem[]
  /** Set when the day belongs to the client's current routine (what the TVs show). */
  screenTarget: SendToScreenInput | null
}

function DaySendMenu({ menuItems, screenTarget }: { menuItems: MenuItem[]; screenTarget: SendToScreenInput }) {
  const send = useSendToScreen(screenTarget)
  const items: MenuItem[] = [{ label: SEND_COPY.menuItem, icon: Cast, onSelect: send.openPicker }, 'separator', ...menuItems]
  return (
    <>
      <DropdownMenu items={items} label={MENU_LABEL} />
      <ScreenPicker {...send.pickerProps} hint={null} />
    </>
  )
}

/** The day's '⋯': 'Mandar a pantalla…' first when the day can go to a TV, then the day actions. */
export function DayMenu({ menuItems, screenTarget }: DayMenuProps) {
  return screenTarget ? <DaySendMenu menuItems={menuItems} screenTarget={screenTarget} /> : <DropdownMenu items={menuItems} label={MENU_LABEL} />
}
