// The TV windows of this laptop: bring them all here, close them all, and the automatic fullscreen (Ajustes → Pantallas).

/**
 * The Chrome policy that lets TV windows go fullscreen with no click (public/teles). Public files, harmless (they only
 * allow this app's address); the links are shown to admins only, because installing them needs a Windows admin.
 */
export const AUTO_FULLSCREEN_FILES = {
  enable: { href: `${import.meta.env.BASE_URL}teles/activar-pantalla-completa.reg`, name: 'activar-pantalla-completa.reg' },
  disable: { href: `${import.meta.env.BASE_URL}teles/quitar-pantalla-completa.reg`, name: 'quitar-pantalla-completa.reg' },
} as const

export const TV_WINDOWS_COPY = {
  bringAll: 'Traer al portátil',
  bringAllLabel: 'Traer todas las pantallas a este portátil',
  closeAll: 'Cerrar todas',
  closeAllLabel: 'Cerrar todas las pantallas de este portátil',
  broughtToast: 'Pantallas en el portátil',
  sendBack: 'Devolver a su sitio',
  closedToast: 'Pantallas cerradas',
  reopen: 'Abrir otra vez',
  /** With several windows closed: one per click (the browser opens one window per click). */
  reopenOne: (screen: number) => `Abrir Pantalla ${screen}`,
  reopenPending: (count: number) => (count === 1 ? 'Falta 1 pantalla por abrir' : `Faltan ${count} pantallas por abrir`),
  /** Ajustes → Pantallas, when the TVs are seen: each TV already has its own screen. */
  addAdvanced: 'Añadir otra pantalla',
  addAdvancedHint: 'No suele hacer falta: cada pantalla conectada se añade sola.',
  removeKeepsTv: 'Está conectada: no se puede quitar',
} as const

export const AUTO_FULLSCREEN_COPY = {
  label: 'Pantalla completa automática',
  on: 'Activada ✓',
  /** Admins, when it is already on: open the how-to again. */
  reinstall: 'Chrome bloquea las ventanas o hay que volver a instalarlo',
  off: 'Sin activar',
  /** Coaches: nothing to do, one click on the TV is enough. */
  offForCoaches: 'En cada pantalla, pulsa una vez «Pantalla completa».',
  adminIntro:
    'Para que las pantallas se abran sin que Chrome las bloquee y se pongan solas en pantalla completa, hazlo una vez en este portátil (si ya lo hiciste antes, repítelo: ahora también desbloquea las ventanas):',
  steps: [
    'Descarga y abre «activar-pantalla-completa.reg» y acepta.',
    'Reinicia Chrome: escribe chrome://restart en la barra de direcciones.',
  ],
  enable: 'Descargar activar-pantalla-completa.reg',
  disable: 'Descargar quitar-pantalla-completa.reg (para deshacerlo)',
  onlyChrome: 'Solo funciona con Chrome en Windows.',
  /** Firefox, Safari: they cannot do it at all, so no files to download. */
  unsupported: 'Este navegador no puede: usa Chrome.',
} as const
