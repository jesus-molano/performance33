// Runs schema.sql on a real Postgres (PGlite) with stand-ins for what Supabase provides
// (auth schema, roles, realtime publication) and checks the access rules as each kind of user.

import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TV_MAX_SCREENS, TV_MAX_SECTIONS, TV_MIN_SECTIONS, TV_SCREEN_NAME_MAX_LENGTH } from '../src/config/app.ts'
import {
  BOOKING_DEFAULTS,
  BOOKING_ERROR_CODES,
  BOOKING_LIMITS,
  BOOKING_STATUSES,
  FILL_LEAD_MINUTES,
  GYM_TIME_ZONE,
  NOTIFICATION_KINDS,
  SLOT_LIST_MAX_DAYS,
  SLOT_STATUSES,
  addGymDays,
  bookingSettingsFromRow,
  gymMonday,
  gymTimeToMs,
  gymWeekday,
  toGymDate,
  type BookingRpcs,
  type BookingSettingsValues,
} from '../shared/booking/index.ts'
import { SESSION_CASE_PEOPLE, SESSION_CASES } from '../shared/routine/sessionCases.ts'
import { SESSION_UNDO_MINUTES } from '../shared/routine/index.ts'
import { PGLITE_TIMEOUT_MS, SUPABASE_STUBS, sqlSession } from './testHarness.ts'

vi.setConfig({ testTimeout: PGLITE_TIMEOUT_MS, hookTimeout: PGLITE_TIMEOUT_MS })

const SCHEMA = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')
/** The schema the live project has now (commit b6fe693, with the TV screens): this file is run over it there. */
const PREVIOUS_SCHEMA = readFileSync(new URL('./fixtures/schema.previous.sql', import.meta.url), 'utf8')

const ID = {
  admin: '00000000-0000-4000-8000-000000000001',
  ana: '00000000-0000-4000-8000-000000000002',
  ben: '00000000-0000-4000-8000-000000000003',
  stranger: '00000000-0000-4000-8000-000000000004',
  newbie: '00000000-0000-4000-8000-000000000005',
  former: '00000000-0000-4000-8000-000000000006',
}

const ADMIN = ID.admin
const ANA = ID.ana
const BEN = ID.ben
const STRANGER = ID.stranger
const NEWBIE = ID.newbie
const FORMER = ID.former

const GOOGLE_AMR = [{ method: 'oauth', timestamp: 1 }]

let db: PGlite

const { asSuperuser, asPerson, asAnon, asService, rows, count, affected } = sqlSession(() => db)

const profileId = async (username: string): Promise<string> => {
  await asSuperuser()
  return (await rows<{ id: string }>('select id from public.profiles where username = $1', [username]))[0].id
}

const setPassword = (user: string, hash: string) => db.exec(`update auth.users set encrypted_password = '${hash}' where id = '${user}'`)

const connectGoogle = (user: string, email: string) =>
  db.query(`insert into auth.identities (user_id, provider, identity_data) values ($1, 'google', $2)`, [user, JSON.stringify({ email })])

async function seedPeople(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    truncate public.row_history, public.profiles, public.login_attempts, public.clients, public.programs, public.library_exercises, public.notes, public.settings, public.screens, public.screen_sections cascade;
    truncate public.training_sessions, public.bookings, public.class_slots, public.class_templates, public.notification_outbox, public.booking_settings cascade;
    insert into public.booking_settings (id) values ('main');
    delete from auth.users;
    delete from auth.refresh_tokens;
    delete from auth.identities;
    insert into auth.users (id, email, encrypted_password) values
      ('${ID.admin}', 'admin@p33.test', 'hash-admin'),
      ('${ID.ana}', 'ana@p33.test', 'hash-ana'),
      ('${ID.ben}', 'ben@accounts.invalid', 'hash-ben'),
      ('${ID.stranger}', 'stranger@p33.test', 'hash-stranger'),
      ('${ID.newbie}', 'newbie@accounts.invalid', 'hash-temporal'),
      ('${ID.former}', 'former@p33.test', 'hash-former');
    insert into public.profiles (user_id, username, email, name, role, must_change_password) values
      ('${ID.admin}', 'admin', 'admin@p33.test', 'Admin', 'admin', false),
      ('${ID.ana}', 'ana', 'ana@p33.test', 'Ana', 'monitor', false),
      ('${ID.ben}', 'ben', null, 'Ben', 'monitor', false),
      ('${ID.newbie}', 'newbie', 'newbie@p33.test', 'Novata', 'monitor', true),
      ('${ID.former}', 'former', 'former@p33.test', 'Antigua', 'monitor', false);
    update public.profiles set active = false where username = 'former';
    insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}');
    insert into public.programs (id, data) values ('p1', '{"clientId":"c1"}');
    insert into public.library_exercises (id, data) values ('l1', '{"name":"Remo"}');
    insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
    insert into public.screens (id, data) values ('1', '{"name":"Pantalla 1","sections":3}');
    insert into public.screen_sections (id, screen_id, data) values ('1:1', '1', '{"clientId":"c1","day":2,"assignedAt":"2026-11-06T10:00:00.000Z"}');
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

beforeEach(seedPeople)

describe('schema.sql', () => {
  it('refuses to run over the previous version instead of leaving a mix', async () => {
    const old = new PGlite()
    await old.exec(SUPABASE_STUBS)
    await old.exec('create table public.staff (id uuid primary key)')
    await expect(old.exec(SCHEMA)).rejects.toThrow(/versión anterior/)
    await old.close()
  })

  it('can run twice without failing', async () => {
    await asSuperuser()
    await expect(db.exec(SCHEMA)).resolves.toBeDefined()
  })

  it('creates no account by itself: the first admin is added on purpose', async () => {
    const fresh = new PGlite()
    await fresh.exec(SUPABASE_STUBS)
    await fresh.exec(SCHEMA)
    const { rows: profiles } = await fresh.query('select 1 from public.profiles')
    await fresh.close()
    expect(profiles).toEqual([])
  })

  it('the bootstrap of the README works, without being asked to change the password', async () => {
    await asSuperuser()
    await db.exec(`
      insert into public.profiles (user_id, username, name, email, role)
      select id, 'jefa', 'Jefa', email, 'admin' from auth.users where email = 'stranger@p33.test';
    `)
    await asPerson(STRANGER)
    expect(await rows('select * from public.my_profile()')).toMatchObject([{ username: 'jefa', role: 'admin', must_change_password: false }])
    expect(await rows('select public.is_admin() as ok')).toEqual([{ ok: true }])
  })

  it('keeps names short, colours as plain hex, and no two people with one name', async () => {
    await asPerson(ANA)
    await expect(rows(`update public.profiles set color = 'url(https://evil.test/x)' where username is not null`)).rejects.toThrow()
    await expect(rows(`update public.profiles set name = repeat('a', 31) where id = public.current_profile_id()`)).rejects.toThrow(/name/)
    await expect(rows(`update public.profiles set name = '   ' where id = public.current_profile_id()`)).rejects.toThrow(/name/)
    for (const lookalike of ['Ad\u200Bmin', 'Admin\u00A0', 'Ad\u202Emin']) {
      await expect(rows('update public.profiles set name = $1 where id = public.current_profile_id()', [lookalike])).rejects.toThrow(/name/)
    }
    await expect(rows(`update public.profiles set name = ' admin ' where id = public.current_profile_id()`)).rejects.toThrow(/profiles_name_unique/)
  })

  it('refuses roles that do not exist and malformed usernames', async () => {
    await asSuperuser()
    await expect(db.exec(`update public.profiles set role = 'jefe' where username = 'ana'`)).rejects.toThrow(/role/)
    await expect(db.exec(`update public.profiles set username = 'con@arroba' where username = 'ana'`)).rejects.toThrow(/username/)
  })

  it('usernames and emails are unique and lower-cased', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set username = '  ANITA ', email = '  ANA@P33.test ' where username = 'ana'`)
    expect(await rows(`select email from public.profiles where username = 'anita'`)).toEqual([{ email: 'ana@p33.test' }])
    await expect(db.exec(`update public.profiles set username = 'anita' where username = 'ben'`)).rejects.toThrow(/username/)
    await expect(db.exec(`update public.profiles set email = 'ana@p33.test' where username = 'ben'`)).rejects.toThrow(/email/)
  })

  it('publishes every table for realtime, but never the login attempts nor the notices', async () => {
    await asSuperuser()
    const tables = await rows<{ tablename: string }>(
      `select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename`,
    )
    expect(tables.map((t) => t.tablename)).toEqual([
      'booking_settings', 'bookings', 'class_slots', 'class_templates', 'clients', 'library_exercises', 'members', 'notes', 'profiles', 'programs',
      'screen_sections', 'screens', 'settings', 'training_sessions',
    ])
  })
})

describe('my_profile', () => {
  it('returns the account of whoever is signed in', async () => {
    await asPerson(ANA)
    expect(await rows('select * from public.my_profile()')).toMatchObject([{ username: 'ana', email: 'ana@p33.test', role: 'monitor' }])
  })

  it('returns nothing for a login with no account, or a deactivated one', async () => {
    await asPerson(STRANGER)
    expect(await rows('select * from public.my_profile()')).toEqual([])
    await asPerson(FORMER)
    expect(await rows('select * from public.my_profile()')).toEqual([])
  })

  it('tells whoever is on a temporary password', async () => {
    await asPerson(NEWBIE)
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: true }])
  })

  it('does not ask it of someone who entered with the Google account of their email', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'Newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: false }])
    await asPerson(NEWBIE, ['oauth'])
    expect(await rows('select must_change_password from public.my_profile()')).toEqual([{ must_change_password: false }])
  })
})

describe('temporary passwords', () => {
  it('nothing can be read or written until it is changed', async () => {
    await asPerson(NEWBIE)
    for (const table of ['profiles', 'clients', 'programs', 'library_exercises', 'notes', 'settings']) {
      expect(await (table === 'profiles' ? rows('select id from public.profiles') : rows(`select id from public.${table}`))).toEqual([])
    }
    await expect(rows(`insert into public.clients (id, data) values ('x', '{}')`)).rejects.toThrow(/row-level security/)
    expect(await affected(`update public.profiles set name = 'Otro' where true`)).toBe(0)
    expect(await rows('select public.current_profile_id() as id')).toEqual([{ id: null }])
  })

  it('the same account entering with the Google account of its email can read everything', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await count('clients')).toBe(1)
  })

  it('a Google account connected by hand does not skip the step', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'intruso@gmail.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await count('clients')).toBe(0)
    expect(await rows('select must_change_password, google_connected from public.my_profile()')).toEqual([{ must_change_password: true, google_connected: true }])
  })

  it('a password session on the same account gets nothing from Google', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE)
    expect(await count('clients')).toBe(0)
  })

  it('a new password removes the Google accounts connected by hand, not the one of the email', async () => {
    await asSuperuser()
    await connectGoogle(NEWBIE, 'intruso@gmail.test')
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await connectGoogle(BEN, 'ben@gmail.test')
    await asPerson(ADMIN)
    await expect(rows(`select public.remove_other_google_identities('${NEWBIE}')`)).rejects.toThrow(/permission denied/)
    await asService()
    await rows(`select public.remove_other_google_identities('${NEWBIE}')`)
    await asSuperuser()
    expect(await rows(`select identity_data ->> 'email' as email from auth.identities where user_id = '${NEWBIE}'`)).toEqual([{ email: 'newbie@p33.test' }])
    expect(await rows(`select 1 from auth.identities where user_id = '${BEN}'`)).toHaveLength(1)
  })

  it('caduca a los 3 días: ya no sirve para crear la definitiva', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set temp_password_expires_at = now() - interval '1 minute' where username = 'newbie'`)
    await setPassword(NEWBIE, 'hash-nueva')
    await asPerson(NEWBIE)
    expect(await rows('select temporary_password_expired from public.my_profile()')).toEqual([{ temporary_password_expired: true }])
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
    expect(await count('clients')).toBe(0)
  })

  it('caducada, quien entra con la cuenta de Google de su email sí puede crear una contraseña', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set temp_password_expires_at = now() - interval '1 minute' where username = 'newbie'`)
    await setPassword(NEWBIE, 'hash-nueva')
    await connectGoogle(NEWBIE, 'newbie@p33.test')
    await asPerson(NEWBIE, GOOGLE_AMR)
    expect(await rows('select has_own_password, temporary_password_expired from public.my_profile()')).toEqual([{ has_own_password: false, temporary_password_expired: false }])
    await rows('select public.finish_password_change()')
    expect(await rows('select has_own_password from public.my_profile()')).toEqual([{ has_own_password: true }])
  })

  it('a new temporary password starts a new period, and the flag going away clears it', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set must_change_password = true where username = 'newbie'`)
    expect(await rows(`select temp_password_expires_at > now() + interval '71 hours' as fresh from public.profiles where username = 'newbie'`)).toEqual([{ fresh: true }])
    await db.exec(`update public.profiles set must_change_password = false where username = 'newbie'`)
    expect(await rows(`select temp_password_expires_at from public.profiles where username = 'newbie'`)).toEqual([{ temp_password_expires_at: null }])
  })

  it('cannot be skipped by just calling the function', async () => {
    await asPerson(NEWBIE)
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
    expect(await count('clients')).toBe(0)
  })

  it('lifts the flag once the password has really changed', async () => {
    await asSuperuser()
    await setPassword(ID.newbie, 'hash-propia')
    await asPerson(NEWBIE)
    await rows('select public.finish_password_change()')
    expect(await count('clients')).toBe(1)
    await asSuperuser()
    expect(await rows(`select must_change_password, temp_password_hash from public.profiles where username = 'newbie'`)).toEqual([
      { must_change_password: false, temp_password_hash: null },
    ])
  })

  it('a reset remembers the new temporary password, also when it was already pending', async () => {
    await asSuperuser()
    await setPassword(ID.newbie, 'hash-otra-temporal')
    await asService()
    await rows(`update public.profiles set must_change_password = true where username = 'newbie'`)
    await asPerson(NEWBIE)
    await expect(rows('select public.finish_password_change()')).rejects.toThrow(/password_not_changed/)
  })

  it('nobody can read the hash, nor anyone else clear the flag', async () => {
    await asPerson(ANA)
    await expect(rows('select temp_password_hash from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows('select must_change_password from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.profiles set must_change_password = false where true`)).rejects.toThrow(/permission denied/)
  })
})

describe('people without access', () => {
  const TABLES = [
    'clients', 'programs', 'library_exercises', 'notes', 'settings', 'screens', 'screen_sections',
    'booking_settings', 'class_templates', 'class_slots', 'bookings',
  ]

  for (const [label, enter] of [
    ['a signed-in stranger', () => asPerson(STRANGER)],
    ['a deactivated coach', () => asPerson(FORMER)],
  ] as const) {
    it(`${label} sees nothing and can write nothing`, async () => {
      await enter()
      for (const table of TABLES) expect(await count(table)).toBe(0)
      expect(await rows('select id from public.profiles')).toEqual([])
      await expect(rows(`insert into public.clients (id, data) values ('x', '{}')`)).rejects.toThrow(/row-level security/)
      await expect(rows(`insert into public.settings (id, data) values ('main', '{}')`)).rejects.toThrow(/row-level security/)
      expect(await affected(`update public.clients set data = '{}' where id = 'c1'`)).toBe(0)
      expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(0)
      expect(await rows('select * from public.team_accounts()')).toEqual([])
    })
  }

  it('anonymous visitors have no permissions at all', async () => {
    await asAnon()
    for (const table of [...TABLES, 'login_attempts', 'notification_outbox']) await expect(count(table)).rejects.toThrow(/permission denied/)
    await expect(rows('select id from public.profiles')).rejects.toThrow(/permission denied/)
    await expect(rows('select * from public.my_profile()')).rejects.toThrow(/permission denied/)
    await expect(rows('select * from public.team_accounts()')).rejects.toThrow(/permission denied/)
  })
})

describe('accounts', () => {
  it('the team only sees of each other what signs a note', async () => {
    await asPerson(ANA)
    expect(await rows(`select name, color, role, active from public.profiles where name = 'Ben'`)).toHaveLength(1)
    for (const column of ['email', 'username', 'user_id', 'temp_password_hash', 'temp_password_expires_at', 'must_change_password']) {
      await expect(rows(`select ${column} from public.profiles`), column).rejects.toThrow(/permission denied/)
    }
    await expect(rows('select * from public.profiles')).rejects.toThrow(/permission denied/)
  })

  it('only admins get the list with emails and usernames', async () => {
    await asPerson(ANA)
    expect(await rows('select * from public.team_accounts()')).toEqual([])
    await asPerson(ADMIN)
    const accounts = await rows<{ username: string; email: string | null }>('select * from public.team_accounts()')
    expect(accounts.map((a) => a.username).sort()).toEqual(['admin', 'ana', 'ben', 'former', 'newbie'])
    expect(accounts.find((a) => a.username === 'ana')?.email).toBe('ana@p33.test')
    expect(accounts.find((a) => a.username === 'ben')?.email).toBeNull()
    expect(accounts[0]).not.toHaveProperty('temp_password_hash')
  })

  it('a temporary password hides the list from an admin too', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set role = 'admin', must_change_password = true where username = 'ana'`)
    await asPerson(ANA)
    expect(await rows('select * from public.team_accounts()')).toEqual([])
  })

  it('coaches can change their own name and colour, and nothing else', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    expect(await affected(`update public.profiles set name = 'Anita', color = '#000000' where id = '${ana}'`)).toBe(1)
    for (const assignment of [`role = 'admin'`, 'active = false', `email = 'x@p33.test'`, `username = 'otra'`, `user_id = '${ID.ben}'`]) {
      await expect(rows(`update public.profiles set ${assignment} where id = '${ana}'`), assignment).rejects.toThrow(/permission denied/)
    }
  })

  it('a monitor cannot edit another monitor', async () => {
    const ben = await profileId('ben')
    await asPerson(ANA)
    expect(await affected(`update public.profiles set name = 'Hackeado' where id = '${ben}'`)).toBe(0)
  })

  it('from the app nobody, not even an admin, adds, deletes or changes roles directly', async () => {
    const ben = await profileId('ben')
    await asPerson(ADMIN)
    await expect(rows(`insert into public.profiles (user_id, username) values ('${ID.stranger}', 'amigo')`)).rejects.toThrow(/permission denied/)
    await expect(rows(`delete from public.profiles where id = '${ben}'`)).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.profiles set role = 'admin' where id = '${ben}'`)).rejects.toThrow(/permission denied/)
  })

  it('the function (service role) can create and change accounts', async () => {
    await asService()
    await rows(`insert into public.profiles (user_id, username, name, role, must_change_password) values ('${ID.stranger}', 'nueva', 'Nueva', 'monitor', true)`)
    expect(await affected(`update public.profiles set role = 'admin' where username = 'nueva'`)).toBe(1)
    expect(await rows(`select temp_password_hash from public.profiles where username = 'nueva'`)).toEqual([{ temp_password_hash: 'hash-stranger' }])
  })

  it('protects the last active admin, even from the function and the database owner', async () => {
    for (const enter of [asSuperuser, asService]) {
      await enter()
      await expect(rows(`update public.profiles set role = 'monitor' where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
      await expect(rows(`update public.profiles set active = false where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
      await expect(rows(`delete from public.profiles where username = 'admin'`)).rejects.toThrow(/profile_last_admin/)
    }
    await asSuperuser()
    await expect(db.exec(`delete from auth.users where id = '${ID.admin}'`)).rejects.toThrow(/profile_last_admin/)
  })

  it('an admin can go while another remains', async () => {
    await asSuperuser()
    await db.exec(`update public.profiles set role = 'admin' where username = 'ben'`)
    await db.exec(`update public.profiles set active = false where username = 'admin'`)
    await expect(db.exec(`update public.profiles set active = false where username = 'ben'`)).rejects.toThrow(/profile_last_admin/)
  })

  it('deleting a login deletes its account', async () => {
    await asSuperuser()
    await db.exec(`delete from auth.users where id = '${ID.ana}'`)
    expect(await rows(`select 1 from public.profiles where username = 'ana'`)).toEqual([])
  })

  it('closing the sessions of an account is only for the function', async () => {
    await asSuperuser()
    await db.exec(`
      insert into auth.sessions (user_id) values ('${ID.ana}'), ('${ID.ben}');
      insert into auth.refresh_tokens (user_id) values ('${ID.ana}'), ('${ID.ben}');
    `)
    await asPerson(ADMIN)
    await expect(rows(`select public.revoke_user_sessions('${ID.ana}')`)).rejects.toThrow(/permission denied/)
    await asService()
    await rows(`select public.revoke_user_sessions('${ID.ana}')`)
    await asSuperuser()
    expect(await rows('select user_id from auth.sessions')).toEqual([{ user_id: ID.ben }])
    expect(await rows('select user_id from auth.refresh_tokens')).toEqual([{ user_id: ID.ben }])
  })
})

describe('login limits', () => {
  const CLIENT = 'hash-ip'
  const reserve = async (username: string, client = CLIENT) =>
    (await rows<{ allowed: boolean }>('select public.login_reserve_attempt($1, $2) as allowed', [username, client]))[0].allowed
  const reserveTimes = async (times: number, username: string, client = CLIENT) => {
    let last = true
    for (let i = 0; i < times; i++) last = await reserve(username, client)
    return last
  }

  beforeEach(asService)

  it('the sixth attempt of a person from one connection is refused, and only that pair', async () => {
    expect(await reserveTimes(5, 'ana')).toBe(true)
    expect(await reserve('ana')).toBe(false)
    expect(await reserve('ben')).toBe(true)
  })

  it('a stranger cannot lock someone out from their own connection', async () => {
    await reserveTimes(10, 'ana', 'extrano')
    expect(await reserve('ana', 'gimnasio')).toBe(true)
  })

  it('many connections against one person are stopped too', async () => {
    for (let i = 0; i < 20; i++) expect(await reserve('ana', `ip-${i}`)).toBe(true)
    expect(await reserve('ana', 'otra-ip')).toBe(false)
  })

  it('one connection cannot go through every name, and adds no more rows once refused', async () => {
    for (let i = 0; i < 50; i++) expect(await reserve(`nombre${i}`)).toBe(true)
    expect(await reserve('otro.nombre')).toBe(false)
    await asSuperuser()
    expect(await rows(`select key from public.login_attempts where key like '%otro.nombre'`)).toEqual([])
  })

  it('entering clears the count of that person and gives the attempt back', async () => {
    await reserveTimes(5, 'ana')
    await rows('select public.login_clear_failures($1, $2)', ['ana', CLIENT])
    expect(await reserve('ana')).toBe(true)
    await asSuperuser()
    expect(await rows(`select failures from public.login_attempts where key = 'client:${CLIENT}'`)).toEqual([{ failures: 5 }])
  })

  it('a server failure gives the attempt back', async () => {
    await reserveTimes(5, 'ana')
    await rows('select public.login_release_attempt($1, $2)', ['ana', CLIENT])
    expect(await reserve('ana')).toBe(true)
  })

  it('an admin unlocks a person from every connection, without touching anyone else', async () => {
    await reserveTimes(6, 'ana')
    await reserveTimes(6, 'ana.b')
    await rows('select public.login_clear_username($1)', ['ana'])
    expect(await reserve('ana')).toBe(true)
    expect(await reserve('ana.b')).toBe(false)
  })

  it('expires after 15 minutes, and old rows are cleaned up', async () => {
    await reserveTimes(6, 'ana')
    await asSuperuser()
    await db.exec(`update public.login_attempts set first_failed_at = now() - interval '16 minutes'`)
    await asService()
    expect(await reserve('otra')).toBe(true)
    expect(await reserve('ana')).toBe(true)
    await asSuperuser()
    expect(await rows(`select failures from public.login_attempts where key = 'name:ana'`)).toEqual([{ failures: 1 }])
  })

  it('nobody but the function can see or use it', async () => {
    for (const enter of [() => asPerson(ADMIN), asAnon]) {
      await enter()
      await expect(count('login_attempts')).rejects.toThrow(/permission denied/)
      await expect(reserve('ana')).rejects.toThrow(/permission denied/)
      await expect(rows('select public.login_clear_username($1)', ['ana'])).rejects.toThrow(/permission denied/)
      await expect(rows(`select public.login_count_attempt('x', 5)`)).rejects.toThrow(/permission denied/)
    }
  })
})

describe('initial library', () => {
  const pending = async () => (await rows<{ pending: boolean }>('select public.library_seed_pending() as pending'))[0].pending
  const seed = async (exercises: Array<{ id: string; name: string }>) =>
    (
      await rows<{ seeded: boolean }>('select public.seed_library($1::jsonb) as seeded', [
        JSON.stringify(exercises.map(({ id, name }) => ({ id, data: { name }, client_origin: 'tab' }))),
      ])
    )[0].seeded

  it('is pending once for an admin, never for a monitor', async () => {
    await asPerson(ANA)
    expect(await pending()).toBe(false)
    await expect(seed([])).rejects.toThrow(/not_admin/)
    await asPerson(ADMIN)
    expect(await pending()).toBe(true)
    expect(await seed([{ id: 'l2', name: 'Nuevo' }])).toBe(true)
    expect(await pending()).toBe(false)
    expect(await count('library_exercises')).toBe(2)
  })

  it('never overwrites an existing row', async () => {
    await asPerson(ADMIN)
    await seed([{ id: 'l1', name: 'Otro' }])
    expect(await rows(`select data from public.library_exercises where id = 'l1'`)).toEqual([{ data: { name: 'Remo' } }])
  })

  it('goes in whole or not at all', async () => {
    await asPerson(ADMIN)
    await expect(rows('select public.seed_library($1::jsonb)', [JSON.stringify([{ id: 'l2', data: { name: 'Bien' } }, { id: 'l3', data: {} }])])).rejects.toThrow(/data/)
    expect(await count('library_exercises')).toBe(1)
    expect(await pending()).toBe(true)
  })

  it('a second upload, from another admin too, brings nothing back', async () => {
    await asPerson(ADMIN)
    await seed([{ id: 'l2', name: 'Nuevo' }])
    await rows('delete from public.library_exercises')
    expect(await seed([{ id: 'l2', name: 'Nuevo' }])).toBe(false)
    expect(await count('library_exercises')).toBe(0)
    expect(await pending()).toBe(false)
  })

  it('works on a database with no settings row, and keeps the default branding', async () => {
    await asSuperuser()
    await db.exec('delete from public.settings')
    await asPerson(ADMIN)
    await seed([])
    expect(await pending()).toBe(false)
    expect(await rows('select data from public.settings')).toEqual([{ data: {} }])
  })

  it('saving the branding later does not undo it', async () => {
    await asPerson(ADMIN)
    await seed([])
    await rows(`insert into public.settings (id, data) values ('main', '{"gymName":"Otro"}') on conflict (id) do update set data = excluded.data`)
    expect(await pending()).toBe(false)
  })
})

describe('history of changes', () => {
  it('keeps what was there before a change or a delete', async () => {
    await asPerson(ANA)
    await rows(`update public.clients set data = '{"firstName":"Otra"}' where id = 'c1'`)
    await rows(`delete from public.programs where id = 'p1'`)
    await asSuperuser()
    const ana = await profileId('ana')
    expect(await rows('select table_name, row_id, operation, data, changed_by from public.row_history order by id')).toEqual([
      { table_name: 'clients', row_id: 'c1', operation: 'UPDATE', data: { firstName: 'Laura' }, changed_by: ana },
      { table_name: 'programs', row_id: 'p1', operation: 'DELETE', data: { clientId: 'c1' }, changed_by: ana },
    ])
  })

  it('a save that changes nothing adds nothing, and old copies go away', async () => {
    await asSuperuser()
    await db.exec(`
      insert into public.row_history (table_name, row_id, operation, data, changed_at) values ('clients', 'viejo', 'UPDATE', '{}', now() - interval '31 days');
      update public.clients set data = data where id = 'c1';
    `)
    expect(await count('row_history')).toBe(1)
    await db.exec(`update public.clients set data = '{"firstName":"Otra"}' where id = 'c1'`)
    expect(await rows('select row_id from public.row_history')).toEqual([{ row_id: 'c1' }])
  })

  it('nobody reads it from the app', async () => {
    for (const enter of [() => asPerson(ADMIN), () => asPerson(ANA), asAnon]) {
      await enter()
      await expect(count('row_history')).rejects.toThrow(/permission denied/)
    }
  })

  it('a row cannot be emptied with one request', async () => {
    await asPerson(ANA)
    await expect(rows(`update public.clients set data = '{}' where true`)).rejects.toThrow(/data/)
    await expect(rows(`update public.programs set data = '{}' where true`)).rejects.toThrow(/data/)
    await expect(rows(`update public.library_exercises set data = '{}' where true`)).rejects.toThrow(/data/)
  })
})

describe('active coaches and shared data', () => {
  it('only the admin can delete a client: a monitor archives', async () => {
    await asPerson(ANA)
    expect(await affected(`delete from public.clients where true`)).toBe(0)
    expect(await count('clients')).toBe(1)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(1)
  })

  it('can read and write clients, programs and the whole library', async () => {
    await asPerson(ANA)
    expect(await count('clients')).toBe(1)
    await rows(`insert into public.clients (id, data) values ('c2', '{"firstName":"Otra"}')`)
    await rows(`insert into public.programs (id, data) values ('p2', '{"clientId":"c2"}')`)
    await rows(`insert into public.library_exercises (id, data) values ('l2', '{"name":"Nuevo"}')`)
    expect(await affected(`update public.clients set data = '{"firstName":"Laura","a":1}' where id = 'c1'`)).toBe(1)
    expect(await affected(`update public.library_exercises set data = '{"name":"Editado","link":"https://x.test"}' where id = 'l1'`)).toBe(1)
    expect(await affected(`delete from public.library_exercises where id = 'l1'`)).toBe(1)
  })

  it('stamps author and date on the server, whatever the browser sends', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await rows(`insert into public.clients (id, data, updated_by, updated_at) values ('c2', '{"firstName":"Otra"}', '${ben}', '2000-01-01')`)
    const [row] = await rows<{ updated_by: string; updated_at: Date }>(`select updated_by, updated_at from public.clients where id = 'c2'`)
    expect(row.updated_by).toBe(ana)
    expect(new Date(row.updated_at).getFullYear()).toBeGreaterThan(2000)
  })

  it('branding: everyone reads it, only the admin changes it', async () => {
    await asPerson(ANA)
    expect(await count('settings')).toBe(1)
    expect(await affected(`update public.settings set data = '{}'`)).toBe(0)
    expect(await affected(`delete from public.settings`)).toBe(0)
    await asPerson(ADMIN)
    expect(await affected(`update public.settings set data = '{"gymName":"Nuevo"}'`)).toBe(1)
  })
})

describe('private notes', () => {
  const insertNote = (id: string, author: string | null) =>
    rows(`insert into public.notes (id, data, author_profile_id, client_id) values ($1, '{}', $2, 'c1')`, [id, author])

  it('are read by the whole team', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await count('notes')).toBe(1)
  })

  it('can only be signed with your own name', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await expect(insertNote('n1', ben)).rejects.toThrow(/row-level security/)
    await expect(insertNote('n2', null)).rejects.toThrow(/row-level security/)
    await insertNote('n3', ana)
    expect(await count('notes')).toBe(1)
  })

  it('can only be edited or deleted by their author', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await affected(`update public.notes set data = '{"text":"x"}' where id = 'n1'`)).toBe(0)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(0)
    await asPerson(ANA)
    expect(await affected(`update public.notes set data = '{"text":"y"}' where id = 'n1'`)).toBe(1)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(1)
  })

  it('cannot be handed over to someone else', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await expect(rows(`update public.notes set author_profile_id = '${ben}' where id = 'n1'`)).rejects.toThrow(/row-level security/)
  })

  it('an upsert over a note from someone else is refused', async () => {
    const ana = await profileId('ana')
    const ben = await profileId('ben')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    await expect(
      rows(
        `insert into public.notes (id, data, author_profile_id, client_id) values ('n1', '{}', '${ben}', 'c1')
         on conflict (id) do update set data = excluded.data, author_profile_id = excluded.author_profile_id`,
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('the admin can edit, delete and restore notes from others', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`update public.notes set data = '{"text":"z"}' where id = 'n1'`)).toBe(1)
    expect(await affected(`delete from public.notes where id = 'n1'`)).toBe(1)
    await insertNote('n1', ana)
    expect(await count('notes')).toBe(1)
  })

  it('survive a monitor trying to delete their client', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(BEN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(0)
    expect(await count('notes')).toBe(1)
  })

  it('go away with their client when the admin deletes it, and undoing it brings them back', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asPerson(ADMIN)
    expect(await affected(`delete from public.clients where id = 'c1'`)).toBe(1)
    expect(await count('notes')).toBe(0)
    await rows(`insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}')`)
    await insertNote('n1', ana)
    expect(await count('notes')).toBe(1)
  })

  it('keep existing, without signature, when their author is deleted', async () => {
    const ana = await profileId('ana')
    await asPerson(ANA)
    await insertNote('n1', ana)
    await asSuperuser()
    await db.exec(`delete from auth.users where id = '${ID.ana}'`)
    const [note] = await rows<{ author_profile_id: string | null }>(`select author_profile_id from public.notes where id = 'n1'`)
    expect(note.author_profile_id).toBeNull()
  })
})

describe('TV screens and their sections', () => {
  const SECTION = (clientId: string | null, day = 1) => JSON.stringify({ clientId, day, assignedAt: '2026-11-06T10:00:00.000Z' })

  it('every active coach reads and writes them, and the server stamps who', async () => {
    const ben = await profileId('ben')
    await asPerson(BEN)
    expect(await count('screens')).toBe(1)
    expect(await count('screen_sections')).toBe(1)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Pantalla 2","sections":6}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:6', '2', $1)`, [SECTION(null)])
    expect(await affected(`update public.screen_sections set data = $1 where id = '1:1'`, [SECTION('c1', 3)])).toBe(1)
    const [row] = await rows<{ updated_by: string }>(`select updated_by from public.screen_sections where id = '1:1'`)
    expect(row.updated_by).toBe(ben)
    expect(await affected(`delete from public.screen_sections where id = '2:6'`)).toBe(1)
    expect(await affected(`delete from public.screens where id = '2'`)).toBe(1)
  })

  it('sending the default screens twice, also at the same time, creates them once and changes nothing', async () => {
    await asPerson(ANA)
    const insertDefaults = `insert into public.screens (id, data) values
      ('1', '{"name":"Pantalla 1","sections":3}'), ('2', '{"name":"Pantalla 2","sections":3}') on conflict (id) do nothing`
    await rows(`update public.screens set data = '{"name":"Sala","sections":4}' where id = '1'`)
    await rows(insertDefaults)
    await rows(insertDefaults)
    expect(await rows(`select id, data ->> 'name' as name from public.screens order by id`)).toEqual([
      { id: '1', name: 'Sala' },
      { id: '2', name: 'Pantalla 2' },
    ])
  })

  it('only accepts screens 1 to 8 with 1 to 6 sections and a name', async () => {
    await asPerson(ANA)
    for (const [id, data] of [
      ['9', '{"name":"P","sections":3}'],
      ['0', '{"name":"P","sections":3}'],
      ['2', '{"name":"P","sections":7}'],
      ['2', '{"name":"P","sections":0}'],
      ['2', '{"name":"P","sections":2.5}'],
      ['2', '{"name":"P","sections":"3"}'],
      ['2', '{"name":"   ","sections":3}'],
      ['2', `{"name":"${'a'.repeat(31)}","sections":3}`],
      ['2', '{"sections":3}'],
      ['2', '{"name":"P","sections":3,"notes":"lesión de hombro"}'],
    ]) {
      await expect(rows('insert into public.screens (id, data) values ($1, $2)', [id, data])).rejects.toThrow(/check constraint/)
    }
  })

  it('a section holds only a person, a day and when it was sent: nothing private fits', async () => {
    await asPerson(ANA)
    const insert = (id: string, screen: string, data: string) =>
      rows('insert into public.screen_sections (id, screen_id, data) values ($1, $2, $3)', [id, screen, data])
    await expect(insert('1:7', '1', SECTION(null))).rejects.toThrow(/check constraint/)
    await expect(insert('2:1', '1', SECTION(null))).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","day":0,"assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":5,"day":1,"assignedAt":"x"}')).rejects.toThrow(/check constraint/)
    await expect(insert('1:2', '1', '{"clientId":"c1","day":1,"assignedAt":"x","goal":"perder peso"}')).rejects.toThrow(/check constraint/)
    await expect(insert('3:1', '3', SECTION(null))).rejects.toThrow(/foreign key/)
    await insert('1:2', '1', SECTION(null))
    expect(await count('screen_sections')).toBe(2)
  })

  it('removing a screen takes its sections with it, and nothing else', async () => {
    await asPerson(ANA)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Pantalla 2","sections":3}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:1', '2', $1)`, [SECTION('c1')])
    await rows(`delete from public.screens where id = '1'`)
    expect(await rows('select id from public.screen_sections')).toEqual([{ id: '2:1' }])
    expect(await count('clients')).toBe(1)
  })

  it('are not part of the history of changes', async () => {
    await asPerson(ANA)
    await rows(`update public.screen_sections set data = $1 where id = '1:1'`, [SECTION(null)])
    await asSuperuser()
    expect(await count('row_history')).toBe(0)
  })

  it('running the whole file again over a gym in use keeps every screen and section', async () => {
    await asPerson(ANA)
    await rows(`insert into public.screens (id, data) values ('2', '{"name":"Sala grande","sections":6}')`)
    await rows(`insert into public.screen_sections (id, screen_id, data) values ('2:5', '2', $1)`, [SECTION('c1', 2)])
    await asSuperuser()
    const before = await rows('select * from public.screens order by id')
    const sectionsBefore = await rows('select * from public.screen_sections order by id')
    await db.exec(SCHEMA)
    expect(await rows('select * from public.screens order by id')).toEqual(before)
    expect(await rows('select * from public.screen_sections order by id')).toEqual(sectionsBefore)
    expect(await count('clients')).toBe(1)
    await asPerson(BEN)
    expect(await count('screen_sections')).toBe(2)
    await asAnon()
    await expect(count('screens')).rejects.toThrow(/permission denied/)
  })
})

describe('TV screens: limits, cleanup and who sees which TVs are open', () => {
  const SENT_AT = '2026-11-06T10:00:00.000Z'
  const section = (clientId: string | null, assignedAt = SENT_AT) => JSON.stringify({ clientId, day: 1, assignedAt })
  const insertSection = (id: string, data: string) =>
    rows('insert into public.screen_sections (id, screen_id, data) values ($1, $2, $3)', [id, id.split(':')[0], data])
  const setSections = (screen: string, sections: number) =>
    rows(`update public.screens set data = jsonb_build_object('name', 'P', 'sections', $2::int) where id = $1`, [screen, sections])
  const sectionIds = async () => (await rows<{ id: string }>('select id from public.screen_sections order by id')).map((r) => r.id)
  const presenceRows = async () => (await rows('select id from realtime.messages')).length

  it('allows exactly the limits the app uses', async () => {
    await asPerson(ANA)
    const screen = (id: number, sections: number, name = 'P') =>
      rows('insert into public.screens (id, data) values ($1, $2)', [String(id), JSON.stringify({ name, sections })])
    await screen(TV_MAX_SCREENS, TV_MAX_SECTIONS, 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH))
    await expect(screen(TV_MAX_SCREENS + 1, TV_MIN_SECTIONS)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MAX_SECTIONS + 1)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MIN_SECTIONS - 1)).rejects.toThrow(/check constraint/)
    await expect(screen(2, TV_MIN_SECTIONS, 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH + 1))).rejects.toThrow(/check constraint/)
    await insertSection(`${TV_MAX_SCREENS}:${TV_MAX_SECTIONS}`, section(null))
    await expect(insertSection(`${TV_MAX_SCREENS}:${TV_MAX_SECTIONS + 1}`, section(null))).rejects.toThrow(/check constraint/)
  })

  it('a section takes only an id like the app makes and an ISO time (or none): no free text', async () => {
    await asPerson(ANA)
    await insertSection('1:2', section('cli_AE77VPj-SM'))
    await insertSection('1:3', section(null, ''))
    for (const data of [
      section('lesión de hombro'),
      section('a'.repeat(65)),
      section(''),
      section('c1', 'lesión de hombro'),
      section('c1', '2026-11-06'),
      section('c1', `${SENT_AT} y algo más`),
    ]) {
      await expect(insertSection('1:4', data)).rejects.toThrow(/check constraint/)
    }
  })

  it('fewer sections empties the ones left out in the same change, and more starts the new ones empty', async () => {
    await asPerson(ANA)
    await setSections('1', 6)
    for (const id of ['1:2', '1:5', '1:6']) await insertSection(id, section('c1'))
    await setSections('1', 4)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
    // A section written past the count (a window that had not heard of the change) never comes back into view.
    await insertSection('1:6', section('c1'))
    await setSections('1', 6)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
    await rows(`update public.screens set data = '{"name":"Otro nombre","sections":6}' where id = '1'`)
    expect(await sectionIds()).toEqual(['1:1', '1:2'])
  })

  it('running the file again updates a rule of a table that already exists, and keeps the rows it finds', async () => {
    await asSuperuser()
    const longName = 'a'.repeat(TV_SCREEN_NAME_MAX_LENGTH + 5)
    await db.exec('alter table public.screens drop constraint screens_data_check')
    await db.query('insert into public.screens (id, data) values ($1, $2)', ['2', JSON.stringify({ name: longName, sections: 3 })])
    await db.exec(SCHEMA)
    expect(await count('screens')).toBe(2)
    await asPerson(ANA)
    await expect(rows(`insert into public.screens (id, data) values ('3', '{"name":"P","sections":9}')`)).rejects.toThrow(/check constraint/)
    await asSuperuser()
    await db.exec(`delete from public.screens where id = '2'; alter table public.screens validate constraint screens_data_check;`)
  })

  it('only active coaches see and announce which TV windows are open', async () => {
    const onTopic = (topic: string) => db.query(`select set_config('realtime.topic', $1, false)`, [topic])
    const announce = () => rows(`insert into realtime.messages (topic, extension, payload) values ('p33-screens-presence', 'presence', '{}')`)
    await asPerson(ANA)
    await onTopic('p33-screens-presence')
    await announce()
    expect(await presenceRows()).toBe(1)
    await expect(rows(`insert into realtime.messages (topic, extension) values ('p33-screens-presence', 'broadcast')`)).rejects.toThrow(
      /row-level security/,
    )
    await onTopic('otro-canal')
    expect(await presenceRows()).toBe(0)
    await expect(rows(`insert into realtime.messages (topic, extension) values ('otro-canal', 'presence')`)).rejects.toThrow(/row-level security/)
    for (const who of [STRANGER, FORMER, NEWBIE]) {
      await asPerson(who)
      await onTopic('p33-screens-presence')
      expect(await presenceRows()).toBe(0)
      await expect(announce()).rejects.toThrow(/row-level security/)
    }
    await asAnon()
    await onTopic('p33-screens-presence')
    expect(await presenceRows()).toBe(0)
    await expect(announce()).rejects.toThrow(/row-level security/)
    await asSuperuser()
    await db.exec('truncate realtime.messages')
  })
})

describe('schema.sql over the database of the live project', () => {
  it('adds the classes and bookings next to the data in use, twice in a row, without touching it', async () => {
    const live = new PGlite()
    await live.exec(SUPABASE_STUBS)
    await live.exec(PREVIOUS_SCHEMA)
    await live.exec(`
      insert into auth.users (id, email) values ('${ID.admin}', 'admin@p33.test');
      insert into public.profiles (user_id, username, email, name, role, must_change_password)
        values ('${ID.admin}', 'admin', 'admin@p33.test', 'Admin', 'admin', false);
      insert into public.clients (id, data) values ('c1', '{"firstName":"Laura"}');
      insert into public.programs (id, data) values ('p1', '{"clientId":"c1"}');
      insert into public.settings (id, data) values ('main', '{"gymName":"P33"}');
      insert into public.screens (id, data) values ('1', '{"name":"Pantalla 1","sections":3}');
      insert into public.screen_sections (id, screen_id, data) values ('1:1', '1', '{"clientId":"c1","day":2,"assignedAt":""}');
    `)
    const snapshot = async () => ({
      clients: (await live.query('select * from public.clients order by id')).rows,
      programs: (await live.query('select * from public.programs order by id')).rows,
      settings: (await live.query('select * from public.settings')).rows,
      profiles: (await live.query('select * from public.profiles')).rows,
      screens: (await live.query('select * from public.screens')).rows,
      sections: (await live.query('select * from public.screen_sections')).rows,
    })
    const before = await snapshot()
    await live.exec(SCHEMA)
    await live.exec(SCHEMA)
    expect(await snapshot()).toEqual(before)
    const secured = await live.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
       where relname in ('booking_settings', 'class_templates', 'class_slots', 'bookings', 'notification_outbox', 'training_sessions')
       order by relname`,
    )
    expect(secured.rows.map((r) => [r.relname, r.relrowsecurity])).toEqual([
      ['booking_settings', true],
      ['bookings', true],
      ['class_slots', true],
      ['class_templates', true],
      ['notification_outbox', true],
      ['training_sessions', true],
    ])
    expect((await live.query('select id from public.booking_settings')).rows).toEqual([{ id: 'main' }])
    await live.exec('set role anon')
    await expect(live.query('select * from public.bookings')).rejects.toThrow(/permission denied/)
    await live.close()
  })
})

// ── Classes and bookings ─────────────────────────────────────────────────────

/** Clients with each plan (c1 Laura, from seedPeople, has none: she counts as Standard). */
const MARTA = 'c2'
const PABLO = 'c3'
const SARA = 'c4'
const LUIS = 'c5'
const EVA = 'c6'

/** The account error codes schema.sql raised before the bookings; every other code must be a booking code. */
const ACCOUNT_ERROR_CODES = ['password_not_changed', 'not_admin', 'profile_last_admin', 'username_taken', 'email_taken']

async function seedBookingClients(): Promise<void> {
  await asSuperuser()
  await db.exec(`
    insert into public.clients (id, data) values
      ('${MARTA}', '{"firstName":"Marta","plan":"plus","trainingDays":3}'),
      ('${PABLO}', '{"firstName":"Pablo","plan":"elite","trainingDays":4}'),
      ('${SARA}', '{"firstName":"Sara","plan":"custom","trainingDays":1}'),
      ('${LUIS}', '{"firstName":"Luis","plan":"standard","trainingDays":2}'),
      ('${EVA}', '{"firstName":"Eva","plan":"standard","trainingDays":2}');
  `)
}

/** Calls a booking function by its named arguments, as supabase-js does. */
async function rpc<K extends keyof BookingRpcs>(name: K, args: BookingRpcs[K]['args']): Promise<BookingRpcs[K]['result']> {
  const keys = Object.keys(args)
  const call = `select * from public.${name}(${keys.map((key, i) => `${key} => $${i + 1}`).join(', ')})`
  const result = await rows<Record<string, unknown>>(call, Object.values(args))
  return (name === 'staff_create_slot' ? result[0][name] : result) as BookingRpcs[K]['result']
}

/** A class next week (always ahead, all in one gym week): day 0 = Monday, time on the gym clock. */
async function slotNextWeek(day: number, time: string, capacity = 2, name = 'Funcional'): Promise<string> {
  await asSuperuser()
  const [row] = await rows<{ id: string }>(
    `insert into public.class_slots (starts_at, duration_minutes, capacity, name)
     values (public.gym_time_to_instant(public.gym_week_start(public.gym_today()) + 7 + $1::int, $2::time), 60, $3, $4) returning id`,
    [day, time, capacity, name],
  )
  return row.id
}

/** A class starting that many minutes from now (negative: already started). */
async function slotIn(minutes: number, capacity = 2, duration = 60): Promise<string> {
  await asSuperuser()
  const [row] = await rows<{ id: string }>(
    `insert into public.class_slots (starts_at, duration_minutes, capacity, name)
     values (date_trunc('minute', now()) + make_interval(mins => $1::int), $2, $3, 'Funcional') returning id`,
    [minutes, duration, capacity],
  )
  return row.id
}

/** Puts people on the waitlist in this order (only members do it, from phase 3). */
async function waitlist(slotId: string, ...clientIds: string[]): Promise<string[]> {
  await asSuperuser()
  const ids: string[] = []
  for (const clientId of clientIds) {
    const [row] = await rows<{ id: string }>(
      `insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'waitlisted') returning id`,
      [slotId, clientId],
    )
    ids.push(row.id)
  }
  return ids
}

async function bookingsOf(slotId: string): Promise<Array<{ client_id: string; status: string; forced: boolean }>> {
  await asSuperuser()
  return rows(`select client_id, status, forced from public.bookings where slot_id = $1 order by queue_order`, [slotId])
}

async function notices(): Promise<Array<{ kind: string; client_id: string }>> {
  await asSuperuser()
  return rows('select kind, client_id from public.notification_outbox order by id')
}

/** A day of next week as 'YYYY-MM-DD' (0 = Monday). */
async function nextWeekDay(day: number): Promise<string> {
  await asSuperuser()
  return (await rows<{ day: string }>('select (public.gym_week_start(public.gym_today()) + 7 + $1::int)::text as day', [day]))[0].day
}

async function bookAs(who: string, slotId: string, clientId: string, force = false) {
  await asPerson(who)
  return (await rpc('staff_add_booking', { p_slot_id: slotId, p_client_id: clientId, p_force: force }))[0]
}

describe('classes and bookings: rules shared with the web and the app', () => {
  it('starts with the defaults of shared/booking', async () => {
    await asSuperuser()
    const [row] = await rows<BookingSettingsValues>('select * from public.booking_settings')
    expect(bookingSettingsFromRow(row)).toEqual(BOOKING_DEFAULTS)
  })

  it('the rules accept exactly the limits of BOOKING_LIMITS', async () => {
    await asPerson(ADMIN)
    const setRule = (column: string, value: number) => rows(`update public.booking_settings set ${column} = $1`, [value])
    for (const [column, limit] of [
      ['horizon_days', BOOKING_LIMITS.horizonDays],
      ['cancel_until_minutes', BOOKING_LIMITS.cancelUntilMinutes],
      ['promote_until_minutes', BOOKING_LIMITS.promoteUntilMinutes],
      ['quota_standard', BOOKING_LIMITS.weeklyQuota],
      ['quota_plus', BOOKING_LIMITS.weeklyQuota],
    ] as const) {
      await setRule(column, limit.min)
      await setRule(column, limit.max)
      await expect(setRule(column, limit.min - 1), column).rejects.toThrow(/check constraint/)
      await expect(setRule(column, limit.max + 1), column).rejects.toThrow(/check constraint/)
    }
    await expect(rows(`update public.booking_settings set quota_elite_rule = 'fixed'`)).rejects.toThrow(/check constraint/)
    await expect(rows(`update public.booking_settings set quota_plus_rule = 'unlimited'`)).rejects.toThrow(/check constraint/)
    await rows(`update public.booking_settings set quota_plus_rule = 'unlimited', quota_plus = null`)
  })

  it('a class takes exactly the limits of BOOKING_LIMITS, on the timetable and on each day', async () => {
    await asPerson(ADMIN)
    const { capacity, durationMinutes, className } = BOOKING_LIMITS
    const template = (fields: Partial<{ weekday: number; start_time: string; duration_minutes: number; capacity: number; name: string }>) =>
      rows(
        `insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values ($1, $2, $3, $4, $5)`,
        [fields.weekday ?? 1, fields.start_time ?? '10:00', fields.duration_minutes ?? 60, fields.capacity ?? 10, fields.name ?? 'Funcional'],
      )
    await template({ weekday: 7, capacity: capacity.max, duration_minutes: durationMinutes.max, name: 'a'.repeat(className.max) })
    await template({ weekday: 1, capacity: capacity.min, duration_minutes: durationMinutes.min, name: 'a'.repeat(className.min) })
    for (const bad of [
      { weekday: 0 },
      { weekday: 8 },
      { start_time: '10:00:30' },
      { capacity: capacity.min - 1 },
      { capacity: capacity.max + 1 },
      { duration_minutes: durationMinutes.min - 1 },
      { duration_minutes: durationMinutes.max + 1 },
      { name: 'a'.repeat(className.max + 1) },
      { name: '   ' },
      { name: ' Funcional' },
      { name: 'Fun​cional' },
    ]) {
      await expect(template(bad), JSON.stringify(bad)).rejects.toThrow(/check constraint/)
    }
    await asPerson(ANA)
    await expect(rpc('staff_create_slot', { p_starts_at: new Date(Date.now() + 86_400_000).toISOString(), p_duration_minutes: 60, p_capacity: capacity.max + 1, p_name: 'Extra' })).rejects.toThrow(/check constraint/)
  })

  it('statuses and notices are the ones in shared/booking', () => {
    const listIn = (constraint: string) => {
      const start = SCHEMA.indexOf(`add constraint ${constraint}`)
      return [...SCHEMA.slice(start, SCHEMA.indexOf('not valid;', start)).matchAll(/in \(([^)]*)\)/g)].map((m) =>
        m[1].split(',').map((v) => v.trim().replace(/'/g, '')),
      )
    }
    expect(listIn('bookings_check')[0]).toEqual([...BOOKING_STATUSES])
    expect(listIn('class_slots_check')[0]).toEqual([...SLOT_STATUSES])
    expect(listIn('notification_outbox_kind_check')[0]).toEqual([...NOTIFICATION_KINDS])
  })

  it('reads every time in the gym time zone, and only there', () => {
    const zones = new Set([...SCHEMA.matchAll(/'([A-Z][a-z]+\/[A-Za-z_]+)'/g)].map((m) => m[1]))
    expect([...zones]).toEqual([GYM_TIME_ZONE])
  })

  it('raises only codes the web and the app know', () => {
    const raised = new Set([...SCHEMA.matchAll(/raise exception '([a-z_]+)'/g)].map((m) => m[1]))
    const known: string[] = [...BOOKING_ERROR_CODES, ...ACCOUNT_ERROR_CODES]
    for (const code of raised) expect(known, code).toContain(code)
    expect(raised).toContain('slot_full')
  })

  it('the gym clock in SQL is the one of shared/booking, also on the days the clock changes', async () => {
    await asSuperuser()
    const year = new Date().getUTCFullYear() + 1
    const lastSunday = (month: number) => {
      const last = new Date(Date.UTC(year, month + 1, 0))
      return toGymDate(Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), 12))
    }
    const days = [lastSunday(2), lastSunday(9)].flatMap((sunday) => [addGymDays(sunday, -1), sunday, addGymDays(sunday, 1)])
    const times = ['00:00', '00:30', '00:59', '01:00', '01:30', '01:59', '02:00', '02:30', '10:00', '23:30']
    for (const day of days) {
      for (const time of times) {
        const [h, m] = time.split(':').map(Number)
        const [row] = await rows<{ at: Date; gym_date: string; monday: string }>(
          `select public.gym_time_to_instant($1::date, $2::time) as at,
             ((public.gym_time_to_instant($1::date, $2::time)) at time zone 'Atlantic/Canary')::date::text as gym_date,
             public.gym_week_start($1::date)::text as monday`,
          [day, time],
        )
        const expected = gymTimeToMs(day, h * 60 + m)
        expect(new Date(row.at).getTime(), `${day} ${time}`).toBe(expected)
        expect(row.gym_date, `${day} ${time}`).toBe(toGymDate(expected))
        expect(row.monday).toBe(gymMonday(day))
      }
    }
  })
})

describe('classes and bookings: the timetable', () => {
  beforeEach(seedBookingClients)

  const templateSlots = async (templateId: string) => {
    await asSuperuser()
    return rows<{ id: string; template_date: string; local_time: string; capacity: number; name: string }>(
      `select id, template_date::text, to_char(starts_at at time zone 'Atlantic/Canary', 'HH24:MI') as local_time, capacity, name
       from public.class_slots where template_id = $1 order by template_date`,
      [templateId],
    )
  }

  const addTemplate = async (time = '10:00', capacity = 8): Promise<string> => {
    await asPerson(ADMIN)
    const tomorrow = gymWeekday(addGymDays(toGymDate(Date.now()), 1))
    const [row] = await rows<{ id: string }>(
      `insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values ($1, $2, 60, $3, 'Funcional') returning id`,
      [tomorrow, time, capacity],
    )
    return row.id
  }

  it('makes its classes across a clock change at the right hour, once', async () => {
    await asSuperuser()
    const year = new Date().getUTCFullYear() + 1
    const lastSundayOf = (month: number) => {
      const last = new Date(Date.UTC(year, month + 1, 0))
      return toGymDate(Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), 12))
    }
    const [{ id }] = await rows<{ id: string }>(
      `insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values (7, '10:00', 60, 10, 'Domingo') returning id`,
    )
    const [{ id: early }] = await rows<{ id: string }>(
      `insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values (7, '01:30', 60, 10, 'Madrugada') returning id`,
    )
    for (const sunday of [lastSundayOf(2), lastSundayOf(9)]) {
      const from = addGymDays(sunday, -7)
      const to = addGymDays(sunday, 7)
      await rows('select public.ensure_class_slots($1::date, $2::date)', [from, to])
      expect((await rows<{ n: number }>('select public.ensure_class_slots($1::date, $2::date) as n', [from, to]))[0].n).toBe(0)
      for (const [templateId, minutes] of [[id, 600], [early, 90]] as const) {
        const made = await rows<{ template_date: string; starts_at: Date }>(
          `select template_date::text, starts_at from public.class_slots
           where template_id = $1 and template_date between $2::date and $3::date order by template_date`,
          [templateId, from, to],
        )
        expect(made.map((s) => s.template_date)).toEqual([from, sunday, to])
        for (const slot of made) expect(new Date(slot.starts_at).getTime()).toBe(gymTimeToMs(slot.template_date, minutes))
      }
    }
  })

  it('makes the classes of the coming days by itself, as many as the rules allow', async () => {
    const template = await addTemplate()
    const slots = await templateSlots(template)
    expect(slots).toHaveLength(2)
    expect(slots.map((s) => s.local_time)).toEqual(['10:00', '10:00'])
    await asPerson(ANA)
    await rpc('class_slots_for', { p_from: slots[0].template_date, p_to: slots[1].template_date })
    expect(await templateSlots(template)).toHaveLength(2)
  })

  it('a change redoes only the classes nobody touched and nobody booked', async () => {
    const template = await addTemplate()
    const [booked, untouched] = await templateSlots(template)
    await bookAs(ANA, booked.id, LUIS)
    await asPerson(ADMIN)
    await rows(`update public.class_templates set start_time = '11:30', capacity = 12 where id = $1`, [template])
    const after = await templateSlots(template)
    expect(after.map((s) => [s.template_date, s.local_time, s.capacity])).toEqual([
      [booked.template_date, '10:00', 8],
      [untouched.template_date, '11:30', 12],
    ])
    expect(after[0].id).toBe(booked.id)

    await asPerson(ANA)
    await rpc('staff_update_slot', { p_slot_id: after[1].id, p_name: 'Funcional especial' })
    await asPerson(ADMIN)
    await rows(`update public.class_templates set name = 'Fuerza' where id = $1`, [template])
    expect((await templateSlots(template)).map((s) => s.name)).toEqual(['Funcional', 'Funcional especial'])
  })

  it('locks its future classes before checking who is booked, so a booking made meanwhile is never deleted', async () => {
    // PGlite has one connection: this checks the order in the function; the two-session run is on real Postgres.
    await asSuperuser()
    const [{ def }] = await rows<{ def: string }>(`select pg_get_functiondef('public.class_templates_sync()'::regprocedure) as def`)
    const lock = def.search(/for update;/i)
    expect(lock).toBeGreaterThan(-1)
    expect(lock).toBeLessThan(def.search(/delete from public.class_slots/i))
  })

  it('switching it off or deleting it removes its empty classes and keeps the ones with people', async () => {
    const template = await addTemplate()
    const [booked] = await templateSlots(template)
    await bookAs(ANA, booked.id, LUIS)
    await asPerson(ADMIN)
    await rows('update public.class_templates set active = false where id = $1', [template])
    expect((await templateSlots(template)).map((s) => s.id)).toEqual([booked.id])
    await rows('update public.class_templates set active = true where id = $1', [template])
    expect(await templateSlots(template)).toHaveLength(2)
    await rows('delete from public.class_templates where id = $1', [template])
    await asSuperuser()
    expect(await rows('select id, template_id from public.class_slots')).toEqual([{ id: booked.id, template_id: null }])
  })

  it('only an admin changes the timetable and the rules; the team reads them', async () => {
    const template = await addTemplate()
    for (const who of [ANA, BEN]) {
      await asPerson(who)
      expect(await count('class_templates')).toBe(1)
      expect(await count('booking_settings')).toBe(1)
      await expect(
        rows(`insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values (1, '10:00', 60, 8, 'X')`),
      ).rejects.toThrow(/row-level security/)
      expect(await affected(`update public.class_templates set capacity = 1 where id = $1`, [template])).toBe(0)
      expect(await affected(`delete from public.class_templates where id = $1`, [template])).toBe(0)
      expect(await affected(`update public.booking_settings set horizon_days = 1`)).toBe(0)
      await expect(rows(`insert into public.booking_settings (id) values ('main') on conflict (id) do nothing`)).rejects.toThrow(/row-level security/)
    }
    await asPerson(ADMIN)
    expect(await affected(`update public.booking_settings set horizon_days = 21`)).toBe(1)
    await expect(rows(`delete from public.booking_settings`)).rejects.toThrow(/permission denied/)
  })
})

describe('classes and bookings: what coaches do', () => {
  beforeEach(seedBookingClients)

  it('lists the classes of some days with their places and waitlist', async () => {
    const monday = await slotNextWeek(0, '10:00', 1)
    await slotNextWeek(1, '10:00')
    await bookAs(ANA, monday, LUIS)
    await waitlist(monday, EVA)
    const start = await nextWeekDay(0)
    await asPerson(BEN)
    const list = await rpc('class_slots_for', { p_from: start, p_to: start })
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: monday, capacity: 1, booked_count: 1, waitlist_count: 1, my_status: null, status: 'open' })
    expect(await rpc('class_slots_for', { p_from: start, p_to: addGymDays(start, 1) })).toHaveLength(2)
  })

  it(`returns at most ${SLOT_LIST_MAX_DAYS} days per call`, async () => {
    await asSuperuser()
    const [{ today }] = await rows<{ today: string }>(`select public.gym_today()::text as today`)
    await rows(
      `insert into public.class_slots (starts_at, duration_minutes, capacity, name) values
        (public.gym_time_to_instant($1::date, '10:00'), 60, 5, 'Dentro'), (public.gym_time_to_instant($2::date, '10:00'), 60, 5, 'Fuera')`,
      [addGymDays(today, SLOT_LIST_MAX_DAYS - 1), addGymDays(today, SLOT_LIST_MAX_DAYS)],
    )
    await asPerson(ANA)
    const list = await rpc('class_slots_for', { p_from: today, p_to: addGymDays(today, 90) })
    expect(list.map((s) => s.name)).toEqual(['Dentro'])
  })

  it('adds a person; twice is refused, and a full class only with "add anyway"', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    expect(await bookAs(ANA, slot, LUIS)).toMatchObject({ status: 'booked', forced: false, over_quota: false })
    await expect(bookAs(BEN, slot, LUIS)).rejects.toThrow(/already_booked/)
    await expect(bookAs(BEN, slot, EVA)).rejects.toThrow(/slot_full/)
    expect(await bookAs(BEN, slot, EVA, true)).toMatchObject({ status: 'booked', forced: true })
    const ana = await profileId('ana')
    await asSuperuser()
    expect(await rows('select client_id, forced, added_by from public.bookings order by queue_order')).toEqual([
      { client_id: LUIS, forced: false, added_by: ana },
      { client_id: EVA, forced: true, added_by: await profileId('ben') },
    ])
  })

  it('warns, without refusing, when the person had used the classes of the week', async () => {
    const slots = [await slotNextWeek(0, '10:00', 5), await slotNextWeek(2, '10:00', 5), await slotNextWeek(6, '23:00', 5)]
    expect((await bookAs(ANA, slots[0], LUIS)).over_quota).toBe(false)
    expect((await bookAs(ANA, slots[1], LUIS)).over_quota).toBe(false)
    expect((await bookAs(ANA, slots[2], LUIS)).over_quota).toBe(true)
    expect((await bookAs(ANA, slots[2], SARA)).over_quota).toBe(false)
    expect((await bookAs(ANA, slots[1], SARA)).over_quota).toBe(true)
    for (const slot of slots) expect((await bookAs(ANA, slot, PABLO)).over_quota).toBe(false)
    const start = await nextWeekDay(2)
    await asPerson(ANA)
    expect(await rpc('staff_week_usage', { p_client_id: LUIS, p_week: start })).toEqual([
      { week_start: expect.anything(), used: 3, quota: 2 },
    ])
    expect((await rpc('staff_week_usage', { p_client_id: PABLO, p_week: start }))[0]).toMatchObject({ used: 3, quota: null })
    expect((await rpc('staff_week_usage', { p_client_id: MARTA, p_week: start }))[0]).toMatchObject({ used: 0, quota: 3 })
  })

  it('refuses people and classes that are not there, cancelled or over', async () => {
    const slot = await slotNextWeek(0, '10:00')
    const over = await slotIn(-120)
    await expect(bookAs(ANA, slot, 'nadie')).rejects.toThrow(/client_not_found/)
    await expect(bookAs(ANA, '00000000-0000-4000-8000-0000000000ff', LUIS)).rejects.toThrow(/slot_not_found/)
    await expect(bookAs(ANA, over, LUIS)).rejects.toThrow(/slot_finished/)
    const started = await slotIn(-10)
    expect((await bookAs(ANA, started, LUIS)).status).toBe('booked')
    await asPerson(ANA)
    await rpc('staff_update_slot', { p_slot_id: slot, p_status: 'cancelled' })
    await expect(bookAs(ANA, slot, LUIS)).rejects.toThrow(/slot_cancelled/)
    await expect(rpc('staff_update_slot', { p_slot_id: slot, p_status: 'open' })).rejects.toThrow(/slot_cancelled/)
  })

  it('removing someone lets in the first of the waitlist, who is told', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    const { booking_id } = await bookAs(ANA, slot, LUIS)
    await waitlist(slot, EVA, MARTA)
    await asPerson(BEN)
    expect(await rpc('staff_remove_booking', { p_booking_id: booking_id })).toEqual([
      { booking_id, slot_id: slot, client_id: LUIS, previous_status: 'booked', promoted: 1 },
    ])
    expect(await bookingsOf(slot)).toEqual([
      { client_id: LUIS, status: 'removed', forced: false },
      { client_id: EVA, status: 'booked', forced: false },
      { client_id: MARTA, status: 'waitlisted', forced: false },
    ])
    expect(await notices()).toEqual([
      { kind: 'removed', client_id: LUIS },
      { kind: 'promoted', client_id: EVA },
    ])
    await asPerson(BEN)
    await expect(rpc('staff_remove_booking', { p_booking_id: booking_id })).rejects.toThrow(/booking_not_found/)
  })

  it('removing someone from the waitlist lets nobody in, and the person can be added again', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    await bookAs(ANA, slot, LUIS)
    const [eva] = await waitlist(slot, EVA)
    await asPerson(ANA)
    expect((await rpc('staff_remove_booking', { p_booking_id: eva }))[0]).toMatchObject({ previous_status: 'waitlisted', promoted: 0 })
    expect((await bookAs(ANA, slot, EVA, true)).forced).toBe(true)
  })

  it('the waitlist goes in order and skips who has no classes left that week', async () => {
    const slot = await slotNextWeek(3, '10:00', 1)
    await bookAs(ANA, await slotNextWeek(0, '10:00'), EVA)
    await bookAs(ANA, await slotNextWeek(1, '10:00'), EVA)
    const { booking_id } = await bookAs(ANA, slot, MARTA)
    await waitlist(slot, EVA, LUIS, SARA)
    await asPerson(ANA)
    await rpc('staff_remove_booking', { p_booking_id: booking_id })
    expect((await bookingsOf(slot)).map((b) => [b.client_id, b.status])).toEqual([
      [MARTA, 'removed'],
      [EVA, 'waitlisted'],
      [LUIS, 'booked'],
      [SARA, 'waitlisted'],
    ])
  })

  it('more places let the waitlist in, in order; a closed class does not move it until it opens', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    await bookAs(ANA, slot, LUIS)
    await waitlist(slot, EVA, MARTA, SARA)
    await asPerson(ANA)
    expect(await rpc('staff_update_slot', { p_slot_id: slot, p_capacity: 3 })).toEqual([
      { slot_id: slot, status: 'open', capacity: 3, promoted: 2, notified: 0 },
    ])
    expect((await bookingsOf(slot)).map((b) => b.status)).toEqual(['booked', 'booked', 'booked', 'waitlisted'])
    await asPerson(ANA)
    expect((await rpc('staff_update_slot', { p_slot_id: slot, p_status: 'closed', p_capacity: 4 }))[0].promoted).toBe(0)
    expect((await rpc('staff_update_slot', { p_slot_id: slot, p_status: 'open' }))[0].promoted).toBe(1)
    await asSuperuser()
    expect(await rows('select edited from public.class_slots where id = $1', [slot])).toEqual([{ edited: true }])
  })

  it('a custom plan with absurd training days still moves the waitlist (kept within 7 a week)', async () => {
    await asSuperuser()
    await rows(`update public.clients set data = data || '{"trainingDays":1e12}' where id = $1`, [SARA])
    const slot = await slotNextWeek(0, '10:00', 1)
    await bookAs(ANA, slot, LUIS)
    await waitlist(slot, SARA)
    await asPerson(ANA)
    expect(await rpc('staff_week_usage', { p_client_id: SARA, p_week: toGymDate(Date.now()) })).toMatchObject([{ quota: 7 }])
    const [luis] = await rows<{ id: string }>('select id from public.bookings where slot_id = $1 and client_id = $2', [slot, LUIS])
    expect((await rpc('staff_remove_booking', { p_booking_id: luis.id }))[0].promoted).toBe(1)
  })

  it('the waitlist stops moving people in shortly before the class', async () => {
    const soon = await slotIn(BOOKING_DEFAULTS.promoteUntilMinutes - 5, 1)
    await bookAs(ANA, soon, LUIS)
    await waitlist(soon, EVA)
    await asPerson(ANA)
    expect((await rpc('staff_update_slot', { p_slot_id: soon, p_capacity: 2 }))[0].promoted).toBe(0)
    const later = await slotIn(BOOKING_DEFAULTS.promoteUntilMinutes + 5, 1)
    await bookAs(ANA, later, LUIS)
    await waitlist(later, EVA)
    await asPerson(ANA)
    expect((await rpc('staff_update_slot', { p_slot_id: later, p_capacity: 2 }))[0].promoted).toBe(1)
  })

  it('moving someone books the other class and lets the waitlist in where they left', async () => {
    const from = await slotNextWeek(0, '10:00', 1)
    const to = await slotNextWeek(0, '18:00', 1)
    const { booking_id } = await bookAs(ANA, from, LUIS)
    await waitlist(from, EVA)
    await asPerson(ANA)
    const [moved] = await rpc('staff_move_booking', { p_booking_id: booking_id, p_to_slot_id: to })
    expect(moved).toMatchObject({ status: 'booked', forced: false, over_quota: false, promoted: 1 })
    await asSuperuser()
    expect(await rows('select status, moved_to from public.bookings where id = $1', [booking_id])).toEqual([
      { status: 'removed', moved_to: moved.booking_id },
    ])
    expect((await bookingsOf(to)).map((b) => b.client_id)).toEqual([LUIS])
    expect((await bookingsOf(from)).map((b) => [b.client_id, b.status])).toEqual([
      [LUIS, 'removed'],
      [EVA, 'booked'],
    ])
    expect(await notices()).toEqual([
      { kind: 'moved', client_id: LUIS },
      { kind: 'promoted', client_id: EVA },
    ])
  })

  it('moving into a full class asks first, and nobody moves twice into one class', async () => {
    const from = await slotNextWeek(0, '10:00', 2)
    const to = await slotNextWeek(0, '18:00', 1)
    const luis = (await bookAs(ANA, from, LUIS)).booking_id
    const eva = (await bookAs(ANA, from, EVA)).booking_id
    await bookAs(ANA, to, MARTA)
    await asPerson(ANA)
    await expect(rpc('staff_move_booking', { p_booking_id: luis, p_to_slot_id: to })).rejects.toThrow(/slot_full/)
    expect((await bookingsOf(from)).map((b) => b.status)).toEqual(['booked', 'booked'])
    await asPerson(ANA)
    expect((await rpc('staff_move_booking', { p_booking_id: luis, p_to_slot_id: to, p_force: true }))[0].forced).toBe(true)
    await expect(rpc('staff_move_booking', { p_booking_id: eva, p_to_slot_id: from })).rejects.toThrow(/already_booked/)
    await bookAs(ANA, to, EVA, true)
    await asPerson(ANA)
    await expect(rpc('staff_move_booking', { p_booking_id: eva, p_to_slot_id: to })).rejects.toThrow(/already_booked/)
    await expect(rpc('staff_remove_booking', { p_booking_id: luis })).rejects.toThrow(/booking_not_found/)
  })

  it('a new time tells the people booked; cancelling the class cancels and tells everyone', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    await bookAs(ANA, slot, LUIS)
    await waitlist(slot, EVA)
    await asPerson(ANA)
    const [{ later }] = await rows<{ later: string }>(`select (starts_at + interval '1 hour')::text as later from public.class_slots where id = $1`, [slot])
    expect((await rpc('staff_update_slot', { p_slot_id: slot, p_starts_at: later }))[0].notified).toBe(2)
    expect((await rpc('staff_update_slot', { p_slot_id: slot, p_name: 'Otra' }))[0].notified).toBe(0)
    expect(await rpc('staff_update_slot', { p_slot_id: slot, p_status: 'cancelled' })).toEqual([
      { slot_id: slot, status: 'cancelled', capacity: 1, promoted: 0, notified: 2 },
    ])
    expect((await bookingsOf(slot)).map((b) => b.status)).toEqual(['slot_cancelled', 'slot_cancelled'])
    expect((await notices()).map((n) => n.kind)).toEqual(['slot_changed', 'slot_changed', 'slot_cancelled', 'slot_cancelled'])
  })

  it('adds a class by hand, never one already over', async () => {
    await asPerson(BEN)
    const tomorrow = new Date(Math.ceil(Date.now() / 60_000) * 60_000 + 86_400_000).toISOString()
    const id = await rpc('staff_create_slot', { p_starts_at: tomorrow, p_duration_minutes: 45, p_capacity: 6, p_name: '  Movilidad ' })
    await asSuperuser()
    expect(await rows('select name, capacity, template_id, edited from public.class_slots where id = $1', [id])).toEqual([
      { name: 'Movilidad', capacity: 6, template_id: null, edited: true },
    ])
    await asPerson(BEN)
    const past = new Date(Math.floor(Date.now() / 60_000) * 60_000 - 3 * 3_600_000).toISOString()
    await expect(rpc('staff_create_slot', { p_starts_at: past, p_duration_minutes: 60, p_capacity: 6, p_name: 'Tarde' })).rejects.toThrow(/slot_finished/)
  })
})

describe('classes and bookings: the week of the gym', () => {
  beforeEach(seedBookingClients)

  const bookAt = async (local: string) => {
    await asSuperuser()
    const [day, time] = local.split(' ')
    const [{ id }] = await rows<{ id: string }>(
      `insert into public.class_slots (starts_at, duration_minutes, capacity, name)
       values (public.gym_time_to_instant($1::date, $2::time), 60, 5, 'Funcional') returning id`,
      [day, time],
    )
    await rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'booked')`, [id, LUIS])
    return id
  }

  const used = async (day: string) => {
    await asPerson(ANA)
    return (await rpc('staff_week_usage', { p_client_id: LUIS, p_week: day }))[0].used
  }

  it('Sunday 23:30 and Monday 00:30, gym time, are different weeks, in summer and in winter', async () => {
    await bookAt('2026-03-29 23:30')
    await bookAt('2026-03-30 00:30')
    await bookAt('2026-11-01 23:30')
    await bookAt('2026-11-02 00:30')
    expect(await used('2026-03-29')).toBe(1)
    expect(await used('2026-03-23')).toBe(1)
    expect(await used('2026-03-30')).toBe(1)
    expect(await used('2026-11-01')).toBe(1)
    expect(await used('2026-11-08')).toBe(1)
    await asSuperuser()
    expect(await rows(`select gym_date::text from public.class_slots order by starts_at`)).toEqual(
      ['2026-03-29', '2026-03-30', '2026-11-01', '2026-11-02'].map((gym_date) => ({ gym_date })),
    )
  })

  it('a late cancellation counts while the rules say so; the waitlist, a removal or a cancelled class do not', async () => {
    await bookAt('2026-06-10 10:00')
    const setStatus = async (status: string) => {
      await asSuperuser()
      await rows('update public.bookings set status = $1 where client_id = $2', [status, LUIS])
    }
    expect(await used('2026-06-10')).toBe(1)
    await setStatus('late_cancelled')
    expect(await used('2026-06-10')).toBe(1)
    await asSuperuser()
    await rows('update public.booking_settings set late_cancel_counts = false')
    expect(await used('2026-06-10')).toBe(0)
    await asSuperuser()
    await rows('update public.booking_settings set late_cancel_counts = true')
    for (const status of ['waitlisted', 'removed', 'slot_cancelled', 'cancelled']) {
      await setStatus(status)
      expect(await used('2026-06-10'), status).toBe(0)
    }
  })

  it('a late cancellation stops counting once the gym cancels that class', async () => {
    const slot = await slotNextWeek(0, '10:00')
    await bookAs(ANA, slot, LUIS)
    await asSuperuser()
    await rows(`update public.bookings set status = 'late_cancelled' where client_id = $1`, [LUIS])
    const day = (await rows<{ d: string }>('select gym_date::text as d from public.class_slots where id = $1', [slot]))[0].d
    expect(await used(day)).toBe(1)
    await asPerson(ANA)
    await rpc('staff_update_slot', { p_slot_id: slot, p_status: 'cancelled' })
    expect(await used(day)).toBe(0)
  })
})

describe('classes and bookings: who can do what', () => {
  beforeEach(seedBookingClients)

  it('nobody writes classes or bookings directly, not even an admin: only through the functions', async () => {
    const slot = await slotNextWeek(0, '10:00')
    await bookAs(ANA, slot, LUIS)
    for (const who of [ADMIN, ANA]) {
      await asPerson(who)
      expect(await count('class_slots')).toBe(1)
      expect(await count('bookings')).toBe(1)
      await expect(rows(`insert into public.class_slots (starts_at, duration_minutes, capacity, name) values (now(), 60, 5, 'X')`)).rejects.toThrow(/permission denied/)
      await expect(rows(`update public.class_slots set capacity = 99`)).rejects.toThrow(/permission denied/)
      await expect(rows(`delete from public.class_slots`)).rejects.toThrow(/permission denied/)
      await expect(rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'booked')`, [slot, EVA])).rejects.toThrow(/permission denied/)
      await expect(rows(`update public.bookings set status = 'booked'`)).rejects.toThrow(/permission denied/)
      await expect(rows(`delete from public.bookings`)).rejects.toThrow(/permission denied/)
      await expect(count('notification_outbox')).rejects.toThrow(/permission denied/)
    }
  })

  it('the inner functions are not for the app', async () => {
    await asPerson(ADMIN)
    for (const call of [
      `select public.ensure_class_slots(current_date, current_date + 1)`,
      `select public.promote_waitlist(gen_random_uuid())`,
      `select public.weekly_quota('c1')`,
      `select public.week_usage('c1', current_date)`,
      `select public.enqueue_notification('promoted', 'c1', null)`,
      `select public.booking_rules()`,
      `select public.gym_time_to_instant(current_date, '10:00')`,
    ]) {
      await expect(rows(call), call).rejects.toThrow(/permission denied/)
    }
  })

  for (const [label, enter] of [
    ['a signed-in stranger', () => asPerson(STRANGER)],
    ['a deactivated coach', () => asPerson(FORMER)],
    ['a coach still on a temporary password', () => asPerson(NEWBIE)],
  ] as const) {
    it(`${label} sees no class and can do nothing`, async () => {
      const slot = await slotNextWeek(0, '10:00')
      await bookAs(ANA, slot, LUIS)
      await enter()
      for (const table of ['booking_settings', 'class_templates', 'class_slots', 'bookings']) expect(await count(table), table).toBe(0)
      const today = toGymDate(Date.now())
      await expect(rpc('class_slots_for', { p_from: today, p_to: today })).rejects.toThrow(/not_allowed/)
      await expect(rpc('staff_add_booking', { p_slot_id: slot, p_client_id: EVA })).rejects.toThrow(/not_allowed/)
      await expect(rpc('staff_update_slot', { p_slot_id: slot, p_capacity: 9 })).rejects.toThrow(/not_allowed/)
      await expect(rpc('staff_week_usage', { p_client_id: LUIS, p_week: today })).rejects.toThrow(/not_allowed/)
      await expect(
        rpc('staff_create_slot', { p_starts_at: new Date(Date.now() + 86_400_000).toISOString(), p_duration_minutes: 60, p_capacity: 5, p_name: 'X' }),
      ).rejects.toThrow(/not_allowed/)
    })
  }

  it('anonymous visitors cannot call any of it', async () => {
    const slot = await slotNextWeek(0, '10:00')
    const [booking] = await waitlist(slot, LUIS)
    await asAnon()
    const today = toGymDate(Date.now())
    await expect(rpc('class_slots_for', { p_from: today, p_to: today })).rejects.toThrow(/permission denied/)
    await expect(rpc('staff_add_booking', { p_slot_id: slot, p_client_id: EVA })).rejects.toThrow(/permission denied/)
    await expect(rpc('staff_remove_booking', { p_booking_id: booking })).rejects.toThrow(/permission denied/)
    await expect(rpc('staff_move_booking', { p_booking_id: booking, p_to_slot_id: slot })).rejects.toThrow(/permission denied/)
    await expect(rpc('staff_week_usage', { p_client_id: LUIS, p_week: today })).rejects.toThrow(/permission denied/)
  })
})

describe('classes and bookings: the last place and running the file again', () => {
  beforeEach(seedBookingClients)

  // PGlite is one connection, so two bookings cannot really run at the same time here. What is checked instead:
  // a booking takes the row locks that make a second one wait (the person, then the class), the second one then
  // finds the class full, and the unique index refuses two live bookings of one person whatever the code does.
  // A test with two real sessions needs Postgres (plan: Supabase CLI on a test project, before publishing).
  it('the last place goes to one person: the booking locks the person and the class until it ends', async () => {
    const slot = await slotNextWeek(0, '10:00', 1)
    await asPerson(ANA)
    await db.exec('begin')
    await rpc('staff_add_booking', { p_slot_id: slot, p_client_id: LUIS })
    const [locks] = await rows<{ person: boolean; slot: boolean; other: boolean }>(
      `select (select xmax::text from public.clients where id = $1) = pg_current_xact_id()::text as person,
         (select xmax::text from public.class_slots where id = $2) = pg_current_xact_id()::text as slot,
         (select xmax::text from public.clients where id = $3) = pg_current_xact_id()::text as other`,
      [LUIS, slot, EVA],
    )
    await db.exec('commit')
    expect(locks).toEqual({ person: true, slot: true, other: false })
    await asPerson(BEN)
    await expect(rpc('staff_add_booking', { p_slot_id: slot, p_client_id: EVA })).rejects.toThrow(/slot_full/)
    expect((await bookingsOf(slot)).map((b) => b.client_id)).toEqual([LUIS])
    await asSuperuser()
    await expect(rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'waitlisted')`, [slot, LUIS])).rejects.toThrow(
      /bookings_one_active_idx/,
    )
  })

  it('old notices go away by themselves after 30 days', async () => {
    await asSuperuser()
    await rows(`insert into public.notification_outbox (kind, client_id, created_at) values ('promoted', $1, now() - interval '31 days')`, [LUIS])
    const slot = await slotNextWeek(0, '10:00', 1)
    const { booking_id } = await bookAs(ANA, slot, LUIS)
    await asPerson(ANA)
    await rpc('staff_remove_booking', { p_booking_id: booking_id })
    expect(await notices()).toEqual([{ kind: 'removed', client_id: LUIS }])
  })

  it('running the whole file again keeps the timetable, the rules, the classes and the bookings', async () => {
    await asPerson(ADMIN)
    await rows(`update public.booking_settings set horizon_days = 7, quota_plus = 5`)
    await rows(`insert into public.class_templates (weekday, start_time, duration_minutes, capacity, name) values (3, '18:00', 60, 8, 'Fuerza')`)
    const slot = await slotNextWeek(0, '10:00', 1)
    await bookAs(ANA, slot, LUIS)
    await waitlist(slot, EVA)
    await asSuperuser()
    const snapshot = async () => ({
      settings: await rows('select * from public.booking_settings'),
      templates: await rows('select * from public.class_templates'),
      slots: await rows('select * from public.class_slots order by id'),
      bookings: await rows('select * from public.bookings order by id'),
    })
    const before = await snapshot()
    await db.exec(SCHEMA)
    expect(await snapshot()).toEqual(before)
  })
})

// ── The day each person did (training sessions) ──────────────────────────────

describe('training sessions: the same cases as the local rule (shared/routine/sessionCases.ts)', () => {
  async function seedCasePeople(): Promise<void> {
    await asSuperuser()
    for (const [id, person] of Object.entries(SESSION_CASE_PEOPLE)) {
      const client = { firstName: id, archived: person.archived, currentProgramId: person.routine?.id ?? null }
      await rows(`insert into public.clients (id, data) values ($1, $2)`, [id, JSON.stringify(client)])
      if (person.routine) {
        const program = { clientId: id, days: person.routine.dayIds.map((dayId) => ({ id: dayId })) }
        await rows(`insert into public.programs (id, data) values ($1, $2)`, [person.routine.id, JSON.stringify(program)])
      }
    }
    await db.exec(`
      delete from public.screen_sections;
      insert into public.screens (id, data) values ('2', '{"name":"Pantalla 2","sections":3}');
    `)
  }

  /** Writes those sections in one request, as the app does. */
  const putSections = (entries: ReadonlyArray<readonly [string, readonly [string | null, number]]>) =>
    rows(
      `insert into public.screen_sections (id, screen_id, data)
       select x.id, split_part(x.id, ':', 1), x.data from jsonb_to_recordset($1::jsonb) as x(id text, data jsonb)
       on conflict (id) do update set data = excluded.data`,
      [JSON.stringify(entries.map(([id, [clientId, day]]) => ({ id, data: { clientId, day, assignedAt: '' } })))],
    )

  const sessions = async () => {
    await asSuperuser()
    return rows<{ clientId: string; dayNumber: number; daysAgo: number }>(
      `select client_id as "clientId", day_number as "dayNumber", (public.gym_today() - gym_date) as "daysAgo"
       from public.training_sessions order by client_id, gym_date`,
    )
  }

  beforeEach(seedCasePeople)

  for (const testCase of SESSION_CASES) {
    it(testCase.name, async () => {
      await asSuperuser()
      if (Object.keys(testCase.before).length) await putSections(Object.entries(testCase.before))
      await db.exec('delete from public.training_sessions')
      for (const s of testCase.existing ?? []) {
        const routine = SESSION_CASE_PEOPLE[s.clientId].routine
        await rows(
          `insert into public.training_sessions (client_id, gym_date, program_id, day_id, day_number, created_at)
           values ($1, public.gym_today() - $2::int, $3, $4, $5, now() - make_interval(mins => $6::int))`,
          [s.clientId, s.daysAgo ?? 0, routine?.id ?? '', routine?.dayIds[s.dayNumber - 1] ?? null, s.dayNumber, s.minutesAgo],
        )
      }
      const changed = Object.entries(testCase.after).filter(
        ([id, [who, day]]) => testCase.before[id]?.[0] !== who || testCase.before[id]?.[1] !== day,
      )
      const gone = Object.keys(testCase.before).filter((id) => !(id in testCase.after))
      await asPerson(ANA)
      if (changed.length) await putSections(changed)
      if (gone.length) await rows(`delete from public.screen_sections where id = any($1::text[])`, [gone])
      const expected = testCase.expected
        .map((s) => ({ clientId: s.clientId, dayNumber: s.dayNumber, daysAgo: s.daysAgo ?? 0 }))
        .sort((a, b) => a.clientId.localeCompare(b.clientId) || b.daysAgo - a.daysAgo)
      expect(await sessions()).toEqual(expected)
    })
  }
})

describe('training sessions: what each one keeps and who sees them', () => {
  const LAURA = 'laura'

  beforeEach(async () => {
    await asSuperuser()
    await db.exec(`
      insert into public.clients (id, data) values ('laura', '{"firstName":"Laura","currentProgramId":"p-laura"}');
      insert into public.programs (id, data) values ('p-laura', '{"clientId":"laura","days":[{"id":"l1"},{"id":"l2"},{"id":"l3"}]}');
      delete from public.screen_sections;
    `)
  })

  const show = async (day: number, who: string | null = LAURA) => {
    await asPerson(BEN)
    await rows(
      `insert into public.screen_sections (id, screen_id, data) values ('1:1', '1', $1) on conflict (id) do update set data = excluded.data`,
      [JSON.stringify({ clientId: who, day, assignedAt: '' })],
    )
  }

  const recorded = async () => {
    await asSuperuser()
    return rows<{ program_id: string; day_id: string; day_number: number; slot_id: string | null; created_at: string; today: boolean }>(
      `select program_id, day_id, day_number, slot_id, created_at::text, gym_date = public.gym_today() as today from public.training_sessions`,
    )
  }

  const bookLaura = async (startsInMinutes: number) => {
    const slot = await slotIn(startsInMinutes, 4)
    await rows(`insert into public.bookings (slot_id, client_id, status) values ($1, $2, 'booked')`, [slot, LAURA])
    return slot
  }

  it('records the routine, the day and the gym date, written by a coach through the screen alone', async () => {
    await show(2)
    expect(await recorded()).toEqual([expect.objectContaining({ program_id: 'p-laura', day_id: 'l2', day_number: 2, slot_id: null, today: true })])
  })

  it('a current routine of someone else is no routine: nothing recorded (as localSessionContext)', async () => {
    await asSuperuser()
    await db.exec(`insert into public.clients (id, data) values ('pablo', '{"firstName":"Pablo","currentProgramId":"p-laura"}')`)
    await show(1, 'pablo')
    expect(await recorded()).toEqual([])
  })

  it('keeps the class she holds a place in now, from 10 minutes before it starts', async () => {
    const slot = await bookLaura(10)
    await bookLaura(120)
    await show(1)
    expect((await recorded())[0].slot_id).toBe(slot)
  })

  it('sending another day keeps when it was first recorded', async () => {
    await show(1)
    await asSuperuser()
    await rows(`update public.training_sessions set created_at = now() - interval '1 hour'`)
    const [before] = await recorded()
    await show(3)
    const [after] = await recorded()
    expect(after).toMatchObject({ day_number: 3, day_id: 'l3', created_at: before.created_at })
  })

  it('a removed screen takes its people off: within 10 minutes their session goes', async () => {
    await show(2)
    await asPerson(ANA)
    await rows(`delete from public.screens where id = '1'`)
    expect(await recorded()).toEqual([])
  })

  it('uses the limits of the app: 10 minutes to undo, 10 before a class', () => {
    expect(SESSION_UNDO_MINUTES).toBe(10)
    expect(SCHEMA).toContain(`t.created_at > now() - interval '${SESSION_UNDO_MINUTES} minutes'`)
    expect(SCHEMA).toContain(`now() >= s.starts_at - interval '${FILL_LEAD_MINUTES} minutes'`)
  })

  it('the team reads them; nobody writes them directly, nor calls the inner functions', async () => {
    await show(2)
    await asPerson(ADMIN)
    expect(await count('training_sessions')).toBe(1)
    await expect(
      rows(`insert into public.training_sessions (client_id, gym_date, program_id, day_number) values ('laura', current_date, 'p', 1)`),
    ).rejects.toThrow(/permission denied/)
    await expect(rows(`update public.training_sessions set day_number = 3`)).rejects.toThrow(/permission denied/)
    await expect(rows(`delete from public.training_sessions`)).rejects.toThrow(/permission denied/)
    await expect(rows(`select public.session_slot('laura')`)).rejects.toThrow(/permission denied/)
  })

  for (const [label, enter] of [
    ['a signed-in stranger', () => asPerson(STRANGER)],
    ['a deactivated coach', () => asPerson(FORMER)],
    ['a coach still on a temporary password', () => asPerson(NEWBIE)],
  ] as const) {
    it(`${label} sees none`, async () => {
      await show(2)
      await enter()
      expect(await count('training_sessions')).toBe(0)
    })
  }

  it('anonymous visitors cannot read them', async () => {
    await show(2)
    await asAnon()
    await expect(rows('select * from public.training_sessions')).rejects.toThrow(/permission denied/)
  })

  it('go away with their person, and a removed class only loses its link', async () => {
    const slot = await bookLaura(0)
    await show(2)
    await asSuperuser()
    await rows(`delete from public.class_slots where id = $1`, [slot])
    expect((await recorded())[0].slot_id).toBeNull()
    await rows(`delete from public.clients where id = $1`, [LAURA])
    expect(await recorded()).toEqual([])
  })

  it('running the whole file again keeps them', async () => {
    await show(2)
    await asSuperuser()
    const before = await rows('select * from public.training_sessions')
    await db.exec(SCHEMA)
    expect(await rows('select * from public.training_sessions')).toEqual(before)
  })
})
