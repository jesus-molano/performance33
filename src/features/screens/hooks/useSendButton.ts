import type { MouseEvent } from 'react'
import { useLongPress, type LongPressHandlers } from './useLongPress'
import type { SendToScreen } from './useSendToScreen'

export interface SendButtonWiring {
  onClick: (event: MouseEvent) => void
  /** Long press (touch): straight to the last section used. */
  handlers: LongPressHandlers
}

/** Every 'Pantalla' button: a click opens the picker; Ctrl+clic (or holding it on a phone) sends to the last section used. */
export function useSendButton({ sendToLast, openPicker }: Pick<SendToScreen, 'sendToLast' | 'openPicker'>): SendButtonWiring {
  const longPress = useLongPress(sendToLast)
  const onClick = (event: MouseEvent) => {
    if (longPress.consumeClick()) return
    if (event.ctrlKey || event.metaKey) sendToLast()
    else openPicker()
  }
  return { onClick, handlers: longPress.handlers }
}
