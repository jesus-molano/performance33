import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { POINTER_ACTIVATION_DISTANCE, TOUCH_ACTIVATION } from '@/features/editor/config'

export interface TouchActivation {
  delay: number
  tolerance: number
}

/**
 * Mouse + touch + keyboard sensors. MouseSensor (not PointerSensor) so touch input only goes
 * through TouchSensor and its long-press delay: a swipe still scrolls the page on phones.
 */
export function useSortableSensors(touchActivation: TouchActivation = TOUCH_ACTIVATION) {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: POINTER_ACTIVATION_DISTANCE } }),
    useSensor(TouchSensor, { activationConstraint: touchActivation }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}
