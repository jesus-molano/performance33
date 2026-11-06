import { CalendarDays, MonitorOff, UserRound } from 'lucide-react'
import { Button, Chip } from '@/components/ui'
import { REMOTE_COPY, SEND_COPY, type RemoteScreen, type RemoteTile } from '@/features/screens'

export interface RemoteSectionMenuProps {
  screen: RemoteScreen
  tile: RemoteTile
  onPerson: () => void
  onDay: () => void
  onSwap: (other: RemoteTile) => void
  onClear: () => void
}

/** What can be done to one section from the phone: another person, another day, swap places with a section of the same screen, empty it. */
export function RemoteSectionMenu({ screen, tile, onPerson, onDay, onSwap, onClear }: RemoteSectionMenuProps) {
  const others = screen.tiles.filter((other) => other.ref.section !== tile.ref.section && (other.person || tile.person))
  const canChangeDay = (tile.person?.days.length ?? 0) > 1
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" leftIcon={UserRound} fullWidth onClick={onPerson} className="justify-start">
        {tile.person ? REMOTE_COPY.changePerson : REMOTE_COPY.putPerson}
      </Button>
      {canChangeDay && (
        <Button variant="secondary" leftIcon={CalendarDays} fullWidth onClick={onDay} className="justify-start">
          {REMOTE_COPY.changeDay}
        </Button>
      )}
      {others.length > 0 && (
        <div role="group" aria-label={REMOTE_COPY.swapWith} className="flex flex-wrap items-center gap-2 pt-2">
          <span className="w-full text-sm font-medium text-fg-muted">{REMOTE_COPY.swapWith}</span>
          {others.map((other) => (
            <Chip key={other.ref.section} aria-label={REMOTE_COPY.swapLabel(other.where, other.person?.firstName ?? null)} onClick={() => onSwap(other)}>
              {SEND_COPY.section(other.ref.section)}
              {other.person && <span className="ml-1 font-normal">· {other.person.firstName}</span>}
            </Chip>
          ))}
        </div>
      )}
      {tile.person && (
        <Button variant="ghost" leftIcon={MonitorOff} fullWidth onClick={onClear} className="mt-2 justify-start text-red-700 hover:text-red-800">
          {REMOTE_COPY.remove}
        </Button>
      )}
    </div>
  )
}
