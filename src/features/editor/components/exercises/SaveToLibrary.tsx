import { BookmarkPlus } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { useDisclosure } from '../../../../hooks'
import type { ExerciseEntry } from '../../../../types'
import { useSaveToLibrary } from '../../hooks/useSaveToLibrary'
import { SaveToLibraryModal } from './SaveToLibraryModal'

/** 'Guardar en biblioteca' for free-text exercises, so next time they appear in the search. */
export function SaveToLibrary({ entry }: { entry: ExerciseEntry }) {
  const api = useSaveToLibrary(entry)
  const modal = useDisclosure()
  if (!api.canSave && !modal.isOpen) return null
  return (
    <>
      <Button variant="ghost" size="sm" leftIcon={BookmarkPlus} onClick={modal.open} className="text-brand-strong">
        Guardar en biblioteca
      </Button>
      {modal.isOpen && <SaveToLibraryModal entry={entry} api={api} onClose={modal.close} />}
    </>
  )
}
