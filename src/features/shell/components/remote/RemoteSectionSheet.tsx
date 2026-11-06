import { ChevronLeft } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { REMOTE_COPY } from '@/features/screens'
import type { ScreensRemoteSheet } from '@/features/shell/hooks/useScreensRemoteSheet'
import { RemoteDayList } from './RemoteDayList'
import { RemotePersonList } from './RemotePersonList'
import { RemoteSectionMenu } from './RemoteSectionMenu'

/** The sheet of one section, over the screens: first what to do, then who or which day ('Volver' goes back). */
export function RemoteSectionSheet({ sheet }: { sheet: ScreensRemoteSheet }) {
  const { picked, remote } = sheet
  if (!picked) return null
  const { screen, tile, step } = picked
  const title = step === 'person' ? REMOTE_COPY.personTitle : step === 'day' ? REMOTE_COPY.dayTitle : tile.where
  const description = step === 'menu' ? REMOTE_COPY.sectionDescription(tile.person?.fullName ?? null, tile.dayLabel) : tile.where

  return (
    <Modal open onClose={sheet.closeSection} size="sm" title={title} description={description} focusFirstField={false} nativeUndo={false}>
      {step !== 'menu' && (
        <Button variant="ghost" size="sm" leftIcon={ChevronLeft} onClick={() => sheet.setStep('menu')} className="-ml-3 mb-2">
          {REMOTE_COPY.back}
        </Button>
      )}
      {step === 'menu' && (
        <RemoteSectionMenu
          screen={screen}
          tile={tile}
          onPerson={() => sheet.setStep('person')}
          onDay={() => sheet.setStep('day')}
          onSwap={sheet.swap}
          onClear={sheet.clear}
        />
      )}
      {step === 'person' && <RemotePersonList people={remote.people} currentId={tile.person?.id ?? null} places={remote.places} onPick={sheet.putPerson} />}
      {step === 'day' && tile.person && <RemoteDayList days={tile.person.days} current={tile.day} onPick={sheet.changeDay} />}
    </Modal>
  )
}
