// What every class action shares: refusals become a toast with the rule's words, and the screen reloads after it.

import { useCallback } from 'react'
import { bookingErrorMessage } from '@shared/booking'
import { useConfirm, useToast } from '@/hooks'
import { ACTION_COPY, STAFF_ERROR_COPY } from '@/features/classes/config/copy'
import { classesErrorCode } from '@/features/classes/services/types'
import { reloadClasses } from '@/features/classes/store/classesConnection'
import type { SlotSummary } from '@/features/classes/types'
import { formatGymTime } from '@/features/classes/utils/time'

export interface ClassRunner {
  /** Runs the action; null when it failed (already said in a toast). Reloads either way. */
  run: <T>(action: () => Promise<T>) => Promise<T | null>
  /**
   * For a class that may be full: asks "¿Añadir igualmente?" first when it is (or when the server says so) and then
   * forces the place. Null when it failed or the coach said no.
   */
  runWithFullCheck: <T>(slot: SlotSummary, name: string, action: (force: boolean) => Promise<T>) => Promise<T | null>
  toast: ReturnType<typeof useToast>
}

export function useClassRunner(): ClassRunner {
  const toast = useToast()
  const confirm = useConfirm()
  const { toast: show } = toast

  const fail = useCallback(
    (error: unknown) => {
      const code = classesErrorCode(error)
      show({ message: STAFF_ERROR_COPY[code] ?? bookingErrorMessage(code), tone: 'error' })
    },
    [show],
  )

  const run = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        return await action()
      } catch (error) {
        fail(error)
        return null
      } finally {
        void reloadClasses()
      }
    },
    [fail],
  )

  const runWithFullCheck = useCallback(
    async <T,>(slot: SlotSummary, name: string, action: (force: boolean) => Promise<T>): Promise<T | null> => {
      const askFull = () =>
        confirm({
          title: ACTION_COPY.fullTitle,
          description: ACTION_COPY.fullText(formatGymTime(slot.startsAt), slot.bookedCount, slot.capacity, name),
          confirmLabel: ACTION_COPY.fullConfirm,
        })
      const knownFull = slot.bookedCount >= slot.capacity
      if (knownFull && !(await askFull())) return null
      try {
        return await action(knownFull)
      } catch (error) {
        if (knownFull || classesErrorCode(error) !== 'slot_full') {
          fail(error)
          return null
        }
        if (!(await askFull())) return null
        return run(() => action(true))
      } finally {
        void reloadClasses()
      }
    },
    [confirm, fail, run],
  )

  return { run, runWithFullCheck, toast }
}
