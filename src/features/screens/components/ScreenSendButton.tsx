import { Cast } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SEND_COPY } from '@/features/screens/config/copy'
import { useLongPress } from '@/features/screens/hooks/useLongPress'
import { useSendToScreen, type SendToScreenInput } from '@/features/screens/hooks/useSendToScreen'
import { ScreenPicker } from './ScreenPicker'

export interface ScreenSendButtonProps extends SendToScreenInput {
  className?: string
}

/**
 * 'Pantalla' on a day (icon only on phones): a click opens the picker; Ctrl+clic (or holding it on a phone) sends to
 * the last section used.
 */
export function ScreenSendButton({ className, ...input }: ScreenSendButtonProps) {
  const send = useSendToScreen(input)
  const longPress = useLongPress(send.sendToLast)

  const onClick = (event: MouseEvent) => {
    if (longPress.consumeClick()) return
    if (event.ctrlKey || event.metaKey) send.sendToLast()
    else send.openPicker()
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={Cast}
        onClick={onClick}
        aria-label={SEND_COPY.buttonLabel(input.dayLabel)}
        aria-haspopup="dialog"
        title={SEND_COPY.buttonTip(send.lastLabel)}
        className={cn('touch-manipulation select-none [-webkit-touch-callout:none] max-sm:w-11 max-sm:px-0', className)}
        {...longPress.handlers}
      >
        <span className="hidden sm:inline">{SEND_COPY.button}</span>
      </Button>
      <ScreenPicker {...send.pickerProps} />
    </>
  )
}
