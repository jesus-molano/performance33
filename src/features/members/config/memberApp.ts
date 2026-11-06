// Where the members' app lives (the performance33-socios project). Its /descargar page shows the QR that sends each
// phone to its store, or to the web version while the app is not published.

const DEFAULT_MEMBER_APP_URL = 'https://performance33-socios.vercel.app'
const DOWNLOAD_PATH = '/descargar'

export function memberAppDownloadUrl(base: string | undefined): string {
  const origin = (base?.trim() || DEFAULT_MEMBER_APP_URL).replace(/\/+$/, '')
  return `${origin}${DOWNLOAD_PATH}`
}

export const MEMBER_APP_DOWNLOAD_URL = memberAppDownloadUrl(import.meta.env.VITE_MEMBER_APP_URL)

/** Live changes of the members' accounts (the card on the user's page). */
export const MEMBERS_CHANNEL = 'p33-members'
/** A temporary password for the app lasts this long (schema.sql: profiles_remember_temp_password, 72 hours). */
export const MEMBER_TEMP_PASSWORD_HOURS = 72
