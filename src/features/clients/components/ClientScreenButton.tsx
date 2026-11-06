import type { Client, Program } from '@/types'
import { ScreenPicker, SEND_COPY, SendButton } from '@/features/screens'
import { CLIENT_SCREEN_COPY } from '@/features/clients/config'
import { useClientScreenSend } from '@/features/clients/hooks/useClientScreenSend'
import { ScreenDayChips } from './ScreenDayChips'

export interface ClientScreenButtonProps {
  client: Pick<Client, 'id' | 'firstName'>
  program: Program | null
  /** Rows on phones: the icon alone ('Mandar' otherwise). */
  iconOnPhones?: boolean
}

interface ClientSendButtonProps {
  client: ClientScreenButtonProps['client']
  program: Program
  iconOnPhones: boolean
}

function ClientSendButton({ client, program, iconOnPhones }: ClientSendButtonProps) {
  const send = useClientScreenSend(client.id, program)
  return (
    <>
      <SendButton
        wiring={send.wiring}
        iconOnPhones={iconOnPhones}
        ariaLabel={CLIENT_SCREEN_COPY.buttonLabel(client.firstName)}
        title={SEND_COPY.buttonTip(send.lastLabel)}
      />
      <ScreenPicker {...send.pickerProps}>
        <ScreenDayChips days={send.days} day={send.day} onChoose={send.chooseDay} />
      </ScreenPicker>
    </>
  )
}

/** 'Pantalla' on each user of the list; greyed out with 'Sin rutina' when there is no current routine. */
export function ClientScreenButton({ client, program, iconOnPhones = false }: ClientScreenButtonProps) {
  if (program?.days.length) return <ClientSendButton client={client} program={program} iconOnPhones={iconOnPhones} />
  return (
    // A disabled button gets no hover, so the tooltip sits on its wrapper.
    <span title={CLIENT_SCREEN_COPY.noRoutine} className="inline-flex">
      <SendButton wiring={null} iconOnPhones={iconOnPhones} ariaLabel={`${CLIENT_SCREEN_COPY.buttonLabel(client.firstName)}: ${CLIENT_SCREEN_COPY.noRoutine}`} />
    </span>
  )
}
