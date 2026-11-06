// Where the TV screens live in the cloud (no private data in either table).

export const SCREENS_TABLES = { screens: 'screens', sections: 'screen_sections' } as const
export type ScreensTable = (typeof SCREENS_TABLES)[keyof typeof SCREENS_TABLES]

export const SCREENS_COLUMNS: Record<ScreensTable, string> = {
  screens: 'id,data',
  screen_sections: 'id,screen_id,data',
}

/** Live row changes (each subscription gets a topic of its own, see uniqueChannelTopic). */
export const SCREENS_CHANNEL = 'p33-screens'
/** Which TV windows are open: one private topic shared by every window of the gym, so it is never recreated (its policies are in schema.sql). */
export const SCREENS_PRESENCE_TOPIC = 'p33-screens-presence'

/** Last section this device sent someone to ('N:M'), for Ctrl+clic and long press. */
export const SCREENS_LAST_SEND_KEY = 'p33:screens:last-send:v1'
