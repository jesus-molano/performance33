import { describe, expect, it } from 'vitest'
import { createDemoBackend } from './demo'

/** Monday 9 November 2026, 08:00 in the gym (winter: UTC+0). */
const MONDAY_8AM = Date.parse('2026-11-09T08:00:00Z')

async function signedIn() {
  const backend = createDemoBackend(() => MONDAY_8AM)
  await backend.signIn('laura.demo', 'demo')
  return backend
}

describe('demo backend', () => {
  it('refuses everything until signed in', async () => {
    const backend = createDemoBackend(() => MONDAY_8AM)
    await expect(backend.myBookings()).rejects.toThrow('Tu cuenta no está activa')
    expect(await backend.myMember()).toBeNull()
  })

  it('asks a "nuevo" account to change its temporary password', async () => {
    const backend = createDemoBackend(() => MONDAY_8AM)
    await backend.signIn('nuevo.demo', 'x')
    expect((await backend.myMember())?.must_change_password).toBe(true)
    await backend.changePassword('laura2026abc')
    expect((await backend.myMember())?.must_change_password).toBe(false)
  })

  it('books, refuses a second booking of the same class, and frees it on cancel', async () => {
    const backend = await signedIn()
    const slots = await backend.classSlots('2026-11-10', '2026-11-10')
    const open = slots.find((s) => s.booked_count < s.capacity && s.my_status === null)
    expect(open).toBeDefined()
    const booked = await backend.bookClass(open!.id)
    expect(booked.status).toBe('booked')
    await expect(backend.bookClass(open!.id)).rejects.toThrow('Ya estás apuntado')
    const cancelled = await backend.cancelBooking(booked.booking_id)
    expect(cancelled).toMatchObject({ status: 'cancelled', counts: false })
  })

  it('stops at the weekly classes of the plan', async () => {
    const backend = await signedIn()
    const slots = await backend.classSlots('2026-11-10', '2026-11-14')
    const open = slots.filter((s) => s.booked_count < s.capacity && s.my_status === null)
    const usage = (await backend.myWeekUsage())!
    for (const slot of open.slice(0, usage.quota! - usage.used)) await backend.bookClass(slot.id)
    expect((await backend.myWeekUsage())?.used).toBe(usage.quota)
    await expect(backend.bookClass(open[usage.quota! - usage.used].id)).rejects.toThrow('Ya has usado tus clases')
    // Next week is a fresh one.
    expect(await backend.myWeekUsage('2026-11-18')).toMatchObject({ week_start: '2026-11-16', used: 0 })
  })

  it('puts a full class on the waitlist', async () => {
    const backend = await signedIn()
    const full = (await backend.classSlots('2026-11-10', '2026-11-20')).find((s) => s.booked_count >= s.capacity)
    expect(full).toBeDefined()
    expect(await backend.bookClass(full!.id)).toMatchObject({ status: 'waitlisted', waitlist_position: 1 })
  })
})
