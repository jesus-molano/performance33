import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { POINTER_ACTIVATION_DISTANCE, TOUCH_ACTIVATION } from '@/features/editor/config'

/**
 * Mouse + touch + keyboard sensors. MouseSensor (not PointerSensor) so touch input only goes
 * through TouchSensor and its long-press delay: a swipe still scrolls the day strip on phones.
 */
export function useSortableSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE } }),
    useSensor(TouchSensor, { activationConstraint: TOUCH_ACTIVATION }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}
