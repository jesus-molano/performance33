import { BookmarkPlus } from 'lucide-react'
import { Button } from '@/components/ui'
import { useDisclosure } from '@/hooks'
import type { ExerciseEntry } from '@/types'
import { useSaveToLibrary } from '@/features/editor/hooks/useSaveToLibrary'
import { SaveToLibraryModal } from './SaveToLibraryModal'

/** 'Guardar en biblioteca' for free-text exercises, so next time they appear in the search. */
export function SaveToLibrary({ entry }: { entry: ExerciseEntry }) {
  const api = useSaveToLibrary(entry)
  const modal = useDisclosure()
  if (!api.canSave && !modal.isOpen) return null
  const open = () => {
    api.begin()
    modal.open()
  }
  return (
    <>
      <Button variant="ghost" size="sm" leftIcon={BookmarkPlus} onClick={open} className="text-brand-strong">
        Guardar en biblioteca
      </Button>
      {modal.isOpen && <SaveToLibraryModal api={api} onClose={modal.close} />}
    </>
  )
}
