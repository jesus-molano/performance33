import { useCallback, useRef, type ChangeEvent, type RefObject } from 'react'
import { useConfirm, useToast } from '@/hooks'
import { plural } from '@/lib/format'
import { downloadBackup, readBackupFile } from '@/persistence'
import { useAppActions, useAppData } from '@/store'
import { DANGER_CONFIRM_WORD } from '@/features/settings/config'
import type { AppData } from '@/types'

export interface DataStats {
  clients: number
  programs: number
  notes: number
  customExercises: number
}

export interface DataTransferApi {
  stats: DataStats
  exportBackup: () => void
  importInputRef: RefObject<HTMLInputElement | null>
  pickImportFile: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  resetDemo: () => Promise<void>
}

const selectData = (data: AppData) => data

/** Ajustes → Datos: JSON backup export/import and demo reset (both confirmed first). */
export function useDataTransfer(): DataTransferApi {
  const data = useAppData(selectData)
  const { importData, resetDemoData } = useAppActions()
  const confirm = useConfirm()
  const { toast } = useToast()
  const importInputRef = useRef<HTMLInputElement>(null)

  const exportBackup = useCallback(() => {
    downloadBackup(data)
    toast({ message: 'Copia descargada. Guárdala en un sitio seguro.', tone: 'success' })
  }, [data, toast])

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const backup = await readBackupFile(file)
      const ok = await confirm({
        title: '¿Restaurar esta copia?',
        description: `Se sustituirán los datos de todo el equipo por los de la copia (${plural(backup.clients.length, 'cliente', 'clientes')}). Esto no se puede deshacer.`,
        confirmLabel: 'Restaurar copia',
        danger: true,
        requireText: DANGER_CONFIRM_WORD,
      })
      if (!ok) return
      importData(backup)
      toast({ message: 'Copia restaurada', tone: 'success' })
    } catch (error) {
      toast({ message: error instanceof Error ? error.message : 'No se pudo leer el archivo.', tone: 'error' })
    }
  }

  const resetDemo = async () => {
    const ok = await confirm({
      title: '¿Volver a los datos de demostración?',
      description: 'Se borrarán todos los clientes, rutinas y notas de todo el equipo. Esto no se puede deshacer.',
      confirmLabel: 'Restablecer',
      danger: true,
      requireText: DANGER_CONFIRM_WORD,
    })
    if (!ok) return
    resetDemoData()
    toast({ message: 'Datos de demostración restablecidos', tone: 'success' })
  }

  return {
    stats: {
      clients: data.clients.length,
      programs: data.programs.length,
      notes: data.notes.length,
      customExercises: data.customExercises.length,
    },
    exportBackup,
    importInputRef,
    pickImportFile: () => importInputRef.current?.click(),
    onImportFile,
    resetDemo,
  }
}
