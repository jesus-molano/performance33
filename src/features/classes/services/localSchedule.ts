// Local test mode: classes made from the timetable, the timetable edits and the list of a day, as schema.sql does
// (ensure_class_slots, class_templates_sync, class_slots_for).

import { addGymDays, diffGymDays, gymTimeToMs, gymWeekday, toGymDate, type GymDate } from '@shared/booking'
import type { ClassDay, ClassTemplateInput, SlotSummary } from '@/features/classes/types'
import { bookedCount, checkClassFields, cloneState, type LocalBooking, type LocalClassesState, type RuleContext, type RuleResult } from './localState'

/** class_slots_for creates the timetable's classes up to this many days ahead (the most horizon_days allows). */
const ENSURE_MAX_DAYS = 60
const KEEPS_SLOT: ReadonlySet<LocalBooking['status']> = new Set(['booked', 'waitlisted', 'late_cancelled'])

/** Adds the timetable's classes of those days that do not exist yet and have not started (draft is changed). */
function ensureInto(state: LocalClassesState, from: GymDate, to: GymDate, ctx: RuleContext): void {
  const made = new Set(state.slots.map((s) => `${s.templateId}|${s.templateDate}`))
  for (let day = from; day <= to; day = addGymDays(day, 1)) {
    for (const template of state.templates) {
      if (!template.active || template.weekday !== gymWeekday(day) || made.has(`${template.id}|${day}`)) continue
      const startsAt = gymTimeToMs(day, template.startMinutes)
      if (startsAt <= ctx.now) continue
      made.add(`${template.id}|${day}`)
      state.slots.push({
        id: ctx.newId(),
        templateId: template.id,
        templateDate: day,
        startsAt,
        gymDate: toGymDate(startsAt),
        durationMinutes: template.durationMinutes,
        capacity: template.capacity,
        name: template.name,
        status: 'open',
        edited: false,
      })
    }
  }
}

export function ensureSlots(state: LocalClassesState, from: GymDate, to: GymDate, ctx: RuleContext): LocalClassesState {
  const next = cloneState(state)
  ensureInto(next, from, to, ctx)
  return next
}

/** The classes of one day with their counts and active bookings; the timetable's are created first. */
export function listDay(state: LocalClassesState, date: GymDate, ctx: RuleContext): RuleResult<ClassDay> {
  const next = cloneState(state)
  const today = toGymDate(ctx.now)
  if (date >= today && diffGymDays(today, date) <= ENSURE_MAX_DAYS) ensureInto(next, date, date, ctx)
  const slots: SlotSummary[] = next.slots
    .filter((s) => s.gymDate === date)
    .sort((a, b) => a.startsAt - b.startsAt || a.id.localeCompare(b.id))
    .map(({ templateDate: _templateDate, ...slot }) => ({
      ...slot,
      bookedCount: bookedCount(next, slot.id),
      waitlistCount: next.bookings.filter((b) => b.slotId === slot.id && b.status === 'waitlisted').length,
    }))
  const ids = new Set(slots.map((s) => s.id))
  const bookings = next.bookings.flatMap((b) =>
    ids.has(b.slotId) && (b.status === 'booked' || b.status === 'waitlisted')
      ? [{ id: b.id, slotId: b.slotId, clientId: b.clientId, status: b.status, forced: b.forced, queueOrder: b.queueOrder }]
      : [],
  )
  return { state: next, result: { slots, bookings } }
}

/** A timetable change takes its future classes nobody edited and nobody is in; the others stay as they are. */
function unschedule(state: LocalClassesState, templateId: string, now: number): void {
  const gone = new Set(
    state.slots
      .filter(
        (s) =>
          s.templateId === templateId &&
          !s.edited &&
          s.startsAt > now &&
          !state.bookings.some((b) => b.slotId === s.id && KEEPS_SLOT.has(b.status)),
      )
      .map((s) => s.id),
  )
  state.slots = state.slots.filter((s) => !gone.has(s.id))
  state.bookings = state.bookings.filter((b) => !gone.has(b.slotId))
}

const reschedule = (state: LocalClassesState, ctx: RuleContext) => {
  const today = toGymDate(ctx.now)
  ensureInto(state, today, addGymDays(today, state.settings.horizonDays), ctx)
}

/** Creates or updates timetable entries (an entry with an old id comes back, as when undoing a removal). */
export function saveTemplates(state: LocalClassesState, inputs: readonly ClassTemplateInput[], ctx: RuleContext): LocalClassesState {
  const next = cloneState(state)
  for (const input of inputs) {
    checkClassFields(input)
    const template = { ...input, id: input.id ?? ctx.newId(), name: input.name.trim() }
    const index = next.templates.findIndex((t) => t.id === template.id)
    if (index >= 0) {
      unschedule(next, template.id, ctx.now)
      next.templates[index] = template
    } else {
      next.templates.push(template)
    }
  }
  reschedule(next, ctx)
  return next
}

/** Classes that had people keep the class but lose the link to the timetable (on delete set null). */
export function removeTemplate(state: LocalClassesState, id: string, ctx: RuleContext): LocalClassesState {
  const next = cloneState(state)
  unschedule(next, id, ctx.now)
  next.templates = next.templates.filter((t) => t.id !== id)
  next.slots = next.slots.map((s) => (s.templateId === id ? { ...s, templateId: null } : s))
  return next
}
