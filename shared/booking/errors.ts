// Reasons a booking action is refused. The RPCs raise exactly these codes; the web and the app show the message.

export const BOOKING_ERROR_MESSAGES = {
  not_member: 'Tu cuenta no está activa. Habla con tu monitor.',
  not_allowed: 'No puedes hacer esto.',
  slot_not_found: 'Esta clase ya no existe.',
  slot_closed: 'Las reservas de esta clase están cerradas.',
  slot_cancelled: 'Esta clase se ha cancelado.',
  slot_started: 'Esta clase ya ha empezado.',
  slot_finished: 'Esta clase ya ha terminado.',
  too_far: 'Todavía no puedes reservar esta clase.',
  already_booked: 'Ya estás apuntado a esta clase.',
  quota_reached: 'Ya has usado tus clases de esta semana.',
  slot_full: 'La clase está completa.',
  waitlist_closed: 'La clase está completa y ya no hay lista de espera.',
  booking_not_found: 'No encontramos esta reserva.',
  client_not_found: 'No encontramos a este usuario.',
  unknown: 'Algo ha fallado. Inténtalo de nuevo.',
} as const

export type BookingErrorCode = keyof typeof BOOKING_ERROR_MESSAGES

export const BOOKING_ERROR_CODES = Object.keys(BOOKING_ERROR_MESSAGES) as BookingErrorCode[]

export function isBookingErrorCode(value: unknown): value is BookingErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BOOKING_ERROR_MESSAGES, value)
}

/** A raised code (e.g. a Postgres error message 'quota_reached') → its code; anything else → 'unknown'. */
export function toBookingErrorCode(value: unknown): BookingErrorCode {
  const text = typeof value === 'string' ? value.trim() : value
  return isBookingErrorCode(text) ? text : 'unknown'
}

export function bookingErrorMessage(value: unknown): string {
  return BOOKING_ERROR_MESSAGES[toBookingErrorCode(value)]
}
