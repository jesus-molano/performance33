import { Cast } from 'lucide-react'
import { Button, type ButtonSize } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SEND_COPY } from '@/features/screens/config/copy'
import type { SendButtonWiring } from '@/features/screens/hooks/useSendButton'

export interface SendButtonProps {
  /** Click and long press (useSendButton); null: the button is off. */
  wiring: SendButtonWiring | null
  ariaLabel: string
  title?: string
  size?: ButtonSize
  /** Rows on phones: the icon alone ('Mandar' otherwise). */
  iconOnPhones?: boolean
  className?: string
}

/** The look of every 'Pantalla' button ('Mandar' on phones, so it is not mistaken for the preview icon beside it). */
export function SendButton({ wiring, ariaLabel, title, size = 'sm', iconOnPhones = false, className }: SendButtonProps) {
  return (
    <Button
      size={size}
      variant="secondary"
      leftIcon={Cast}
      disabled={!wiring}
      onClick={wiring?.onClick}
      aria-label={ariaLabel}
      aria-haspopup={wiring ? 'dialog' : undefined}
      title={title}
      className={cn('touch-manipulation select-none [-webkit-touch-callout:none]', iconOnPhones && 'max-sm:w-11 max-sm:px-0', className)}
      {...wiring?.handlers}
    >
      <span className={iconOnPhones ? 'sr-only' : 'sm:hidden'}>{SEND_COPY.buttonShort}</span>
      <span className="hidden sm:inline">{SEND_COPY.button}</span>
    </Button>
  )
}
