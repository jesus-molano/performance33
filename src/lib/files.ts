import { MAX_LOGO_BYTES } from '@/config/branding'
import { todayISO } from './dates'

/** Read an image File into a data URL. Rejects (Spanish message) when larger than maxBytes. */
export function fileToDataUrl(file: File, maxBytes: number = MAX_LOGO_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error('La imagen es demasiado grande (máx. 1,5 MB).'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

/** Trigger a browser download of `value` as pretty JSON. */
export function downloadJson(value: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 'performance33-copia-2026-10-31.json'. */
export function backupFilename(): string {
  return `performance33-copia-${todayISO()}.json`
}
