import type { ProgramRoutine } from '@shared/routine/displayTypes.ts'
import type { Branding } from '@/types'

// The formatted lines, blocks and days live in shared/routine/displayTypes.ts (shared with the members' app).
export type { DisplayBlock, DisplayDay, DisplayExerciseLine, ProgramRoutine } from '@shared/routine/displayTypes.ts'

/** A client's routine fully formatted for the TV. Contains no private data. */
export interface DisplayRoutine extends ProgramRoutine {
  branding: Branding
  clientId: string
  clientFirstName: string
  clientColor: string
}
