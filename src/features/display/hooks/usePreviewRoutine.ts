import { useMemo } from 'react'
import { buildDisplayRoutine, toPublicClient, toPublicProgram, type DisplayRoutine } from '@/lib/display'
import { useBranding, useClient, useProgram } from '@/store'
import type { DisplayData } from '@/types'

export interface PreviewRoutine {
  routine: DisplayRoutine
  dayNumber: number
}

/**
 * Editor live preview: builds the display routine from the store, passing the client and program
 * through the same whitelist sanitisers as the TV windows, so private data never reaches the view.
 */
export function usePreviewRoutine(programId: string, dayId: string | null): PreviewRoutine | null {
  const program = useProgram(programId)
  const client = useClient(program?.clientId ?? '')
  const branding = useBranding()

  return useMemo(() => {
    if (!program || !client || !dayId) return null
    const data: DisplayData = { branding, clients: [toPublicClient(client)], programs: [toPublicProgram(program)] }
    const routine = buildDisplayRoutine(data, client.id, { programId: program.id })
    if (!routine) return null
    const index = program.days.findIndex((d) => d.id === dayId)
    return { routine, dayNumber: index >= 0 ? index + 1 : 1 }
  }, [program, client, branding, dayId])
}
