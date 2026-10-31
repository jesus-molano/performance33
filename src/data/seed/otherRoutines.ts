// Javier (Standard, 2 días), Carlos (Plus, caducada) and Andrés (1 día).

import type { Day } from '@/types'
import { WARMUP_TEXT, block, day, ex, kgProgression, roundEx } from './builders'

export function javierDays(): Day[] {
  return [
    day(0, 'Full body A', [
      block('warmup', [
        ex('remo-ergometro', { sets: null, distanceM: 500 }),
        ex('worlds-greatest-stretch', { sets: 2, reps: '4 c/lado' }),
        ex('sentadilla-aire', { sets: 2, reps: '10' }),
      ]),
      block('superset', [
        ex('peso-muerto-trap-bar', { reps: '6', load: '80', cue: 'Empuja el suelo', progression: kgProgression('80', '85', '90', '80') }),
        ex('press-inclinado-mancuernas', { reps: '10', load: '20' }),
      ], { title: 'Fuerza', params: { rounds: 4, restBetweenRoundsSec: 120 } }),
      block('superset', [
        ex('remo-mancuerna', { reps: '10', load: '22' }),
        ex('pallof-press', { reps: '10', load: 'banda azul', loadUnit: 'text' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('circuit', [
        roundEx('paseo-granjero', { measure: 'distance', distanceM: 40, load: '2 × 24 kg', loadUnit: 'text' }),
        roundEx('burpee', { reps: '10' }),
        roundEx('bike-erg', { calories: 12 }),
      ], { title: 'Metcon', params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('cooldown', [
        ex('estiramiento-isquios', { sets: 2, reps: '8 c/lado' }),
        ex('foam-roller', { sets: null, durationSec: 120 }),
      ]),
    ]),
    day(1, 'Full body B', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('sentadilla-trasera', { sets: 4, reps: '8', load: '70', restSec: 120, progression: kgProgression('70', '72,5', '75', '70') }),
        ex('dominadas-asistidas-banda', { sets: 3, reps: '8', load: 'banda roja', loadUnit: 'text', restSec: 90 }),
      ]),
      block('superset', [
        ex('press-suelo', { reps: '10', load: '50' }),
        ex('remo-invertido', { reps: '10', cue: 'Cuerpo en bloque' }),
        ex('curl-femoral-fitball', { reps: '12' }),
      ], { title: 'Accesorios', params: { rounds: 3, restBetweenRoundsSec: 75 } }),
      block('tabata', [
        roundEx('bike-erg', { measure: 'time', calories: null, durationSec: 30 }),
        roundEx('mountain-climbers', { reps: 'máx' }),
      ], { params: { workSec: 30, restSec: 30, rounds: 8 } }),
      block('cooldown', [ex('plancha', { sets: 2, durationSec: 40 }), ex('bird-dog', { sets: 2, reps: '8' })], {
        title: 'Core',
      }),
    ]),
  ]
}

export function carlosDays(): Day[] {
  return [
    day(0, 'Pierna', [
      block('warmup', [ex('bici-estatica', { sets: null, durationSec: 300 }), ex('movilidad-tobillo', { sets: 2, reps: '10 c/lado' })]),
      block('normal', [
        ex('sentadilla-goblet', { sets: 3, reps: '12', load: 'KB 20', loadUnit: 'text', restSec: 90 }),
        ex('zancada-atras', { sets: 3, reps: '10', load: '10', restSec: 60 }),
      ]),
      block('superset', [ex('hip-thrust-mancuerna', { reps: '12', load: '20' }), ex('elevacion-gemelos', { reps: '15' })], {
        params: { rounds: 3, restBetweenRoundsSec: 60 },
      }),
      block('cooldown', [
        ex('estiramiento-cuadriceps', { sets: null, durationSec: 30, perSide: true }),
        ex('paloma', { sets: null, durationSec: 45, perSide: true }),
      ]),
    ]),
    day(1, 'Torso', [
      block('warmup', [
        ex('remo-ergometro', { sets: null, distanceM: 500 }),
        ex('band-pull-apart', { sets: 2, reps: '15', load: 'banda verde', loadUnit: 'text' }),
      ]),
      block('normal', [ex('flexiones', { sets: 3, reps: 'máx', restSec: 90 }), ex('remo-invertido', { sets: 3, reps: '10', restSec: 60 })]),
      block('superset', [ex('press-hombro-mancuernas', { reps: '10', load: '10' }), ex('jalon-pecho', { reps: '12', load: '40' })], {
        params: { rounds: 3, restBetweenRoundsSec: 75 },
      }),
      block('cooldown', [ex('plancha', { sets: 2, durationSec: 30 }), ex('dead-bug', { sets: 2, reps: '8 c/lado' })], { title: 'Core' }),
    ]),
    day(2, 'Cardio', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('circuit', [
        roundEx('remo-ergometro', { distanceM: 500 }),
        roundEx('burpee', { reps: '10' }),
        roundEx('kettlebell-swing', { reps: '15', load: 'KB 16', loadUnit: 'text' }),
        roundEx('mountain-climbers', { reps: '20' }),
      ], { params: { rounds: 4, restBetweenRoundsSec: 120 } }),
      block('emom', [roundEx('comba', { reps: '50' }), roundEx('sit-up', { reps: '15' })], { params: { everyMin: 1, durationMin: 10 } }),
      block('cooldown', [ex('postura-nino', { sets: null, durationSec: 60 }), ex('respiracion-diafragmatica', { sets: null, durationSec: 120 })]),
    ]),
  ]
}

export function andresDays(): Day[] {
  return [
    day(0, 'Full body', [
      block('warmup', [
        ex('movilidad-tobillo', { sets: 2, reps: '10 c/lado' }),
        ex('inchworm', { sets: 2, reps: '5' }),
        ex('gato-camello', { sets: 2, reps: '8' }),
      ]),
      block('normal', [
        ex('peso-muerto-kettlebell', { sets: 3, reps: '10', load: 'KB 16', loadUnit: 'text', restSec: 90, cue: 'Espalda neutra' }),
        ex('remo-trx', { sets: 3, reps: '12', restSec: 60 }),
      ]),
      block('circuit', [
        roundEx('sentadilla-goblet', { reps: '12', load: 'KB 12', loadUnit: 'text' }),
        roundEx('flexiones-inclinadas', { reps: '10' }),
        roundEx('bird-dog', { reps: '8' }),
        roundEx('plancha', { durationSec: 30 }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 90 } }),
      block('cooldown', [
        ex('cadera-90-90', { sets: 2, reps: '5 c/lado' }),
        ex('respiracion-diafragmatica', { sets: null, durationSec: 120 }),
      ]),
    ]),
  ]
}
