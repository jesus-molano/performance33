// Ajustes → Pantallas: texts and the choice of sections.

import { TV_MAX_SCREENS, TV_MAX_SECTIONS, TV_MIN_SECTIONS, TV_READABLE_SECTIONS } from '@/config/app'
import type { SegmentOption } from '@/components/ui'

export const SCREENS_PANEL_COPY = {
  title: 'Pantallas del gimnasio',
  description: `Cada pantalla tiene su nombre y sus secciones (hasta ${TV_MAX_SCREENS} pantallas). Los cambios se guardan solos y se ven al momento.`,
  /** On a phone screens can't be added, so no limit to mention. */
  phoneDescription: 'Cada pantalla tiene su nombre y sus secciones. Los cambios se guardan solos y se ven al momento.',
  loading: 'Cargando las pantallas…',
  empty: 'Todavía no hay ninguna pantalla.',
  add: 'Añadir pantalla',
  atMaximum: `Ya tienes las ${TV_MAX_SCREENS} pantallas que se pueden usar.`,
  nameLabel: 'Nombre',
  sectionsLabel: 'Secciones',
  sectionsHint: 'Cuántas personas caben a la vez en esta pantalla.',
  previewLabel: (name: string, sections: number) => `Así se reparte ${name}: ${sections} ${sections === 1 ? 'sección' : 'secciones'}`,
  readability: `Con más de ${TV_READABLE_SECTIONS} secciones, en una pantalla de 27″ a 3-4 m se leerá pequeño. Úsalo solo si la pantalla es más grande o está cerca.`,
  online: 'Abierta',
  open: 'Abrir',
  openLabel: (name: string) => `Abrir ${name} en una ventana`,
  remove: (name: string) => `Quitar ${name}`,
  removeTitle: (name: string) => `¿Quitar ${name}?`,
  removeDescription: 'Se vacían sus secciones y se cierra su ventana si está abierta. Podrás volver a añadirla cuando quieras.',
  removeConfirm: 'Quitar',
  lastScreen: 'Tiene que quedar al menos una pantalla.',
  saveFailed: 'No se ha podido guardar. Revisa la conexión e inténtalo otra vez.',
  sectionsCleared: (people: number) => `${people === 1 ? 'Se ha quitado 1 persona' : `Se han quitado ${people} personas`} de la pantalla.`,
} as const

export const SECTION_COUNT_OPTIONS: ReadonlyArray<SegmentOption<string>> = Array.from(
  { length: TV_MAX_SECTIONS - TV_MIN_SECTIONS + 1 },
  (_, i) => {
    const value = String(TV_MIN_SECTIONS + i)
    return { value, label: value }
  },
)
