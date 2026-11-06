// The TV windows of this laptop: bring them all here, close them all, and the automatic fullscreen (Ajustes → Pantallas).

/** Downloaded from the app (public/teles): the Chrome policy that lets TV windows go fullscreen with no click. */
export const AUTO_FULLSCREEN_FILES = {
  enable: { href: `${import.meta.env.BASE_URL}teles/activar-pantalla-completa.reg`, name: 'activar-pantalla-completa.reg' },
  disable: { href: `${import.meta.env.BASE_URL}teles/quitar-pantalla-completa.reg`, name: 'quitar-pantalla-completa.reg' },
} as const

export const TV_WINDOWS_COPY = {
  bringAll: 'Traer todas',
  bringAllLabel: 'Traer todas las pantallas a este portátil',
  closeAll: 'Cerrar todas',
  closeAllLabel: 'Cerrar todas las pantallas de este portátil',
  broughtToast: 'Pantallas en el portátil',
  sendBack: 'Devolver a sus teles',
  closedToast: 'Pantallas cerradas',
  reopen: 'Abrir otra vez',
  /** Ajustes → Pantallas, when the TVs are seen: each TV already has its own screen. */
  addAdvanced: 'Añadir otra pantalla',
  addAdvancedHint: 'No suele hacer falta: cada tele conectada ya tiene su pantalla.',
  removeKeepsTv: 'Cada tele conectada tiene su pantalla',
} as const

export const AUTO_FULLSCREEN_COPY = {
  label: 'Pantalla completa automática',
  on: 'Activada ✓',
  off: 'Sin activar',
  /** Coaches: nothing to do, one click on the TV is enough. */
  offForCoaches: 'En cada tele, pulsa una vez «Pantalla completa».',
  adminIntro: 'Para que las teles se pongan solas en pantalla completa, hazlo una vez en este portátil:',
  steps: [
    'Descarga y abre «activar-pantalla-completa.reg» y acepta.',
    'Reinicia Chrome: escribe chrome://restart en la barra de direcciones.',
  ],
  enable: 'Descargar activar-pantalla-completa.reg',
  disable: 'Descargar quitar-pantalla-completa.reg (para deshacerlo)',
  onlyChrome: 'Solo funciona con Chrome en Windows.',
} as const
