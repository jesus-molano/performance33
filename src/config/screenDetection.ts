// What a coach reads about the TVs this computer can see (Ajustes → Pantallas, the Pantallas menu, TV windows).

import type { ScreenDetectionState } from '@/lib/screenDetails'

export interface DetectionNote {
  title: string
  body?: string
  /** Button that asks the browser for the permission. */
  action?: string
}

const tvs = (count: number) => (count === 1 ? '1 tele detectada' : `${count} teles detectadas`)

export function detectionNote(state: ScreenDetectionState, tvCount: number): DetectionNote {
  switch (state) {
    case 'unsupported':
      return {
        title: 'Este navegador no coloca las ventanas en las teles',
        body: 'Abre cada pantalla, arrástrala a su tele y pulsa F11. Con Chrome o Edge se abren solas en su tele.',
      }
    case 'needs-permission':
      return {
        title: 'Deja que la app encuentre las teles',
        body: 'El navegador te preguntará una sola vez si puede colocar ventanas: pulsa «Permitir».',
        action: 'Buscar teles',
      }
    case 'denied':
      return {
        title: 'Has bloqueado el permiso para colocar ventanas',
        body: 'Pulsa el icono que hay a la izquierda de la dirección web, busca «Administración de ventanas», elige «Permitir» y recarga la página.',
      }
    case 'single':
      return {
        title: 'No hay ninguna tele conectada: pulsa Win+K y elige Extender',
        body: 'Con «Duplicar» la tele copia el portátil y no se puede usar como pantalla aparte.',
      }
    case 'ok':
      return tvCount
        ? { title: tvs(tvCount), body: 'Cada pantalla se abre directamente en su tele.' }
        : { title: 'No hay ninguna tele conectada: pulsa Win+K y elige Extender' }
  }
}

export const SCREEN_DETECTION_COPY = {
  title: 'Teles detectadas en este portátil',
  description: 'Elige en qué tele se abre cada pantalla. Se guarda solo en este ordenador.',
  opensOn: (name: string) => `${name} se abre en`,
  automatic: (label: string | null) => (label ? `Automática (${label})` : 'Automática (ninguna libre)'),
  mainScreen: 'este portátil',
  on: (label: string) => `En «${label}»`,
  open: (title: string) => `Abrir ${title}`,
  focus: (title: string) => `Ir a ${title}`,
  openOn: (title: string, label: string) => `Abrir ${title} en «${label}»`,
  disconnected: (name: string) => `${name} desconectada`,
  disconnectedToast: (name: string) => `${name} desconectada. Pulsa Win+K y vuelve a conectar la tele.`,
} as const

export const TV_FULLSCREEN_COPY = {
  button: 'Pantalla completa',
  hint: 'Pulsa una vez para que la rutina ocupe toda la tele.',
  later: 'Ahora no',
} as const
