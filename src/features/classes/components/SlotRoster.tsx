import { UserPlus } from 'lucide-react'
import { Button, DropdownMenu, type MenuItem } from '@/components/ui'
import { ROSTER_COPY } from '@/features/classes/config/copy'
import { useSlotRoster, type SlotRosterHandlers } from '@/features/classes/hooks/useSlotRoster'
import type { Booking, SlotSummary } from '@/features/classes/types'
import type { RosterEntry } from '@/features/classes/utils/slotView'
import { RosterRow } from './RosterRow'
import { SlotSummaryLine } from './SlotSummaryLine'

export interface SlotRosterProps extends SlotRosterHandlers {
  slot: SlotSummary
  bookings: readonly Booking[]
  now: number
  onAddPerson: () => void
  /** The head repeats time, name and counts (side panel); under its card on phones it is already shown. */
  showHead?: boolean
}

function RosterList({ title, entries, menuFor }: { title: string; entries: RosterEntry[]; menuFor: (entry: RosterEntry) => MenuItem[] }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-fg-muted">
        {title} <span className="tabular">({entries.length})</span>
      </h3>
      <ul className="divide-y divide-line">
        {entries.map((entry) => (
          <RosterRow key={entry.booking.id} entry={entry} menu={menuFor(entry)} />
        ))}
      </ul>
    </section>
  )
}

/** Who comes to a class, the waitlist numbered, and what can be done with the class and each person. */
export function SlotRoster({ slot, bookings, now, onAddPerson, onEdit, onMove, showHead = false }: SlotRosterProps) {
  const { state, roster, canManage, note, slotMenu, personMenu } = useSlotRoster(slot, bookings, now, { onEdit, onMove })
  return (
    <div className="flex flex-col gap-4">
      {showHead && <SlotSummaryLine slot={slot} state={state} large />}
      {note && <p className="text-sm text-fg-muted">{note}</p>}
      {canManage && (
        <div className="flex items-center gap-2">
          <Button leftIcon={UserPlus} onClick={onAddPerson} className="flex-1 sm:flex-none">
            {ROSTER_COPY.addPerson}
          </Button>
          <DropdownMenu items={slotMenu} label={ROSTER_COPY.slotMenu} />
        </div>
      )}
      {roster.booked.length ? (
        <RosterList title={ROSTER_COPY.booked} entries={roster.booked} menuFor={personMenu} />
      ) : (
        <p className="text-md text-fg-muted">{ROSTER_COPY.empty}</p>
      )}
      {roster.waitlist.length > 0 && <RosterList title={ROSTER_COPY.waitlist} entries={roster.waitlist} menuFor={personMenu} />}
    </div>
  )
}
