import { newId } from '@/lib/ids'

/** Unique id of this browser tab/window, used to ignore our own sync messages. */
export const TAB_ID = newId('tab')

let topics = 0

/**
 * A live channel name of its own for each subscription. Removing a channel only finishes when the server answers;
 * until then the client hands that same dying channel to anyone asking for its name, and it would never deliver anything.
 */
export const uniqueChannelTopic = (name: string): string => `${name}-${TAB_ID}-${++topics}`
