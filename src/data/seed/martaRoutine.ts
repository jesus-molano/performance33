// Marta · Elite (4 días). Showcases every block type.

import type { Day } from '@/types'
import { block, day, ex, kgProgression, roundEx } from './builders'

const activation = () =>
  block('warmup', [
    ex('cars-cadera', { sets: 2, reps: '5 c/lado' }),
    ex('worlds-greatest-stretch', { sets: 2, reps: '4 c/lado' }),
    ex('band-pull-apart', { sets: 2, reps: '15', load: 'banda verde', loadUnit: 'text' }),
  ], { title: 'Activación' })

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
          cue: 'Codos altos todo el recorrido',
          progression: { target: 'load', values: ['70', '75', '80', '65'] },
        }),
        ex('buenos-dias', { sets: 3, reps: '8', load: '40', restSec: 90, tempo: '3-0-1-0' }),
      ]),
      block('superset', [
        ex('sentadilla-bulgara', { reps: '8', load: '16', internalNote: 'Rodilla izq.: limitar profundidad' }),
        ex('curl-nordico', { reps: '5', tempo: '4-0-X-0' }),
        ex('plancha-copenhague', { reps: '8' }),
      ], { params: { rounds: 4, restBetweenRoundsSec: 90 } }),
      block('circuit', [
        roundEx('salto-cajon', { reps: '10', load: '60 cm', loadUnit: 'text', cue: 'Aterriza suave' }),
        roundEx('kettlebell-swing-americano', { reps: '15', load: 'KB 20', loadUnit: 'text' }),
        roundEx('ski-erg', { calories: 12 }),
      ], { title: 'Metcon', params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('cooldown', [ex('rana', { sets: null, durationSec: 60 }), ex('postura-nino', { sets: null, durationSec: 60 })]),
    ]),
    day(1, 'Empuje', [
      activation(),
      block('normal', [
        ex('press-banca', { sets: 4, reps: '6', load: '45', restSec: 120, progression: kgProgression('45', '47,5', '50', '42,5') }),
        ex('press-hombro-mancuernas', { sets: 3, reps: '10', load: '8', loadUnit: 'rpe', restSec: 90 }),
      ]),
      block('superset', [
        ex('fondos-anillas', { reps: '8', cue: 'Hombros lejos de las orejas' }),
        ex('extension-triceps-cuerda', { reps: '12', load: '20' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 75 } }),
      block('tabata', [roundEx('flexiones', { reps: 'máx' }), roundEx('hollow-hold', { durationSec: 20 })], {
        params: { workSec: 20, restSec: 10, rounds: 8 },
      }),
      block('cooldown', [
        ex('estiramiento-pecho-pared', { sets: null, durationSec: 45, perSide: true }),
        ex('apertura-libro', { sets: 2, reps: '6 c/lado' }),
      ]),
    ]),
    day(2, 'Tirón', [
      activation(),
      block('normal', [
        ex('dominadas', { sets: 5, reps: '3-5', load: '2', loadUnit: 'rir', restSec: 120 }),
        ex('remo-barra', { sets: 4, reps: '8', load: '40', restSec: 90, progression: kgProgression('40', '42,5', '45', '40') }),
      ]),
      block('superset', [
        ex('curl-biceps-mancuernas', { reps: '10', load: '10' }),
        ex('face-pull', { reps: '15', load: 'banda roja', loadUnit: 'text' }),
        ex('pajaros', { reps: '15', load: '5' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('emom', [
        roundEx('remo-renegado', { reps: '8', load: '10' }),
        roundEx('elevacion-rodillas-colgado', { reps: '10' }),
        roundEx('assault-bike', { calories: 10 }),
      ], { params: { everyMin: 1, durationMin: 12 } }),
    ]),
    day(3, 'Acondicionamiento', [
      block('warmup', [], {
        text: '8′ remo suave subiendo ritmo cada 2′\nMovilidad de cadera y hombro libre\n2 rondas: 5 thrusters sin peso + 5 burpees',
        params: { durationMin: 12 },
      }),
      block('fortime', [
        roundEx('thruster-mancuernas', { reps: '', load: '2 × 10 kg', loadUnit: 'text' }),
        roundEx('burpee-sobre-barra', { reps: '' }),
      ], { params: { repScheme: '21-15-9', timeCapMin: 12 }, note: 'Escala a burpee sin salto si hace falta' }),
      block('amrap', [
        roundEx('assault-bike', { calories: 10 }),
        roundEx('wall-ball', { reps: '15', load: '6', cue: 'Sentadilla completa' }),
        roundEx('toes-to-bar', { reps: '10' }),
        roundEx('cargada-kettlebell', { reps: '8', load: 'KB 16', loadUnit: 'text' }),
      ], { params: { timeCapMin: 10 } }),
      block('cooldown', [
        ex('foam-roller', { sets: null, durationSec: 120, cue: 'Cuádriceps, dorsal y gemelo' }),
        ex('perro-boca-abajo', { sets: null, durationSec: 45 }),
      ]),
    ]),
  ]
}
