import { newId } from '@/lib/ids'

/** Unique id of this browser tab/window, used to ignore our own sync messages. */
export const TAB_ID = newId('tab')
