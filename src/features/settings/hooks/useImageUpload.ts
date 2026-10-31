import { useRef, type ChangeEvent, type RefObject } from 'react'
import { useToast } from '../../../hooks/useToast'
import { fileToDataUrl } from '../../../lib/files'

export interface ImageUploadApi {
  inputRef: RefObject<HTMLInputElement | null>
  /** Opens the file chooser. */
  pick: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
}

/** Hidden file input → data URL (size-checked). Errors become a toast in Spanish. */
export function useImageUpload(onLoaded: (dataUrl: string) => void): ImageUploadApi {
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      onLoaded(await fileToDataUrl(file))
      toast({ message: 'Imagen actualizada', tone: 'success' })
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : 'No se pudo leer la imagen.', tone: 'error' })
    }
  }

  return { inputRef, pick: () => inputRef.current?.click(), onFileChange }
}
