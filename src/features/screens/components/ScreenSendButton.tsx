import type { ButtonSize } from '@/components/ui'
import { SEND_COPY } from '@/features/screens/config/copy'
import { useSendButton } from '@/features/screens/hooks/useSendButton'
import { useSendToScreen, type SendToScreenInput } from '@/features/screens/hooks/useSendToScreen'
import { ScreenPicker } from './ScreenPicker'
import { SendButton } from './SendButton'

export interface ScreenSendButtonProps extends SendToScreenInput {
  className?: string
  /** 'sm' on day rows (default); 'md' beside other full-size buttons. */
  size?: ButtonSize
}

/** 'Pantalla' on a day of a routine: the picker of screens and sections, or straight to the last one (useSendButton). */
export function ScreenSendButton({ className, size = 'sm', ...input }: ScreenSendButtonProps) {
  const send = useSendToScreen(input)
  const wiring = useSendButton(send)
  return (
    <>
      <SendButton
        wiring={wiring}
        size={size}
        ariaLabel={SEND_COPY.buttonLabel(input.dayLabel)}
        title={SEND_COPY.buttonTip(send.lastLabel)}
        className={className}
      />
      <ScreenPicker {...send.pickerProps} />
    </>
  )
}
