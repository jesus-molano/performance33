import { useCallback, useMemo, useState } from 'react'
import type { Program } from '@/types'
import { useNextDay } from '@/features/sessions'
import {
  initialScreenDay,
  pickedScreenDay,
  screenDayOptions,
  shownScreenDay,
  useScreens,
  useSendButton,
  useSendToScreen,
  type ScreenDayOption,
  type ScreenPickerProps,
  type SendButtonWiring,
} from '@/features/screens'

export interface ClientScreenSend {
  pickerProps: ScreenPickerProps
  days: ScreenDayOption[]
  day: number
  chooseDay: (day: number) => void
  /** Click and long press of the 'Pantalla' button. */
  wiring: SendButtonWiring
  /** Tooltip: 'Elige pantalla y sección · Ctrl+clic: directo a…'. */
  lastLabel: string | null
}

/**
 * 'Pantalla' on a user of the list: the picker first asks which day of the current routine, then the section. It
 * starts on the day the person shows on a TV now, so moving her to another section keeps her day, else on the day that
 * is next for her ('Le toca', Día 1 with no session in this routine yet);
 * Ctrl+clic or a long press sends that same day to the last section used. A day chosen by hand lasts until the picker
 * closes, so a Ctrl+clic never sends an old choice.
 */
export function useClientScreenSend(clientId: string, program: Program): ClientScreenSend {
  const days = useMemo(() => screenDayOptions(program.days), [program.days])
  const { screens } = useScreens()
  const [chosen, setChosen] = useState<number | null>(null)
  const nextDay = useNextDay(clientId)?.day ?? null
  const startDay = initialScreenDay(days, shownScreenDay(screens, clientId), nextDay)
  const picked = pickedScreenDay(days, chosen ?? startDay)
  const day = picked?.day ?? startDay
  const send = useSendToScreen({ clientId, day, dayLabel: picked?.label ?? '' })
  const wiring = useSendButton(send)
  const reset = useCallback(() => setChosen(null), [])
  const { onClose, onPick } = send.pickerProps

  return {
    pickerProps: {
      ...send.pickerProps,
      onClose: () => {
        reset()
        onClose()
      },
      onPick: (ref) => {
        onPick(ref)
        reset()
      },
    },
    days,
    day,
    chooseDay: setChosen,
    wiring,
    lastLabel: send.lastLabel,
  }
}
