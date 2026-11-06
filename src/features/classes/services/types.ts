// What the classes store needs from where classes live: the cloud functions and tables, or this browser in local test mode.
// Both apply the same rules (schema.sql in the cloud, localRules.ts here) and refuse with the same BookingErrorCode.

import { toBookingErrorCode, type BookingErrorCode, type BookingSettings, type GymDate } from '@shared/booking'
import type {
  AddBookingResult,
  ClassDay,
  ClassSchedule,
  ClassTemplateInput,
  ClientClasses,
  MoveBookingResult,
  NewSlotInput,
  RemoveBookingResult,
  SlotPatch,
  UpdateSlotResult,
} from '@/features/classes/types'

export interface ClassesService {
  /** The classes of that gym day (the timetable's are created first) and who holds a place in each. */
  loadDay: (date: GymDate) => Promise<ClassDay>
  loadSchedule: () => Promise<ClassSchedule>
  /** This week's count and the classes that have not ended yet. */
  loadClient: (clientId: string) => Promise<ClientClasses>
  addBooking: (slotId: string, clientId: string, force: boolean) => Promise<AddBookingResult>
  removeBooking: (bookingId: string) => Promise<RemoveBookingResult>
  moveBooking: (bookingId: string, toSlotId: string, force: boolean) => Promise<MoveBookingResult>
  updateSlot: (slotId: string, patch: SlotPatch) => Promise<UpdateSlotResult>
  createSlot: (input: NewSlotInput) => Promise<string>
  /** Admins only. */
  saveTemplates: (templates: ClassTemplateInput[]) => Promise<void>
  removeTemplate: (id: string) => Promise<void>
  saveSettings: (settings: BookingSettings) => Promise<void>
  /** Called when classes may have changed somewhere else. */
  subscribe: (onChange: () => void) => () => void
}

/** A refusal of the rules (full class, already booked…) or any other failure ('unknown'). */
export class ClassesError extends Error {
  readonly code: BookingErrorCode

  constructor(code: BookingErrorCode) {
    super(code)
    this.name = 'ClassesError'
    this.code = code
  }
}

export function classesErrorCode(error: unknown): BookingErrorCode {
  if (error instanceof ClassesError) return error.code
  return toBookingErrorCode(error instanceof Error ? error.message : error)
}
