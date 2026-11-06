// Modo TV copy (section controls, drag to reorder, client picker) and layout.

/** Space between the sections of a TV, so each person's part reads as its own. */
export const TV_SECTION_GAP = '0.75rem'

export const TV_COLUMN_TEXTS = {
  manySectionsNote: 'Con más de 3 secciones la letra es más pequeña',
  sizeAtLimit: 'No cabe más grande: la rutina más larga ya llena la pantalla',
  remove: '− sección',
  add: '+ sección',
  removeLabel: 'Quitar la última sección',
  addLabel: 'Añadir una sección',
  singular: 'sección',
  plural: 'secciones',
} as const

/** Screen reader copy for dragging sections (1-based positions). */
export const TV_DND_TEXTS = {
  instructions:
    'Pulsa espacio o intro para coger la sección. Usa las flechas para moverla y espacio o intro para soltarla. Escape cancela.',
  start: (position: number) => `Sección ${position} cogida.`,
  over: (position: number) => `Sobre la posición ${position}.`,
  end: (position: number) => `Sección soltada en la posición ${position}.`,
  cancel: 'Movimiento cancelado.',
} as const

export const TV_PICKER_TEXTS = {
  moveColumn: (position: number) => `Mover sección ${position}`,
  clientLabel: (position: number) => `Usuario de la sección ${position}`,
  dayLabel: (position: number) => `Día de la sección ${position}`,
  placeholder: 'Elige usuario…',
  searchPlaceholder: 'Busca por nombre…',
  noClient: 'Sin usuario',
  noRoutine: 'Sin rutina',
  noResults: 'Ningún usuario coincide',
} as const
