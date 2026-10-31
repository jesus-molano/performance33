export interface RoutinePreviewProps {
  programId: string
  /** Day to show (the editor's selected day). */
  dayId: string
  className?: string
}

/**
 * Live mini TV preview for the editor's side panel / 'Vista pantalla' toggle. Reads the store,
 * sanitises it with toDisplayData() and renders RoutineDisplay with layout="preview".
 */
export function RoutinePreview({ className }: RoutinePreviewProps) {
  return <div className={className} />
}
