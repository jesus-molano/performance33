// One table of cases for the session rule, run against the SQL trigger (supabase/schema.test.ts, PGlite) and against
// its local mirror (sessionRule.test.ts). Each case is one change of the sections, as one request: rows in `after` that
// differ from `before` are written together, rows missing from `after` are deleted (never both in one case).

/** People of every case, and their current routine. */
export const SESSION_CASE_PEOPLE = {
  laura: { archived: false, routine: { id: 'p-laura', dayIds: ['l1', 'l2', 'l3'] } },
  marta: { archived: false, routine: { id: 'p-marta', dayIds: ['m1', 'm2'] } },
  sergio: { archived: true, routine: { id: 'p-sergio', dayIds: ['s1'] } },
  lucia: { archived: false, routine: null },
} as const

export type SessionCasePerson = keyof typeof SESSION_CASE_PEOPLE

/** Section id → [who, day]. */
export type SessionCaseSections = Readonly<Record<string, readonly [SessionCasePerson | null, number]>>

export interface SessionCaseSession {
  clientId: SessionCasePerson
  dayNumber: number
  /** 0 = today, 1 = yesterday (gym dates). */
  daysAgo?: number
}

export interface SessionCase {
  name: string
  before: SessionCaseSections
  after: SessionCaseSections
  /** Sessions there before the change, first recorded that many minutes ago. */
  existing?: ReadonlyArray<SessionCaseSession & { minutesAgo: number }>
  /** Every session after it, in any order. */
  expected: readonly SessionCaseSession[]
}

export const SESSION_CASES: readonly SessionCase[] = [
  {
    name: 'putting someone on a screen records the day they show today',
    before: {},
    after: { '1:1': ['laura', 2] },
    expected: [{ clientId: 'laura', dayNumber: 2 }],
  },
  {
    name: 'a day past the last of the routine counts as the last one',
    before: {},
    after: { '1:1': ['laura', 5] },
    expected: [{ clientId: 'laura', dayNumber: 3 }],
  },
  {
    name: 'another day the same day changes the session, not adds one',
    before: { '1:1': ['laura', 2] },
    after: { '1:1': ['laura', 3] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 30 }],
    expected: [{ clientId: 'laura', dayNumber: 3 }],
  },
  {
    name: 'taken off within 10 minutes: it was a mistake, the session goes',
    before: { '1:1': ['laura', 2] },
    after: { '1:1': [null, 1] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 9 }],
    expected: [],
  },
  {
    name: 'taken off later: they trained, the session stays',
    before: { '1:1': ['laura', 2] },
    after: { '1:1': [null, 1] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 11 }],
    expected: [{ clientId: 'laura', dayNumber: 2 }],
  },
  {
    name: 'taken off one section while still on another: the session stays',
    before: { '1:1': ['laura', 2], '2:1': ['laura', 2] },
    after: { '1:1': [null, 1], '2:1': ['laura', 2] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 1 }],
    expected: [{ clientId: 'laura', dayNumber: 2 }],
  },
  {
    name: 'moved to another section in one change: the session stays',
    before: { '1:1': ['laura', 2], '1:2': [null, 1] },
    after: { '1:1': [null, 1], '1:2': ['laura', 2] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 1 }],
    expected: [{ clientId: 'laura', dayNumber: 2 }],
  },
  {
    name: 'replaced by someone else right away: only the new person trains today',
    before: { '1:1': ['laura', 2] },
    after: { '1:1': ['marta', 1] },
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 2 }],
    expected: [{ clientId: 'marta', dayNumber: 1 }],
  },
  {
    name: 'two sections swapping people keeps both',
    before: { '1:1': ['laura', 2], '1:2': ['marta', 1] },
    after: { '1:1': ['marta', 1], '1:2': ['laura', 2] },
    existing: [
      { clientId: 'laura', dayNumber: 2, minutesAgo: 2 },
      { clientId: 'marta', dayNumber: 1, minutesAgo: 2 },
    ],
    expected: [
      { clientId: 'laura', dayNumber: 2 },
      { clientId: 'marta', dayNumber: 1 },
    ],
  },
  {
    name: 'archived people and people without a routine are never recorded',
    before: {},
    after: { '1:1': ['sergio', 1], '1:2': ['lucia', 1] },
    expected: [],
  },
  {
    name: 'a section that goes away (fewer sections) counts as taking the person off',
    before: { '1:3': ['laura', 2] },
    after: {},
    existing: [{ clientId: 'laura', dayNumber: 2, minutesAgo: 3 }],
    expected: [],
  },
  {
    name: "yesterday's session never goes away",
    before: { '1:1': ['laura', 1] },
    after: { '1:1': [null, 1] },
    existing: [{ clientId: 'laura', dayNumber: 1, daysAgo: 1, minutesAgo: 5 }],
    expected: [{ clientId: 'laura', dayNumber: 1, daysAgo: 1 }],
  },
  {
    name: 'a new day keeps the sessions of the days before',
    before: {},
    after: { '1:1': ['laura', 2] },
    existing: [{ clientId: 'laura', dayNumber: 1, daysAgo: 2, minutesAgo: 2 * 24 * 60 }],
    expected: [
      { clientId: 'laura', dayNumber: 1, daysAgo: 2 },
      { clientId: 'laura', dayNumber: 2 },
    ],
  },
]
