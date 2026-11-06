// Made-up data for the offline demo: one member, a timetable and a routine. No real person.

import type { MyMemberRow } from '@shared/booking/memberRpc.ts'
import type { PublicBlock, PublicExerciseEntry, PublicProgram } from '@shared/routine/types.ts'

export const DEMO_CLIENT_ID = 'demo-client'

export const DEMO_MEMBER: MyMemberRow = {
  client_id: DEMO_CLIENT_ID,
  username: 'laura.demo',
  email: null,
  first_name: 'Laura',
  color: '#d6449a',
  plan: 'plus',
  must_change_password: false,
  temporary_password_expired: false,
}

/** A username starting with this signs in on a temporary password, to try the first sign-in. */
export const DEMO_NEW_ACCOUNT_PREFIX = 'nuevo'

/** Weekly classes of the plan above (Plus). */
export const DEMO_WEEKLY_QUOTA = 3

/** The timetable, Monday to Saturday: start (minutes from midnight, gym time) and length. */
export const DEMO_TIMETABLE = [
  { start: 7 * 60 + 30, duration: 60, name: 'Entrenamiento' },
  { start: 9 * 60 + 30, duration: 60, name: 'Entrenamiento' },
  { start: 18 * 60, duration: 60, name: 'Entrenamiento' },
  { start: 19 * 60 + 30, duration: 60, name: 'Entrenamiento' },
] as const

export const DEMO_CAPACITY = 10
/** Classes are open Monday (1) to Saturday (6). */
export const DEMO_LAST_WEEKDAY = 6

const exercise = (id: string, name: string, extra: Partial<PublicExerciseEntry> = {}): PublicExerciseEntry => ({
  id,
  libraryId: null,
  name,
  measure: 'reps',
  sets: 4,
  reps: '8-10',
  durationSec: null,
  distanceM: null,
  calories: null,
  load: '',
  loadUnit: 'kg',
  rmKg: null,
  tempo: '',
  restSec: null,
  perSide: false,
  cue: '',
  progression: null,
  ...extra,
})

const block = (id: string, type: PublicBlock['type'], exercises: PublicExerciseEntry[], extra: Partial<PublicBlock> = {}): PublicBlock => ({
  id,
  type,
  title: '',
  params: {},
  note: '',
  text: '',
  exercises,
  ...extra,
})

/** A four-week routine of three days, running from `startDate`. */
export function demoProgram(startDate: string, endDate: string): PublicProgram {
  return {
    id: 'demo-program',
    clientId: DEMO_CLIENT_ID,
    name: 'Fuerza otoño',
    startDate,
    endDate,
    weeks: 4,
    createdAt: `${startDate}T08:00:00.000Z`,
    days: [
      {
        id: 'demo-day-1',
        name: 'Día 1',
        label: 'Pierna',
        blocks: [
          block('d1-warmup', 'warmup', [], { params: { durationMin: 10 }, text: 'Bici suave 5 min\nMovilidad de cadera' }),
          block('d1-a', 'normal', [
            exercise('d1-a1', 'Sentadilla trasera', {
              load: '60',
              restSec: 120,
              tempo: '3-1-1-0',
              cue: 'Rodillas hacia fuera',
              progression: { target: 'load', values: ['60', '62,5', '65', '67,5'] },
            }),
          ]),
          block('d1-b', 'superset', [
            exercise('d1-b1', 'Peso muerto rumano', { sets: null, reps: '10', load: '40' }),
            exercise('d1-b2', 'Zancada búlgara', { sets: null, reps: '8', perSide: true }),
          ], { params: { rounds: 3, restBetweenRoundsSec: 90 } }),
          block('d1-cool', 'cooldown', [], { text: 'Estiramientos de cuádriceps y femoral' }),
        ],
      },
      {
        id: 'demo-day-2',
        name: 'Día 2',
        label: 'Empuje',
        blocks: [
          block('d2-a', 'normal', [
            exercise('d2-a1', 'Press banca', { load: '35', restSec: 90 }),
            exercise('d2-a2', 'Press militar con mancuernas', { sets: 3, reps: '10', load: '10' }),
          ]),
          block('d2-b', 'emom', [
            exercise('d2-b1', 'Flexiones', { sets: null, reps: '10' }),
            exercise('d2-b2', 'Plancha', { sets: null, measure: 'time', reps: '', durationSec: 30 }),
          ], { params: { everyMin: 1, durationMin: 10 }, note: 'Mantén la técnica limpia' }),
        ],
      },
      {
        id: 'demo-day-3',
        name: 'Día 3',
        label: 'Tirón',
        blocks: [
          block('d3-a', 'circuit', [
            exercise('d3-a1', 'Remo con mancuerna', { sets: null, reps: '12', perSide: true }),
            exercise('d3-a2', 'Jalón al pecho', { sets: null, reps: '12', load: '30' }),
            exercise('d3-a3', 'Remo en máquina', { sets: null, measure: 'calories', reps: '', calories: 12 }),
          ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
        ],
      },
    ],
  }
}
