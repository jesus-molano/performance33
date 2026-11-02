// Modo TV copy (column controls, drag to reorder, client picker).

export const TV_COLUMN_TEXTS = {
  fourColumnsNote: 'Con 4 columnas la letra es más pequeña',
  remove: '− columna',
  add: '+ columna',
  removeLabel: 'Quitar la última columna',
  addLabel: 'Añadir una columna',
  singular: 'columna',
  plural: 'columnas',
} as const

/** Screen reader copy for dragging columns (1-based positions). */
export const TV_DND_TEXTS = {
  instructions:
    'Pulsa espacio o intro para coger la columna. Usa las flechas izquierda y derecha para moverla y espacio o intro para soltarla. Escape cancela.',
  start: (position: number) => `Columna ${position} cogida.`,
  over: (position: number) => `Sobre la posición ${position}.`,
  end: (position: number) => `Columna soltada en la posición ${position}.`,
  cancel: 'Movimiento cancelado.',
} as const

export const TV_PICKER_TEXTS = {
  moveColumn: (position: number) => `Mover columna ${position}`,
  clientLabel: (position: number) => `Cliente de la columna ${position}`,
  dayLabel: (position: number) => `Día de la columna ${position}`,
  placeholder: 'Elige cliente…',
  searchPlaceholder: 'Busca por nombre…',
  noClient: 'Sin cliente',
  noRoutine: 'Sin rutina',
  noResults: 'Ningún cliente coincide',
} as const
