import { Contact, Database, Dumbbell, MonitorPlay, Moon, Palette, Sun, type LucideIcon } from 'lucide-react'
import { BACKEND } from '@/config/backend'
import type { SettingsTab } from '@/lib/routes'
import type { DisplayTheme, MeasureType } from '@/types'
import { MEASURE_META, MEASURE_ORDER } from '@/config/exerciseFields'

export interface SettingsTabMeta {
  label: string
  icon: LucideIcon
  description: string
}

export const SETTINGS_TAB_META: Record<SettingsTab, SettingsTabMeta> = {
  marca: { label: 'Marca', icon: Palette, description: 'Nombre, logotipo y colores del gimnasio.' },
  biblioteca: { label: 'Ejercicios', icon: Dumbbell, description: 'La biblioteca que aparece al escribir un ejercicio.' },
  pantallas: { label: 'Pantallas', icon: MonitorPlay, description: 'Las teles del gimnasio: su nombre y en cuántas secciones se divide cada una.' },
  equipo: { label: 'Equipo', icon: Contact, description: 'Las cuentas del equipo: quién puede entrar en la aplicación.' },
  datos: { label: 'Datos', icon: Database, description: 'Copias de seguridad y datos de demostración.' },
}

/** Tabs a monitor can use; administrators see them all. */
export const MONITOR_SETTINGS_TABS: readonly SettingsTab[] = ['biblioteca', 'pantallas']

export const DATA_STORAGE_HINT =
  BACKEND.mode === 'cloud'
    ? 'Se guardan solos en la nube y los comparte todo el equipo. Descarga una copia de vez en cuando.'
    : 'Modo local de pruebas: se guardan solo en este navegador.'

/** What an admin must type to confirm replacing everything for the whole team. */
export const DANGER_CONFIRM_WORD = 'BORRAR'

export const DISPLAY_THEME_OPTIONS: ReadonlyArray<{ value: DisplayTheme; label: string; icon: LucideIcon }> = [
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'light', label: 'Claro', icon: Sun },
]

export const MEASURE_OPTIONS: ReadonlyArray<{ value: MeasureType; label: string }> = MEASURE_ORDER.map((m) => ({
  value: m,
  label: MEASURE_META[m].label,
}))

/** Accepted image types for logo / icon uploads. */
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/svg+xml,image/webp'
