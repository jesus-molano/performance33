// The members' accounts of schema.sql (the app): who they are, what they may read and book, and that they never see
// anything private. Runs on a real Postgres (PGlite), like schema.test.ts.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { BOOKING_RPC, MEMBER_RPC, toGymDate, type BookingRpcs, type MemberRpcs } from '../shared/booking/index.ts'
import { PGLITE_TIMEOUT_MS, SUPABASE_STUBS, sqlSession } from './testHarness.ts'

vi.setConfig({ testTimeout: PGLITE_TIMEOUT_MS, hookTimeout: PGLITE_TIMEOUT_MS })

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

const USER = {
  admin: '00000000-0000-4000-8000-0000000000a1',
  ana: '00000000-0000-4000-8000-0000000000a2',
  laura: '00000000-0000-4000-8000-0000000000b1',
  marta: '00000000-0000-4000-8000-0000000000b2',
  nuevo: '00000000-0000-4000-8000-0000000000b3',
  pausada: '00000000-0000-4000-8000-0000000000b4',
  archivado: '00000000-0000-4000-8000-0000000000b5',
  stranger: '00000000-0000-4000-8000-0000000000c1',
}

/** Clients: Laura and Marta have the app, Luis does not. */
const LAURA = 'c-laura'
const MARTA = 'c-marta'
const LUIS = 'c-luis'

let db: PGlite
const { asSuperuser, asPerson, asAnon, asService, rows, count } = sqlSession(() => db)

async function seed(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    truncate public.profiles, public.clients, public.programs, public.notes, public.settings, public.screens, public.screen_sections,
      public.library_exercises, public.login_attempts, public.row_history cascade;
    truncate public.training_sessions, public.bookings, public.class_slots, public.class_templates, public.notification_outbox,
      public.booking_settings, public.members cascade;
    insert into public.booking_settings (id) values ('main');
    delete from auth.users;
    insert into auth.users (id, email, encrypted_password) values
      ('${USER.admin}', 'admin@p33.test', 'h-admin'), ('${USER.ana}', 'ana@p33.test', 'h-ana'),
      ('${USER.laura}', 'laura@p33.test', 'h-laura'), ('${USER.marta}', 'x1@accounts.invalid', 'h-marta'),
      ('${USER.nuevo}', 'x2@accounts.invalid', 'h-temporal'), ('${USER.pausada}', 'x3@accounts.invalid', 'h-pausada'),
      ('${USER.archivado}', 'x4@accounts.invalid', 'h-archivado'), ('${USER.stranger}', 'nadie@p33.test', 'h-nadie');
    insert into public.profiles (user_id, username, email, name, role) values
      ('${USER.admin}', 'admin', 'admin@p33.test', 'Admin', 'admin'), ('${USER.ana}', 'ana', 'ana@p33.test', 'Ana', 'monitor');
    insert into public.clients (id, data) values
      ('${LAURA}', '{"firstName":"Laura","lastName":"Secreta","goal":"Privado","plan":"standard","currentProgramId":"p-laura"}'),
      ('${MARTA}', '{"firstName":"Marta","lastName":"Otra","plan":"plus"}'),
      ('${LUIS}', '{"firstName":"Luis","plan":"standard"}'),
      ('c-nuevo', '{"firstName":"Nuevo"}'), ('c-pausada', '{"firstName":"Pausada"}'),
      ('c-archivado', '{"firstName":"Archivado","archived":true}');
    insert into public.programs (id, data) values
      ('p-laura', '{"clientId":"${LAURA}","name":"Fuerza","days":[{"id":"d1","name":"Día 1","label":"Pierna","blocks":[]},{"id":"d2","name":"Día 2","label":"","blocks":[]}]}'),
      ('p-marta', '{"clientId":"${MARTA}","days":[]}');
    insert into public.notes (id, data, client_id) values ('n1', '{"text":"Lesión"}', '${LAURA}');
    insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
    insert into public.screens (id, data) values ('1', '{"name":"Pantalla 1","sections":3}');
    insert into public.members (user_id, client_id, username, email, must_change_password) values
      ('${USER.laura}', '${LAURA}', 'laura', 'laura@p33.test', false),
      ('${USER.marta}', '${MARTA}', 'marta', null, false),
      ('${USER.nuevo}', 'c-nuevo', 'nuevo', null, true),
      ('${USER.pausada}', 'c-pausada', 'pausada', null, false),
      ('${USER.archivado}', 'c-archivado', 'archivado', null, false);
    update public.members set active = false where username = 'pausada';
  `)
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUBS)
  await db.exec(SCHEMA)
})

afterAll(async () => {
  await db.close()
})

beforeEach(seed)

type AnyRpcs = BookingRpcs & MemberRpcs

async function rpc<K extends keyof AnyRpcs>(name: K, args: AnyRpcs[K]['args']): Promise<AnyRpcs[K]['result']> {
  const keys = Object.keys(args)
  const call = `select * from public.${name}(${keys.map((key, i) => `${key} => $${i + 1}`).join(', ')})`
  const result = await rows<Record<string, unknown>>(call, Object.values(args))
  const scalar = name === 'my_routine' || name === 'delete_my_bookings'
  return (scalar ? result[0][name] : result) as AnyRpcs[K]['result']
}

/** A class starting that many minutes from now. */
async function slotIn(minutes: number, capacity = 2, duration = 60): Promise<string> {
  await asSuperuser()
  const [row] = await rows<{ id: string }>(
    `insert into public.class_slots (starts_at, duration_minutes, capacity, name)
     values (date_trunc('minute', now()) + make_interval(mins => $1::int), $2, $3, 'Funcional') returning id`,
    [minutes, duration, capacity],
  )
  return row.id
}

async function book(who: string, slotId: string) {
  await asPerson(who)
  return (await rpc('book_class', { p_slot_id: slotId }))[0]
}

async function statusesOf(slotId: string): Promise<Array<[string, string]>> {
  await asSuperuser()
  const list = await rows<{ client_id: string; status: string }>(`select client_id, status from public.bookings where slot_id = $1 order by queue_order`, [slotId])
  return list.map((b) => [b.client_id, b.status])
}

const HOUR = 60
const DAY = 24 * HOUR

describe('members: one login, one kind of account', () => {
  it('a login is a coach or a member, never both, and usernames and emails are not shared between them', async () => {
    await asSuperuser()
    await expect(rows(`insert into public.members (user_id, client_id, username) values ($1, $2, 'otra')`, [USER.ana, LUIS])).rejects.toThrow(/email_taken/)
    await expect(rows(`insert into public.members (user_id, client_id, username) values ($1, $2, 'ana')`, [USER.stranger, LUIS])).rejects.toThrow(/username_taken/)
    await expect(rows(`insert into public.members (user_id, client_id, username, email) values ($1, $2, 'luis', 'ANA@p33.test')`, [USER.stranger, LUIS])).rejects.toThrow(/email_taken/)
    await expect(rows(`insert into public.profiles (user_id, username, name) values ($1, 'nueva', 'Nueva')`, [USER.laura])).rejects.toThrow(/email_taken/)
    await expect(rows(`insert into public.profiles (user_id, username, name) values ($1, ' LAURA ', 'Nueva')`, [USER.stranger])).rejects.toThrow(/username_taken/)
    await expect(rows(`update public.profiles set email = 'laura@p33.test' where username = 'ana'`)).rejects.toThrow(/email_taken/)
  })

  it('one account per user, with a lower-cased username of the same shape as the team', async () => {
    await asSuperuser()
    await expect(rows(`insert into public.members (user_id, client_id, username) values ($1, $2, 'laura2')`, [USER.stranger, LAURA])).rejects.toThrow(/client_id/)
    await expect(rows(`insert into public.members (user_id, client_id, username) values ($1, $2, 'con@arroba')`, [USER.stranger, LUIS])).rejects.toThrow(/members_username_check/)
    await rows(`insert into public.members (user_id, client_id, username, email) values ($1, $2, '  LUIS.G ', ' Luis@P33.test ')`, [USER.stranger, LUIS])
    expect(await rows(`select username, email from public.members where client_id = $1`, [LUIS])).toEqual([{ username: 'luis.g', email: 'luis@p33.test' }])
  })

  it('deleting the user takes the account and its login; deleting the login takes the account', async () => {
    await asPerson(USER.admin)
    await rows(`delete from public.clients where id = $1`, [LAURA])
    await asSuperuser()
    expect(await rows(`select 1 from public.members where username = 'laura'`)).toEqual([])
    expect(await rows(`select 1 from auth.users where id = $1`, [USER.laura])).toEqual([])
    await rows(`delete from auth.users where id = $1`, [USER.marta])
    expect(await rows(`select 1 from public.members where username = 'marta'`)).toEqual([])
    expect(await count('profiles')).toBe(2)
  })
})

describe('members: the first login', () => {
  it('until the temporary password is changed the account reads and books nothing', async () => {
    const slot = await slotIn(DAY)
    await asPerson(USER.nuevo)
    expect(await rows('select * from public.my_member()')).toMatchObject([{ username: 'nuevo', must_change_password: true, temporary_password_expired: false }])
    expect(await rows('select public.current_member_client_id() as id')).toEqual([{ id: null }])
    await expect(rpc('book_class', { p_slot_id: slot })).rejects.toThrow(/not_member/)
    await expect(rpc('my_routine', {})).rejects.toThrow(/not_member/)
    expect(await count('booking_settings')).toBe(0)
  })

  it('cannot be skipped by calling the function, and lifts once the password really changed', async () => {
    await asPerson(USER.nuevo)
    await expect(rows('select public.finish_member_password_change()')).rejects.toThrow(/password_not_changed/)
    await asSuperuser()
    await db.exec(`update auth.users set encrypted_password = 'h-suya' where id = '${USER.nuevo}'`)
    await asPerson(USER.nuevo)
    await rows('select public.finish_member_password_change()')
    expect(await rows('select * from public.my_member()')).toMatchObject([{ must_change_password: false }])
    expect(await rows('select public.current_member_client_id() as id')).toEqual([{ id: 'c-nuevo' }])
  })

  it('expires after 3 days, and a new temporary password starts again', async () => {
    await asSuperuser()
    await db.exec(`update auth.users set encrypted_password = 'h-suya' where id = '${USER.nuevo}'`)
    await db.exec(`update public.members set temp_password_expires_at = now() - interval '1 minute' where username = 'nuevo'`)
    await asPerson(USER.nuevo)
    expect(await rows('select temporary_password_expired from public.my_member()')).toEqual([{ temporary_password_expired: true }])
    await expect(rows('select public.finish_member_password_change()')).rejects.toThrow(/password_not_changed/)
    await asService()
    await rows(`update public.members set must_change_password = true where username = 'nuevo'`)
    const [row] = await rows<{ hash: string; hours: number }>(
      `select temp_password_hash as hash, round(extract(epoch from temp_password_expires_at - now()) / 3600)::int as hours from public.members where username = 'nuevo'`,
    )
    expect(row).toEqual({ hash: 'h-suya', hours: 72 })
  })

  it('a paused account, or one of an archived user, gets nothing at all', async () => {
    const slot = await slotIn(DAY)
    for (const who of [USER.pausada, USER.archivado]) {
      await asPerson(who)
      expect(await rows('select * from public.my_member()')).toEqual([])
      await expect(rpc('book_class', { p_slot_id: slot })).rejects.toThrow(/not_member/)
      await expect(rpc('class_slots_for', { p_from: toGymDate(Date.now()), p_to: toGymDate(Date.now()) })).rejects.toThrow(/not_allowed/)
    }
  })
})

describe('members: what they can see', () => {
  const PRIVATE_TABLES = ['clients', 'programs', 'notes', 'library_exercises', 'settings', 'screens', 'screen_sections', 'profiles', 'training_sessions', 'class_templates', 'class_slots']

  it('nothing of the gym: no users, routines, notes, screens, settings, team nor classes table', async () => {
    await asPerson(USER.laura)
    for (const table of PRIVATE_TABLES) expect(await count(table), table).toBe(0)
    for (const table of ['row_history', 'notification_outbox', 'login_attempts']) await expect(count(table), table).rejects.toThrow(/permission denied/)
    expect(await rows('select * from public.team_accounts()')).toEqual([])
    expect(await rows('select * from public.my_profile()')).toEqual([])
  })

  it('cannot use the presence of the screens', async () => {
    await asPerson(USER.laura)
    await db.exec(`select set_config('realtime.topic', 'p33-screens-presence', false)`)
    await expect(rows(`insert into realtime.messages (topic, extension, payload) values ('p33-screens-presence', 'presence', '{}')`)).rejects.toThrow(/row-level security/)
    await asSuperuser()
    await db.exec(`insert into realtime.messages (topic, extension, payload) values ('p33-screens-presence', 'presence', '{}')`)
    await asPerson(USER.laura)
    expect(await rows('select * from realtime.messages')).toEqual([])
    await db.exec(`select set_config('realtime.topic', '', false)`)
  })

  it('only their own account, without the hash, and only their own bookings', async () => {
    const slot = await slotIn(DAY, 5)
    await book(USER.laura, slot)
    await book(USER.marta, slot)
    await asPerson(USER.laura)
    expect(await rows('select username from public.members')).toEqual([{ username: 'laura' }])
    await expect(rows('select temp_password_hash from public.members')).rejects.toThrow(/permission denied/)
    expect(await rows('select client_id from public.bookings')).toEqual([{ client_id: LAURA }])
    expect(await count('booking_settings')).toBe(1)
  })

  it('writes nothing directly: not their account, not bookings, not users', async () => {
    const slot = await slotIn(DAY)
    await asPerson(USER.laura)
    await expect(rows(`update public.members set active = true`)).rejects.toThrow(/permission denied/)
    await expect(rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'booked')`, [slot, LAURA])).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.clients set data = '{}' where id = $1`, [LAURA])).resolves.toEqual([])
    await expect(rows(`insert into public.clients (id, data) values ('x', '{"firstName":"X"}')`)).rejects.toThrow(/row-level security/)
    await expect(rows(`update public.booking_settings set horizon_days = 60`)).resolves.toEqual([])
  })

  it('none of the staff functions nor the inner ones', async () => {
    const slot = await slotIn(DAY)
    await asPerson(USER.laura)
    await expect(rpc(BOOKING_RPC.staffAddBooking, { p_slot_id: slot, p_client_id: LAURA })).rejects.toThrow(/not_allowed/)
    await expect(rpc(BOOKING_RPC.staffWeekUsage, { p_client_id: MARTA, p_week: toGymDate(Date.now()) })).rejects.toThrow(/not_allowed/)
    for (const call of [`select public.public_program('p', '{}')`, `select public.require_member()`, `select public.waitlist_position(gen_random_uuid())`]) {
      await expect(rows(call), call).rejects.toThrow(/permission denied/)
    }
  })

  it('the team sees every account of the app (never the hash) and cannot write them either', async () => {
    await asPerson(USER.ana)
    expect((await rows<{ username: string }>('select username from public.members order by username')).map((m) => m.username)).toEqual([
      'archivado', 'laura', 'marta', 'nuevo', 'pausada',
    ])
    await expect(rows('select temp_password_hash from public.members')).rejects.toThrow(/permission denied/)
    await expect(rows(`delete from public.members`)).rejects.toThrow(/permission denied/)
    await expect(rpc('my_bookings', {})).rejects.toThrow(/not_member/)
  })

  it("only signed-in people may call the members' functions; anonymous visitors none", async () => {
    await asSuperuser()
    const grants = await rows<{ name: string; anon: boolean; signed: boolean }>(
      `select p.proname as name, has_function_privilege('anon', p.oid, 'execute') as anon,
         has_function_privilege('authenticated', p.oid, 'execute') as signed
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = any($1) order by p.proname`,
      [Object.values(MEMBER_RPC)],
    )
    expect(grants.map((g) => g.name)).toEqual([...Object.values(MEMBER_RPC)].sort())
    for (const grant of grants) expect(grant, grant.name).toMatchObject({ anon: false, signed: true })
    await asAnon()
    await expect(count('members')).rejects.toThrow(/permission denied/)
  })
})

describe('members: the classes they can book', () => {
  it('lists from today up to the booking horizon only, with their own booking in my_status', async () => {
    await asPerson(USER.admin)
    await rows(`update public.booking_settings set horizon_days = 3`)
    const soon = await slotIn(DAY, 5)
    await slotIn(10 * DAY, 5)
    const mine = await book(USER.laura, soon)
    await book(USER.marta, soon)
    const today = toGymDate(Date.now())
    const later = toGymDate(Date.now() + 20 * DAY * 60_000)
    await asPerson(USER.laura)
    const list = await rpc('class_slots_for', { p_from: toGymDate(Date.now() - 5 * DAY * 60_000), p_to: later })
    expect(list.map((s) => [s.id, s.booked_count, s.my_status, s.my_booking_id])).toEqual([[soon, 2, 'booked', mine.booking_id]])
    await asPerson(USER.ana)
    const staff = await rpc('class_slots_for', { p_from: today, p_to: later })
    expect(staff.map((s) => s.my_status)).toEqual([null, null])
  })

  it('books with places left, then the waitlist with its turn, and never twice', async () => {
    const slot = await slotIn(DAY, 1)
    expect(await book(USER.laura, slot)).toMatchObject({ status: 'booked', waitlist_position: null })
    expect(await book(USER.marta, slot)).toMatchObject({ status: 'waitlisted', waitlist_position: 1 })
    await expect(book(USER.marta, slot)).rejects.toThrow(/already_booked/)
    expect(await statusesOf(slot)).toEqual([[LAURA, 'booked'], [MARTA, 'waitlisted']])
  })

  it('a full class shortly before it starts, or without waitlist, refuses', async () => {
    const soon = await slotIn(20, 1)
    await book(USER.laura, soon)
    await expect(book(USER.marta, soon)).rejects.toThrow(/waitlist_closed/)
    await asPerson(USER.admin)
    await rows(`update public.booking_settings set waitlist_enabled = false`)
    const later = await slotIn(DAY, 1)
    await book(USER.laura, later)
    await expect(book(USER.marta, later)).rejects.toThrow(/slot_full/)
  })

  it('refuses classes cancelled, started, over, closed, too far or missing', async () => {
    const cancelled = await slotIn(DAY)
    const closed = await slotIn(DAY)
    await asSuperuser()
    await rows(`update public.class_slots set status = 'cancelled' where id = $1`, [cancelled])
    await rows(`update public.class_slots set status = 'closed' where id = $1`, [closed])
    const started = await slotIn(-10)
    const over = await slotIn(-120)
    const far = await slotIn(15 * DAY)
    for (const [slot, code] of [
      [cancelled, 'slot_cancelled'], [closed, 'slot_closed'], [started, 'slot_started'], [over, 'slot_finished'], [far, 'too_far'],
      ['00000000-0000-4000-8000-00000000dead', 'slot_not_found'],
    ]) {
      await expect(book(USER.laura, slot), code).rejects.toThrow(new RegExp(code))
    }
  })

  it('stops at the weekly classes of the plan, waitlist included', async () => {
    await asSuperuser()
    const [{ monday }] = await rows<{ monday: string }>(`select (public.gym_week_start(public.gym_today()) + 7)::text as monday`)
    const slots: string[] = []
    for (const day of [0, 1, 2, 3]) {
      const [row] = await rows<{ id: string }>(
        `insert into public.class_slots (starts_at, duration_minutes, capacity, name)
         values (public.gym_time_to_instant($1::date + $2::int, '10:00'), 60, 1, 'Funcional') returning id`,
        [monday, day],
      )
      slots.push(row.id)
    }
    await book(USER.laura, slots[0])
    await book(USER.laura, slots[1])
    await expect(book(USER.laura, slots[2])).rejects.toThrow(/quota_reached/)
    await book(USER.marta, slots[3])
    await expect(book(USER.laura, slots[3])).rejects.toThrow(/quota_reached/)
    await asPerson(USER.laura)
    expect(await rpc('my_week_usage', { p_week: monday })).toMatchObject([{ used: 2, quota: 2 }])
  })

  it('locks the person and then the class, like the coaches', async () => {
    const slot = await slotIn(DAY, 1)
    await asPerson(USER.laura)
    await db.exec('begin')
    await rpc('book_class', { p_slot_id: slot })
    await asSuperuser()
    const [locks] = await rows<{ person: boolean; slot: boolean }>(
      `select (select xmax::text from public.clients where id = $1) = pg_current_xact_id()::text as person,
         (select xmax::text from public.class_slots where id = $2) = pg_current_xact_id()::text as slot`,
      [LAURA, slot],
    )
    await db.exec('commit')
    expect(locks).toEqual({ person: true, slot: true })
  })
})

describe('members: cancelling', () => {
  it('in time it does not count; late it does, and the waitlist gets the place', async () => {
    const early = await slotIn(DAY, 1)
    const { booking_id: first } = await book(USER.laura, early)
    await asPerson(USER.laura)
    expect(await rpc('cancel_booking', { p_booking_id: first })).toEqual([{ booking_id: first, status: 'cancelled', counts: false, promoted: 0 }])

    const late = await slotIn(90, 1)
    const { booking_id } = await book(USER.laura, late)
    await book(USER.marta, late)
    await asPerson(USER.laura)
    expect(await rpc('cancel_booking', { p_booking_id: booking_id })).toEqual([{ booking_id, status: 'late_cancelled', counts: true, promoted: 1 }])
    expect(await statusesOf(late)).toEqual([[LAURA, 'late_cancelled'], [MARTA, 'booked']])
    await asSuperuser()
    expect(await rows(`select kind, client_id from public.notification_outbox`)).toEqual([{ kind: 'promoted', client_id: MARTA }])
  })

  it('leaving the waitlist never counts; once the class started, nothing changes', async () => {
    const slot = await slotIn(60, 1)
    await book(USER.laura, slot)
    const { booking_id } = await book(USER.marta, slot)
    await asPerson(USER.marta)
    expect((await rpc('cancel_booking', { p_booking_id: booking_id }))[0]).toMatchObject({ status: 'cancelled', counts: false })
    const started = await slotIn(5)
    const { booking_id: inClass } = await book(USER.laura, started)
    await asSuperuser()
    await rows(`update public.class_slots set starts_at = date_trunc('minute', now()) - interval '1 minute' where id = $1`, [started])
    await asPerson(USER.laura)
    await expect(rpc('cancel_booking', { p_booking_id: inClass })).rejects.toThrow(/slot_started/)
  })

  it('only their own bookings', async () => {
    const slot = await slotIn(DAY, 3)
    const { booking_id } = await book(USER.marta, slot)
    await asPerson(USER.laura)
    await expect(rpc('cancel_booking', { p_booking_id: booking_id })).rejects.toThrow(/booking_not_found/)
  })
})

describe('members: their bookings, their routine and leaving', () => {
  it('lists what is coming, with the turn in each waitlist and the classes the gym cancelled', async () => {
    const full = await slotIn(2 * DAY, 1)
    const cancelled = await slotIn(3 * DAY, 3)
    await book(USER.marta, full)
    const { booking_id } = await book(USER.laura, full)
    await book(USER.laura, cancelled)
    await asPerson(USER.ana)
    await rpc(BOOKING_RPC.staffUpdateSlot, { p_slot_id: cancelled, p_status: 'cancelled' })
    await asPerson(USER.laura)
    const mine = await rpc('my_bookings', {})
    expect(mine.map((b) => [b.slot_id, b.status, b.slot_status, b.waitlist_position])).toEqual([
      [full, 'waitlisted', 'open', 1],
      [cancelled, 'slot_cancelled', 'cancelled', null],
    ])
    expect(mine[0].booking_id).toBe(booking_id)
  })

  it('my routine is the current one, filtered, with the recent sessions; never someone else\'s', async () => {
    await asSuperuser()
    await rows(`insert into public.training_sessions (client_id, gym_date, program_id, day_id, day_number) values ($1, public.gym_today() - 1, 'p-laura', 'd1', 1)`, [LAURA])
    await asPerson(USER.laura)
    const routine = await rpc('my_routine', {})
    expect(routine.program).toMatchObject({ id: 'p-laura', name: 'Fuerza', days: [{ id: 'd1', label: 'Pierna', blocks: [] }, { id: 'd2' }] })
    expect(routine.sessions).toEqual([expect.objectContaining({ client_id: LAURA, day_id: 'd1', day_number: 1, program_id: 'p-laura' })])
    const text = JSON.stringify(routine)
    for (const secret of ['Secreta', 'Privado', 'Lesión', 'goal', 'internalNote', 'createdBy']) expect(text).not.toContain(secret)
    await asSuperuser()
    await rows(`update public.clients set data = data || '{"currentProgramId":"p-marta"}' where id = $1`, [LAURA])
    await asPerson(USER.laura)
    expect((await rpc('my_routine', {})).program).toBeNull()
  })

  it('my account says only the first name, the plan and the login', async () => {
    await asPerson(USER.laura)
    expect(await rows('select * from public.my_member()')).toEqual([
      { client_id: LAURA, username: 'laura', email: 'laura@p33.test', first_name: 'Laura', color: null, plan: 'standard', must_change_password: false, temporary_password_expired: false },
    ])
  })

  it('deleting my account frees my future places (the waitlist moves) and keeps the past', async () => {
    await asPerson(USER.admin)
    await rows(`update public.booking_settings set quota_standard_rule = 'unlimited', quota_standard = null`)
    const past = await slotIn(-120, 3)
    await asSuperuser()
    await rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'booked')`, [past, LAURA])
    const full = await slotIn(DAY, 1)
    const other = await slotIn(2 * DAY, 3)
    await book(USER.laura, full)
    await book(USER.marta, full)
    await book(USER.laura, other)
    await asPerson(USER.laura)
    expect(await rpc('delete_my_bookings', {})).toBe(2)
    expect(await statusesOf(full)).toEqual([[LAURA, 'cancelled'], [MARTA, 'booked']])
    expect(await statusesOf(other)).toEqual([[LAURA, 'cancelled']])
    expect(await statusesOf(past)).toEqual([[LAURA, 'booked']])
    await asPerson(USER.ana)
    await expect(rpc('delete_my_bookings', {})).rejects.toThrow(/not_member/)
  })
})

describe('members: running the file again', () => {
  it('keeps every account', async () => {
    await asSuperuser()
    const before = await rows('select * from public.members order by id')
    await db.exec(SCHEMA)
    expect(await rows('select * from public.members order by id')).toEqual(before)
  })
})
