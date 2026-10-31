// Javier (Standard, 2 días), Carlos (Plus, caducada) and Andrés (1 día).

import type { Day } from '@/types'
import { WARMUP_TEXT, block, day, ex, roundEx } from './builders'

export function javierDays(): Day[] {
  return [
    day(0, 'Full body A', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('peso-muerto-trap-bar', { sets: 4, reps: '6', load: '80', restSec: 120 }),
        ex('press-inclinado-mancuernas', { sets: 3, reps: '10', load: '20', restSec: 90 }),
        ex('remo-mancuerna', { sets: 3, reps: '10 c/lado', load: '22', restSec: 60 }),
      ]),
      block('circuit', [
        roundEx('paseo-granjero', { distanceM: 40, load: '2 × 24 kg', loadUnit: 'text' }),
        roundEx('pallof-press', { reps: '10 c/lado', load: 'banda azul', loadUnit: 'text' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
    ]),
    day(1, 'Full body B', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('sentadilla-trasera', { sets: 4, reps: '8', load: '70', restSec: 120 }),
        ex('dominadas-asistidas-banda', { sets: 3, reps: '8', load: 'banda roja', loadUnit: 'text', restSec: 90 }),
        ex('press-suelo', { sets: 3, reps: '10', load: '50', restSec: 90 }),
      ]),
      block('tabata', [roundEx('bike-erg', { durationSec: 30 })], { params: { workSec: 30, restSec: 30, rounds: 8 } }),
    ]),
  ]
}

export function carlosDays(): Day[] {
  return [
    day(0, 'Pierna', [
      block('normal', [
        ex('sentadilla-goblet', { sets: 3, reps: '12', load: 'KB 20', loadUnit: 'text', restSec: 90 }),
        ex('zancada-atras', { sets: 3, reps: '10 c/lado', load: '10', restSec: 60 }),
      ]),
    ]),
    day(1, 'Torso', [
      block('normal', [
        ex('flexiones', { sets: 3, reps: 'máx', restSec: 90 }),
        ex('remo-invertido', { sets: 3, reps: '10', restSec: 60 }),
      ]),
    ]),
    day(2, 'Cardio', [
      block('circuit', [roundEx('remo-ergometro', { distanceM: 500 }), roundEx('burpee', { reps: '10' })], {
        params: { rounds: 4, restBetweenRoundsSec: 120 },
      }),
    ]),
  ]
}

export function andresDays(): Day[] {
  return [
    day(0, 'Full body', [
      block('warmup', [ex('movilidad-tobillo', { sets: 2, reps: '10 c/lado' }), ex('inchworm', { sets: 2, reps: '5' })]),
      block('circuit', [
        roundEx('sentadilla-goblet', { reps: '12', load: 'KB 12', loadUnit: 'text' }),
        roundEx('flexiones-inclinadas', { reps: '10' }),
        roundEx('remo-trx', { reps: '12' }),
        roundEx('plancha', { durationSec: 30 }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 90 } }),
      block('cooldown', [ex('respiracion-diafragmatica', { sets: null, durationSec: 120 })]),
    ]),
  ]
}
