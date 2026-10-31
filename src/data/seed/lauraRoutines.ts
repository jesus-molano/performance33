// Laura · Plus (3 días). Shoulder issue: no overhead pressing in her routines.

import type { Day } from '@/types'
import { WARMUP_TEXT, block, day, ex, kgProgression, roundEx } from './builders'

const warmup = () => block('warmup', [], { text: WARMUP_TEXT, params: { durationMin: 10 } })

export function lauraCurrentDays(): Day[] {
  return [
    day(0, 'Pierna', [
      warmup(),
      block('normal', [
        ex('sentadilla-trasera', {
          sets: 4,
          reps: '6-8',
          load: '50',
          restSec: 120,
          tempo: '3-1-1-0',
          cue: 'Rodillas hacia fuera, pecho alto',
          progression: kgProgression('50', '52,5', '55', '47,5'),
        }),
        ex('peso-muerto-rumano', { sets: 3, reps: '10', load: '40', restSec: 90, cue: 'Espalda neutra' }),
      ]),
      block('superset', [
        ex('zancadas-caminando', { reps: '10 c/lado', load: 'KB 12', loadUnit: 'text', sets: null }),
        ex('hip-thrust', { reps: '12', load: '60', sets: null, progression: kgProgression('60', '65', '70', '60') }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 90 } }),
      block('cooldown', [
        ex('paloma', { sets: null, durationSec: 45, perSide: true }),
        ex('estiramiento-flexor-cadera', { sets: null, durationSec: 30, perSide: true }),
      ]),
    ]),
    day(1, 'Tirón y empuje horizontal', [
      warmup(),
      block('normal', [
        ex('press-banca-mancuernas', {
          sets: 4,
          reps: '8-10',
          load: '14',
          restSec: 90,
          internalNote: 'Hombro dcho.: agarre neutro, sin bajar más allá de 90°',
        }),
        ex('remo-pecho-apoyado', { sets: 4, reps: '10', load: '16', restSec: 90, cue: 'Escápulas atrás y abajo' }),
      ]),
      block('superset', [
        ex('jalon-pecho', { sets: null, reps: '12', load: '35' }),
        ex('face-pull', { sets: null, reps: '15', load: 'banda roja', loadUnit: 'text' }),
        ex('dead-bug', { sets: null, reps: '8 c/lado', loadUnit: 'text' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
    ]),
    day(2, 'Full body metabólico', [
      warmup(),
      block('circuit', [
        roundEx('kettlebell-swing', { reps: '15', load: 'KB 16', loadUnit: 'text' }),
        roundEx('step-up', { reps: '8 c/lado', load: '8', cue: 'Sube con el talón' }),
        roundEx('remo-trx', { reps: '12' }),
        roundEx('remo-ergometro-calorias', { calories: 12 }),
      ], { params: { rounds: 4, restBetweenRoundsSec: 90 }, note: 'Ritmo constante, sin parar entre ejercicios' }),
      block('amrap', [
        roundEx('sentadilla-goblet', { reps: '10', load: 'KB 16', loadUnit: 'text' }),
        roundEx('plancha-toques-hombro', { reps: '20' }),
        roundEx('comba', { reps: '50' }),
      ], { params: { timeCapMin: 8 } }),
    ]),
  ]
}

export function lauraPreviousDays(): Day[] {
  return [
    day(0, 'Pierna', [
      warmup(),
      block('normal', [
        ex('sentadilla-goblet', { sets: 4, reps: '10', load: 'KB 16', loadUnit: 'text', restSec: 90 }),
        ex('peso-muerto-kettlebell', { sets: 3, reps: '12', load: 'KB 20', loadUnit: 'text', restSec: 90 }),
        ex('puente-gluteo', { sets: 3, reps: '15', restSec: 60 }),
      ]),
    ]),
    day(1, 'Torso', [
      warmup(),
      block('normal', [
        ex('flexiones-inclinadas', { sets: 3, reps: '10', restSec: 60 }),
        ex('remo-mancuerna', { sets: 3, reps: '10 c/lado', load: '12', restSec: 60 }),
        ex('plancha', { sets: 3, durationSec: 30, restSec: 45 }),
      ]),
    ]),
    day(2, 'Acondicionamiento', [
      warmup(),
      block('emom', [roundEx('kettlebell-swing', { reps: '12', load: 'KB 12', loadUnit: 'text' }), roundEx('burpee', { reps: '8' })], {
        params: { everyMin: 1, durationMin: 10 },
      }),
    ]),
  ]
}
