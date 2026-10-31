import type { LucideIcon } from 'lucide-react'
import { Dumbbell, Flame, Hourglass, Leaf, Link2, Repeat, Timer, TimerReset, Zap } from 'lucide-react'
import type { BlockParams, BlockType } from '@/types'

export type BlockParamKey = keyof BlockParams

export interface BlockTypeMeta {
  type: BlockType
  /** Spanish name: 'Superserie'. */
  label: string
  /** Acronym badge shown next to the Spanish label ('EMOM', 'AMRAP'), if any. */
  acronym?: string
  /** One-line plain-Spanish explanation for the block picker card. */
  description: string
  icon: LucideIcon
  /** Params shown in the editor for this type, in display order. Hide the rest. */
  params: BlockParamKey[]
  /** Defaults applied when a block is created / changed to this type (only fills missing params). */
  defaultParams: BlockParams
  /** Whether exercise rows show the 'series' field (false = rounds are block-level). */
  rowsHaveSets: boolean
  /** Whether a free-text description area is offered (warmup/cooldown). */
  allowsText: boolean
  /** Visually de-emphasised on the TV (warmup/cooldown). */
  muted: boolean
}

/** Spanish labels + help text for each param (for editor forms). */
export const BLOCK_PARAM_META: Record<BlockParamKey, { label: string; unit: string; help?: string }> = {
  rounds: { label: 'Rondas', unit: '', help: 'Cuántas veces se repite todo el bloque' },
  everyMin: { label: 'Cada', unit: 'min', help: 'Al empezar cada intervalo arrancas una tanda' },
  durationMin: { label: 'Duración', unit: 'min' },
  timeCapMin: { label: 'Tiempo', unit: 'min', help: 'Tiempo máximo del bloque' },
  workSec: { label: 'Trabajo', unit: 's' },
  restSec: { label: 'Descanso', unit: 's' },
  restBetweenRoundsSec: { label: 'Descanso entre rondas', unit: 's' },
  restBetweenExercisesSec: { label: 'Descanso entre ejercicios', unit: 's' },
  repScheme: { label: 'Esquema de reps', unit: '', help: 'Por ejemplo 21-15-9' },
}

export const BLOCK_TYPE_META: Record<BlockType, BlockTypeMeta> = {
  normal: {
    type: 'normal',
    label: 'Normal',
    description: 'Series fijas: haces todas las series de un ejercicio y pasas al siguiente.',
    icon: Dumbbell,
    params: [],
    defaultParams: {},
    rowsHaveSets: true,
    allowsText: false,
    muted: false,
  },
  superset: {
    type: 'superset',
    label: 'Superserie',
    description: 'Ejercicios alternados (A1, A2…) sin descanso entre ellos.',
    icon: Link2,
    params: ['rounds', 'restBetweenRoundsSec'],
    defaultParams: { rounds: 4, restBetweenRoundsSec: 90 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  circuit: {
    type: 'circuit',
    label: 'Circuito',
    description: 'Varios ejercicios seguidos que se repiten varias rondas.',
    icon: Repeat,
    params: ['rounds', 'restBetweenExercisesSec', 'restBetweenRoundsSec'],
    defaultParams: { rounds: 3, restBetweenRoundsSec: 90 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  emom: {
    type: 'emom',
    label: 'Cada minuto',
    acronym: 'EMOM',
    description: 'Cada minuto empiezas una tanda y descansas lo que sobre.',
    icon: Timer,
    params: ['everyMin', 'durationMin'],
    defaultParams: { everyMin: 1, durationMin: 12 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  amrap: {
    type: 'amrap',
    label: 'Máximas rondas',
    acronym: 'AMRAP',
    description: 'Todas las rondas posibles en el tiempo marcado.',
    icon: Hourglass,
    params: ['timeCapMin'],
    defaultParams: { timeCapMin: 12 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  tabata: {
    type: 'tabata',
    label: 'Intervalos',
    acronym: 'TABATA',
    description: 'Trabajo y descanso por tiempo, por ejemplo 20″ / 10″ × 8.',
    icon: Zap,
    params: ['workSec', 'restSec', 'rounds'],
    defaultParams: { workSec: 20, restSec: 10, rounds: 8 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  fortime: {
    type: 'fortime',
    label: 'Por tiempo',
    acronym: 'FOR TIME',
    description: 'Termina el trabajo lo más rápido posible, con tiempo límite.',
    icon: TimerReset,
    params: ['rounds', 'repScheme', 'timeCapMin'],
    defaultParams: { timeCapMin: 15 },
    rowsHaveSets: false,
    allowsText: false,
    muted: false,
  },
  warmup: {
    type: 'warmup',
    label: 'Calentamiento',
    description: 'Activación antes del trabajo principal. Puedes escribirlo como texto libre.',
    icon: Flame,
    params: ['durationMin'],
    defaultParams: {},
    rowsHaveSets: true,
    allowsText: true,
    muted: true,
  },
  cooldown: {
    type: 'cooldown',
    label: 'Movilidad',
    description: 'Vuelta a la calma y estiramientos al final de la sesión.',
    icon: Leaf,
    params: ['durationMin'],
    defaultParams: {},
    rowsHaveSets: true,
    allowsText: true,
    muted: true,
  },
}

/** Order for the '+ Añadir bloque' picker grid. */
export const BLOCK_TYPE_ORDER: BlockType[] = [
  'normal',
  'superset',
  'circuit',
  'emom',
  'amrap',
  'tabata',
  'fortime',
  'warmup',
  'cooldown',
]

/** Presets for tabata/intervals. */
export const INTERVAL_PRESETS: Array<{ label: string; workSec: number; restSec: number; rounds: number }> = [
  { label: 'Tabata 20/10 ×8', workSec: 20, restSec: 10, rounds: 8 },
  { label: '40/20', workSec: 40, restSec: 20, rounds: 8 },
  { label: '30/30', workSec: 30, restSec: 30, rounds: 10 },
  { label: '45/15', workSec: 45, restSec: 15, rounds: 8 },
]
