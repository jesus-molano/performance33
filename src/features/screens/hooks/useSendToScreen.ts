import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useDisclosure, useDisplayWindow, useIsMobile, usePhoneScreen, useToast } from '@/hooks'
import { useClient, useClients } from '@/store'
import type { ScreenPickerProps } from '@/features/screens/components/ScreenPicker'
import { SEND_COPY } from '@/features/screens/config/copy'
import { readLastDestination, saveLastDestination, subscribeLastDestination } from '@/features/screens/store/lastDestination'
import type { SectionChange, SectionRef } from '@/features/screens/types'
import { buildPickerScreens, movedFromSection, replacedOccupant, resolveLastDestination, screenNameOf } from '@/features/screens/utils/picker'
import { useScreenActions } from './useScreenActions'
import { useScreens } from './useScreens'

export interface SendToScreenInput {
  clientId: string
  /** 1-based day of the client's current routine. */
  day: number
  /** 'Día 2 · Pierna', for the picker and the button label. */
  dayLabel: string
}

export interface SendToScreen {
  /** Props for ScreenPicker: open state, the screens and what a tap does. */
  pickerProps: ScreenPickerProps
  openPicker: () => void
  /** 'Pantalla 1 · Sección 2' when this device has a last destination that still exists. */
  lastLabel: string | null
  /** Ctrl+clic and long press: straight to the last destination, or the picker when there is none. */
  sendToLast: () => void
}

/**
 * Sends one client and day to a section of a screen. The toast says the day, who was replaced and where the person
 * came from; its 'Deshacer' (or Ctrl+Z while it is up) puts back the sections nobody has changed since.
 */
export function useSendToScreen({ clientId, day, dayLabel }: SendToScreenInput): SendToScreen {
  const client = useClient(clientId)
  // Archived people show as nobody on the TV, so their section is free here too.
  const clients = useClients()
  const { status, screens } = useScreens()
  const actions = useScreenActions()
  const { toast, toastUndoAction } = useToast()
  const { openTv } = useDisplayWindow()
  const isMobile = useIsMobile()
  const phone = usePhoneScreen()
  const { isOpen, open: openPicker, close: closePicker } = useDisclosure()
  const lastRaw = useSyncExternalStore(subscribeLastDestination, readLastDestination)
  const name = client?.firstName ?? ''

  const names = useMemo(() => new Map(clients.map((c) => [c.id, c.firstName])), [clients])
  const last = useMemo(() => resolveLastDestination(lastRaw, screens), [lastRaw, screens])
  const target = useMemo(() => ({ clientId, day }), [clientId, day])
  const pickerScreens = useMemo(() => buildPickerScreens(screens, names, target, last), [screens, names, target, last])
  const whereOf = useCallback((ref: SectionRef) => SEND_COPY.where(screenNameOf(screens, ref.screen), ref.section), [screens])

  const warnIfFailed = useCallback(
    (saved: Promise<boolean>) =>
      void saved.then((ok) => {
        if (!ok) toast({ message: SEND_COPY.failed, tone: 'error' })
      }),
    [toast],
  )

  const undoSend = useCallback(
    (change: SectionChange) => {
      const { skipped, saved } = actions.undo(change)
      if (skipped) toast({ message: SEND_COPY.undoSkipped(skipped) })
      warnIfFailed(saved)
    },
    [actions, toast, warnIfFailed],
  )

  const send = useCallback(
    (ref: SectionRef) => {
      closePicker()
      saveLastDestination(ref)
      const where = whereOf(ref)
      const replaced = replacedOccupant(screens, ref, clientId, names)
      const from = movedFromSection(screens, ref, clientId)
      const change = actions.send(ref, target)
      if (!change.written.length) {
        toast({ message: SEND_COPY.alreadyThere(name, where) })
        return
      }
      toastUndoAction({
        message: SEND_COPY.sent({ name, day, where, replaced, movedFrom: from ? whereOf(from) : null }),
        tone: 'success',
        onUndo: () => undoSend(change),
      })
      warnIfFailed(change.saved)
    },
    [actions, clientId, closePicker, day, name, names, screens, target, toast, toastUndoAction, undoSend, warnIfFailed, whereOf],
  )

  const sendToLast = useCallback(() => (last ? send(last) : openPicker()), [last, openPicker, send])

  return {
    pickerProps: {
      open: isOpen,
      onClose: closePicker,
      clientName: name,
      dayLabel,
      status,
      screens: pickerScreens,
      canOpenScreens: !phone,
      hint: last ? SEND_COPY.lastHint(whereOf(last), isMobile) : null,
      onPick: send,
      onOpenScreen: openTv,
    },
    openPicker,
    lastLabel: last ? whereOf(last) : null,
    sendToLast,
  }
}
