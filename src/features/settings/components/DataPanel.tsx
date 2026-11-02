import { Download, HardDrive, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui'
import { DATA_STORAGE_HINT } from '@/features/settings/config'
import { useDataTransfer } from '@/features/settings/hooks/useDataTransfer'
import { SettingsSection } from './SettingsSection'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-canvas px-4 py-3">
      <p className="text-2xl font-semibold text-fg tabular">{value}</p>
      <p className="text-sm text-fg-muted">{label}</p>
    </div>
  )
}

/** Ajustes → Datos: backup download/restore and demo reset. */
export function DataPanel() {
  const { stats, exportBackup, importInputRef, pickImportFile, onImportFile, resetDemo } = useDataTransfer()
  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Tus datos"
        description={
          <span className="inline-flex items-center gap-1.5">
            <HardDrive size={15} aria-hidden /> {DATA_STORAGE_HINT}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={stats.clients} label="Clientes" />
          <Stat value={stats.programs} label="Rutinas" />
          <Stat value={stats.notes} label="Notas internas" />
          <Stat value={stats.customExercises} label="Ejercicios propios" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button leftIcon={Download} onClick={exportBackup}>
            Descargar copia de seguridad
          </Button>
          <Button variant="secondary" leftIcon={Upload} onClick={pickImportFile}>
            Restaurar una copia…
          </Button>
          <input ref={importInputRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" tabIndex={-1} aria-hidden />
        </div>
      </SettingsSection>
      <SettingsSection title="Datos de demostración" description="Vuelve a cargar los clientes y rutinas de ejemplo. Borra todo lo actual, también para el resto del equipo.">
        <Button variant="danger" leftIcon={RotateCcw} onClick={resetDemo} wrap className="self-start">
          Restablecer datos de demostración
        </Button>
      </SettingsSection>
    </div>
  )
}
