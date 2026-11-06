import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import type { Program } from '@/types'
import { useLongPress, useSendToScreen, type LongPress, type ScreenPickerProps } from '@/features/screens'
import { DEFAULT_SCREEN_DAY, pickedScreenDay, screenDayOptions, type ScreenDayOption } from '@/features/clients/utils/screenDays'

export interface ClientScreenSend {
  pickerProps: ScreenPickerProps
  days: ScreenDayOption[]
  day: number
  chooseDay: (day: number) => void
  onClick: (event: MouseEvent) => void
  longPress: LongPress['handlers']
  /** Tooltip: 'Elige pantalla y sección · Ctrl+clic: directo a…'. */
  lastLabel: string | null
}

/**
 * 'Pantalla' on a user of the list: the picker first asks which day of the current routine (Día 1 chosen), then the
 * section. Ctrl+clic or a long press sends Día 1 to the last section used. The day goes back to Día 1 once the picker
 * closes, so a Ctrl+clic never sends an old choice.
 */
export function useClientScreenSend(clientId: string, program: Program): ClientScreenSend {
  const days = useMemo(() => screenDayOptions(program.days), [program.days])
  const [chosen, setChosen] = useState(DEFAULT_SCREEN_DAY)
  const picked = pickedScreenDay(days, chosen)
  const send = useSendToScreen({ clientId, day: picked?.day ?? DEFAULT_SCREEN_DAY, dayLabel: picked?.label ?? '' })
  const longPress = useLongPress(send.sendToLast)
  const reset = useCallback(() => setChosen(DEFAULT_SCREEN_DAY), [])
  const { onClose, onPick } = send.pickerProps

  const onClick = (event: MouseEvent) => {
    if (longPress.consumeClick()) return
    if (event.ctrlKey || event.metaKey) send.sendToLast()
    else send.openPicker()
  }

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
    day: picked?.day ?? DEFAULT_SCREEN_DAY,
    chooseDay: setChosen,
    onClick,
    longPress: longPress.handlers,
    lastLabel: send.lastLabel,
  }
}
