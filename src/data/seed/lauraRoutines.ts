// Laura · Plus (3 días). Shoulder issue: no overhead pressing in her routines.
// Day 1 is the density stress case: 5 blocks and 15 exercise rows.

import type { Day } from '@/types'
import { WARMUP_TEXT, block, day, ex, kgProgression, roundEx } from './builders'

export function lauraCurrentDays(): Day[] {
  return [
    day(0, 'Pierna', [
      block('warmup', [
        ex('bici-estatica', { sets: null, durationSec: 300, cue: 'Ritmo suave, subiendo poco a poco' }),
        ex('cadera-90-90', { sets: 2, reps: '6 c/lado' }),
        ex('puente-gluteo', { sets: 2, reps: '12', cue: 'Aprieta glúteo arriba 2″' }),
      ], { params: { durationMin: 8 } }),
      block('superset', [
        ex('sentadilla-trasera', {
          reps: '6-8',
          load: '50',
          tempo: '3-1-1-0',
          cue: 'Rodillas hacia fuera, pecho alto',
          progression: kgProgression('50', '52,5', '55', '47,5'),
        }),
        ex('dead-bug', { reps: '8 c/lado' }),
      ], { title: 'Fuerza', params: { rounds: 4, restBetweenRoundsSec: 120 } }),
      block('superset', [
        ex('peso-muerto-rumano', { reps: '10', load: '40', cue: 'Espalda neutra, cadera atrás', progression: kgProgression('40', '42,5', '45', '40') }),
        ex('zancada-atras', { reps: '8', load: 'KB 12', loadUnit: 'text' }),
        ex('hip-thrust', { reps: '12', load: '60', progression: kgProgression('60', '65', '70', '60') }),
      ], { title: 'Accesorios', params: { rounds: 3, restBetweenRoundsSec: 90 } }),
      block('emom', [
        roundEx('kettlebell-swing', { reps: '15', load: 'KB 16', loadUnit: 'text', cue: 'Cadera explosiva' }),
        roundEx('step-up', { reps: '8', load: '2 × 8 kg', loadUnit: 'text' }),
        roundEx('remo-ergometro-calorias', { calories: 10 }),
      ], { title: 'Metcon', params: { everyMin: 1, durationMin: 12 } }),
      block('cooldown', [
        ex('plancha-lateral', { sets: 2, durationSec: 30 }),
        ex('paloma', { sets: null, durationSec: 45, perSide: true }),
        ex('estiramiento-flexor-cadera', { sets: null, durationSec: 30, perSide: true }),
        ex('respiracion-diafragmatica', { sets: null, durationSec: 60 }),
      ], { title: 'Core y vuelta a la calma' }),
    ]),
    day(1, 'Tirón y empuje horizontal', [
      block('warmup', [
        ex('remo-ergometro', { sets: null, distanceM: 500, cue: 'Suave, técnica limpia' }),
        ex('band-pull-apart', { sets: 2, reps: '15', load: 'banda verde', loadUnit: 'text' }),
        ex('rotacion-toracica', { sets: 2, reps: '8 c/lado' }),
      ]),
      block('superset', [
        ex('press-banca-mancuernas', {
          reps: '8-10',
          load: '14',
          progression: kgProgression('14', '16', '16', '14'),
          internalNote: 'Hombro dcho.: agarre neutro, sin bajar más allá de 90°',
        }),
        ex('remo-pecho-apoyado', { reps: '10', load: '16', cue: 'Escápulas atrás y abajo' }),
      ], { title: 'Fuerza', params: { rounds: 4, restBetweenRoundsSec: 90 } }),
      block('superset', [
        ex('jalon-pecho', { reps: '12', load: '35', progression: kgProgression('35', '37,5', '40', '35') }),
        ex('face-pull', { reps: '15', load: 'banda roja', loadUnit: 'text' }),
        ex('curl-martillo', { reps: '12', load: '8' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('circuit', [
        roundEx('remo-trx', { reps: '12' }),
        roundEx('flexiones-inclinadas', { reps: '10' }),
        roundEx('plancha-toques-hombro', { reps: '20' }),
        roundEx('assault-bike', { calories: 10 }),
      ], { title: 'Finisher', params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('cooldown', [
        ex('estiramiento-pecho-pared', { sets: null, durationSec: 30, perSide: true }),
        ex('postura-nino', { sets: null, durationSec: 60 }),
      ]),
    ]),
    day(2, 'Full body metabólico', [
      block('warmup', [], { text: WARMUP_TEXT, params: { durationMin: 10 } }),
      block('normal', [
        ex('peso-muerto-kettlebell', { sets: 4, reps: '10', load: 'KB 24', loadUnit: 'text', restSec: 90, cue: 'Empuja el suelo' }),
        ex('sentadilla-goblet', { sets: 3, reps: '12', load: 'KB 16', loadUnit: 'text', restSec: 75 }),
      ]),
      block('circuit', [
        roundEx('kettlebell-swing', { reps: '15', load: 'KB 16', loadUnit: 'text' }),
        roundEx('step-up', { reps: '8', load: '8', cue: 'Sube con el talón' }),
        roundEx('remo-trx', { reps: '12' }),
        roundEx('sentadilla-sandbag', { reps: '12', load: '20', cue: 'Sentadilla completa' }),
        roundEx('remo-ergometro-calorias', { calories: 12 }),
      ], { params: { rounds: 4, restBetweenRoundsSec: 90 }, note: 'Ritmo constante, sin parar entre ejercicios' }),
      block('amrap', [
        roundEx('zancadas-caminando', { reps: '10 c/lado' }),
        roundEx('plancha-toques-hombro', { reps: '20' }),
        roundEx('comba', { reps: '50' }),
      ], { params: { timeCapMin: 8 } }),
      block('cooldown', [
        ex('respiracion-diafragmatica', { sets: null, durationSec: 120 }),
        ex('postura-nino', { sets: null, durationSec: 60 }),
      ]),
    ]),
  ]
}

export function lauraPreviousDays(): Day[] {
  return [
    day(0, 'Pierna', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('sentadilla-goblet', { sets: 4, reps: '10', load: 'KB 16', loadUnit: 'text', restSec: 90 }),
        ex('peso-muerto-kettlebell', { sets: 3, reps: '12', load: 'KB 20', loadUnit: 'text', restSec: 90 }),
      ]),
      block('superset', [
        ex('puente-gluteo', { reps: '15' }),
        ex('zancada-atras', { reps: '8' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('cooldown', [ex('paloma', { sets: null, durationSec: 45, perSide: true }), ex('rana', { sets: null, durationSec: 60 })]),
    ]),
    day(1, 'Torso', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('flexiones-inclinadas', { sets: 3, reps: '10', restSec: 60 }),
        ex('remo-mancuerna', { sets: 3, reps: '10', load: '12', restSec: 60 }),
      ]),
      block('superset', [
        ex('jalon-pecho', { reps: '12', load: '30' }),
        ex('band-pull-apart', { reps: '15', load: 'banda verde', loadUnit: 'text' }),
      ], { params: { rounds: 3, restBetweenRoundsSec: 60 } }),
      block('cooldown', [ex('plancha', { sets: 3, durationSec: 30 }), ex('dead-bug', { sets: 2, reps: '8 c/lado' })]),
    ]),
    day(2, 'Acondicionamiento', [
      block('warmup', [], { text: WARMUP_TEXT }),
      block('normal', [
        ex('sentadilla-goblet', { sets: 3, reps: '12', load: 'KB 12', loadUnit: 'text', restSec: 60 }),
        ex('flexiones-inclinadas', { sets: 3, reps: '10', restSec: 60 }),
      ]),
      block('emom', [roundEx('kettlebell-swing', { reps: '12', load: 'KB 12', loadUnit: 'text' }), roundEx('burpee', { reps: '8' })], {
        params: { everyMin: 1, durationMin: 10 },
      }),
      block('cooldown', [ex('postura-nino', { sets: null, durationSec: 60 }), ex('respiracion-diafragmatica', { sets: null, durationSec: 120 })]),
    ]),
  ]
}
