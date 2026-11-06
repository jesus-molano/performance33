// What a coach reads about the screens this computer can see (Ajustes → Pantallas, the Pantallas menu, TV windows).
// The coach UI says «pantalla» for a TV too; the laptop is «el portátil».

import type { ScreenDetectionState } from '@/lib/screenDetails'

export interface DetectionNote {
  title: string
  body?: string
  /** Button that asks the browser for the permission. */
  action?: string
}

const tvs = (count: number) => (count === 1 ? '1 pantalla detectada' : `${count} pantallas detectadas`)

export function detectionNote(state: ScreenDetectionState, tvCount: number): DetectionNote {
  switch (state) {
    case 'unsupported':
      return {
        title: 'Este navegador no coloca solas las ventanas',
        body: 'Abre cada pantalla, arrástrala a su sitio y pulsa F11. Con Chrome o Edge se colocan solas.',
      }
    case 'needs-permission':
      return {
        title: 'Deja que la app encuentre las pantallas',
        body: 'El navegador te preguntará una sola vez si puede colocar ventanas: pulsa «Permitir».',
        action: 'Buscar pantallas',
      }
    case 'denied':
      return {
        title: 'Has bloqueado el permiso para colocar ventanas',
        body: 'Pulsa el icono que hay a la izquierda de la dirección web, busca «Administración de ventanas», elige «Permitir» y recarga la página.',
      }
    case 'single':
      return {
        title: 'No hay ninguna pantalla conectada: pulsa Win+K y elige Extender',
        body: 'Con «Duplicar» la pantalla copia el portátil y no se puede usar aparte.',
      }
    case 'ok':
      return tvCount
        ? { title: tvs(tvCount), body: 'Cada pantalla se abre sola en su sitio.' }
        : { title: 'No hay ninguna pantalla conectada: pulsa Win+K y elige Extender' }
  }
}

export const SCREEN_DETECTION_COPY = {
  /** A screen the browser gives no name (the key keeps the old 'Pantalla externa N', so choices saved before still match). */
  unnamedScreen: (position: number) => `Pantalla externa ${position}`,
  title: 'Pantallas detectadas en este portátil',
  description: 'Elige dónde se abre cada pantalla. Se guarda solo en este ordenador.',
  opensOn: (name: string) => `${name} se abre en`,
  automatic: (label: string | null) => (label ? `Automática (${label})` : 'Automática (ninguna libre)'),
  mainScreen: 'este portátil',
  on: (label: string) => `En «${label}»`,
  open: (title: string) => `Abrir ${title}`,
  focus: (title: string) => `Ir a ${title}`,
  placeOn: (title: string, label: string) => `Colocar ${title} en su sitio («${label}»)`,
  openOn: (title: string, label: string) => `Abrir ${title} en «${label}»`,
  disconnected: (name: string) => `${name} desconectada`,
  /** Next to its own title (the 'Pantallas' menu rows), where repeating the name says nothing. */
  disconnectedShort: 'Desconectada',
  disconnectedToast: (name: string) => `${name} desconectada. Pulsa Win+K y vuelve a conectarla.`,
} as const

export const TV_FULLSCREEN_COPY = {
  button: 'Pantalla completa',
  hint: 'Pulsa una vez para que la rutina ocupe toda la pantalla.',
  later: 'Ahora no',
} as const

/** A TV window told to close that the browser does not let close itself (it was not opened by the app). */
export const TV_CLOSE_BLOCKED_COPY = {
  title: 'Cierra esta ventana con la X',
  body: 'Esta ventana no se puede cerrar sola. Usa la X de arriba a la derecha.',
  keep: 'Seguir mostrándola',
} as const
