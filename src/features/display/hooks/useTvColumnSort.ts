import { KeyboardSensor, PointerSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type UniqueIdentifier } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo } from 'react'
import { TV_DRAG_ACTIVATION_DISTANCE } from '@/config/app'
import { TV_DND_TEXTS } from '@/features/display/config/tv'

/** Drag-and-drop wiring for the Modo TV columns (stable column ids): pointer + keyboard sensors, Spanish announcements. */
export function useTvColumnSort(ids: readonly string[], onMove: (from: number, to: number) => void) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: TV_DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const announcements = useMemo<Announcements>(() => {
    const position = (id: UniqueIdentifier | undefined) => ids.indexOf(String(id)) + 1
    return {
      onDragStart: ({ active }) => TV_DND_TEXTS.start(position(active.id)),
      onDragOver: ({ over }) => (over ? TV_DND_TEXTS.over(position(over.id)) : undefined),
      onDragEnd: ({ over }) => (over ? TV_DND_TEXTS.end(position(over.id)) : TV_DND_TEXTS.cancel),
      onDragCancel: () => TV_DND_TEXTS.cancel,
    }
  }, [ids])

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over) return
      onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    },
    [ids, onMove],
  )

  return { sensors, announcements, onDragEnd }
}
