// Marta · Elite (4 días). Showcases every block type.

import type { Day } from '../../types'
import { block, day, ex, kgProgression, roundEx } from './builders'

const activation = () =>
  block('warmup', [
    ex('cars-cadera', { sets: 2, reps: '5 c/lado' }),
    ex('worlds-greatest-stretch', { sets: 2, reps: '4 c/lado' }),
    ex('band-pull-apart', { sets: 2, reps: '15', load: 'banda verde', loadUnit: 'text' }),
  ])

export function martaDays(): Day[] {
  return [
    day(0, 'Pierna', [
      activation(),
      block('normal', [
        ex('sentadilla-frontal', {
          sets: 5,
          reps: '5',
          load: '70',
          loadUnit: 'pct1rm',
          rmKg: 80,
          restSec: 150,
          progression: { target: 'load', values: ['70', '75', '80', '65'] },
        }),
      ]),
      block('superset', [
        ex('sentadilla-bulgara', { sets: null, reps: '8', load: '16', internalNote: 'Rodilla izq.: limitar profundidad' }),
        ex('curl-nordico', { sets: null, reps: '5', tempo: '4-0-X-0' }),
      ], { params: { rounds: 4, restBetweenRoundsSec: 90 } }),
      block('cooldown', [ex('rana', { sets: null, durationSec: 60 }), ex('postura-nino', { sets: null, durationSec: 60 })]),
    ]),
    day(1, 'Empuje', [
      activation(),
      block('normal', [
        ex('press-banca', { sets: 4, reps: '6', load: '45', restSec: 120, progression: kgProgression('45', '47,5', '50', '42,5') }),
        ex('press-hombro-mancuernas', { sets: 3, reps: '10', load: '8', loadUnit: 'rpe', restSec: 90 }),
      ]),
      block('tabata', [roundEx('flexiones', { reps: 'máx' }), roundEx('hollow-hold', { durationSec: 20 })], {
        params: { workSec: 20, restSec: 10, rounds: 8 },
      }),
    ]),
    day(2, 'Tirón', [
      activation(),
      block('normal', [
        ex('dominadas', { sets: 5, reps: '3-5', load: '2', loadUnit: 'rir', restSec: 120 }),
        ex('remo-barra', { sets: 4, reps: '8', load: '40', restSec: 90 }),
      ]),
      block('emom', [
        roundEx('remo-renegado', { reps: '8', load: '10' }),
        roundEx('elevacion-rodillas-colgado', { reps: '10' }),
      ], { params: { everyMin: 1, durationMin: 12 } }),
    ]),
    day(3, 'Acondicionamiento', [
      block('warmup', [], { text: '8′ remo suave subiendo ritmo cada 2′\nMovilidad de cadera y hombro libre', params: { durationMin: 10 } }),
      block('fortime', [
        roundEx('thruster-mancuernas', { reps: '', load: '2 × 10 kg', loadUnit: 'text' }),
        roundEx('burpee-sobre-barra', { reps: '' }),
      ], { params: { repScheme: '21-15-9', timeCapMin: 12 }, note: 'Escala a burpee sin salto si hace falta' }),
      block('amrap', [
        roundEx('assault-bike', { calories: 10 }),
        roundEx('wall-ball', { reps: '15', load: '6', cue: 'Sentadilla completa' }),
        roundEx('toes-to-bar', { reps: '10' }),
      ], { params: { timeCapMin: 10 } }),
    ]),
  ]
}
