// Where the training sessions live: the cloud table (written by the database itself), or this browser in test mode.

import type { GymDate } from '@shared/booking'
import type { ShownSection, TrainingSession } from '@shared/routine'

export interface SessionsService {
  /** Every session from that gym date on. */
  load: (from: GymDate) => Promise<TrainingSession[]>
  /** Called when sessions may have changed (live, or in another window). */
  subscribe: (onChange: () => void) => () => void
}

/** Local test mode only: what the database trigger does in the cloud, after each change of the TV sections. */
export interface LocalSessionRecorder {
  record: (before: readonly ShownSection[], after: readonly ShownSection[]) => void
}
