import { Search } from 'lucide-react'
import { Avatar, Input, Modal } from '@/components/ui'
import { planLabel } from '@/lib/plans'
import { ADD_PERSON_COPY } from '@/features/classes/config/copy'
import { useAddPerson } from '@/features/classes/hooks/useAddPerson'
import type { Booking, SlotSummary } from '@/features/classes/types'
import { slotTimeRange } from '@/features/classes/utils/time'

export interface AddPersonModalProps {
  slot: SlotSummary
  bookings: readonly Booking[]
  onClose: () => void
}

/** One tap puts that person in the class; it stays open to add someone else. Render only while open. */
export function AddPersonModal({ slot, bookings, onClose }: AddPersonModalProps) {
  const people = useAddPerson(slot, bookings)
  return (
    <Modal open onClose={onClose} title={ADD_PERSON_COPY.title} description={ADD_PERSON_COPY.description(slot.name, slotTimeRange(slot))} fill>
      <div className="flex flex-col gap-3 pt-1">
        <Input
          leftIcon={Search}
          placeholder={ADD_PERSON_COPY.search}
          aria-label={ADD_PERSON_COPY.search}
          value={people.query}
          onChange={(e) => people.setQuery(e.target.value)}
          autoComplete="off"
          nativeUndo
        />
        {people.allIn || people.results.length === 0 ? (
          <p className="py-6 text-center text-md text-fg-muted">{people.allIn ? ADD_PERSON_COPY.alreadyAll : ADD_PERSON_COPY.none}</p>
        ) : (
          <ul className="flex flex-col">
            {people.results.map(({ client, name }) => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => people.add(client)}
                  disabled={people.busyId !== null}
                  className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-canvas disabled:opacity-60"
                >
                  <Avatar firstName={client.firstName} lastName={client.lastName} color={client.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-md font-medium text-fg">{name}</span>
                  <span className="shrink-0 text-sm text-fg-muted">{planLabel(client.plan)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
