import { Cast } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Client, Program } from '@/types'
import { ScreenPicker, SEND_COPY } from '@/features/screens'
import { CLIENT_SCREEN_COPY } from '@/features/clients/config'
import { useClientScreenSend } from '@/features/clients/hooks/useClientScreenSend'
import { ScreenDayChips } from './ScreenDayChips'

export interface ClientScreenButtonProps {
  client: Pick<Client, 'id' | 'firstName'>
  program: Program | null
  /** Rows on phones: the icon alone ('Mandar' otherwise). */
  iconOnPhones?: boolean
}

const BUTTON_CLASSES = 'touch-manipulation select-none [-webkit-touch-callout:none]'

function ButtonText({ iconOnPhones }: { iconOnPhones: boolean }) {
  return (
    <>
      <span className={iconOnPhones ? 'sr-only' : 'sm:hidden'}>{SEND_COPY.buttonShort}</span>
      <span className="hidden sm:inline">{SEND_COPY.button}</span>
    </>
  )
}

function SendButton({ client, program, iconOnPhones }: { client: ClientScreenButtonProps['client']; program: Program; iconOnPhones: boolean }) {
  const send = useClientScreenSend(client.id, program)
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        leftIcon={Cast}
        onClick={send.onClick}
        aria-label={CLIENT_SCREEN_COPY.buttonLabel(client.firstName)}
        aria-haspopup="dialog"
        title={SEND_COPY.buttonTip(send.lastLabel)}
        className={cn(BUTTON_CLASSES, iconOnPhones && 'max-sm:w-11 max-sm:px-0')}
        {...send.longPress}
      >
        <ButtonText iconOnPhones={iconOnPhones} />
      </Button>
      <ScreenPicker {...send.pickerProps}>
        <ScreenDayChips days={send.days} day={send.day} onChoose={send.chooseDay} />
      </ScreenPicker>
    </>
  )
}

/** 'Pantalla' on each user of the list; greyed out with 'Sin rutina' when there is no current routine. */
export function ClientScreenButton({ client, program, iconOnPhones = false }: ClientScreenButtonProps) {
  if (program?.days.length) return <SendButton client={client} program={program} iconOnPhones={iconOnPhones} />
  return (
    // A disabled button gets no hover, so the tooltip sits on its wrapper.
    <span title={CLIENT_SCREEN_COPY.noRoutine} className="inline-flex">
      <Button size="sm" variant="secondary" leftIcon={Cast} disabled aria-label={`${CLIENT_SCREEN_COPY.buttonLabel(client.firstName)}: ${CLIENT_SCREEN_COPY.noRoutine}`} className={cn(iconOnPhones && 'max-sm:w-11 max-sm:px-0')}>
        <ButtonText iconOnPhones={iconOnPhones} />
      </Button>
    </span>
  )
}
