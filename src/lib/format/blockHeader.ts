import { BLOCK_TYPE_META } from '@/config/blockTypes'
import type { Block, PublicBlock } from '@/types'
import { getBlockTitle } from '@/lib/blocks'
import { formatMinutes, formatRest, formatSeconds, plural } from './units'

type BlockLike = PublicBlock | Block

export interface BlockHeader {
  /** Custom or automatic title ('Fuerza', 'Triserie', 'Calentamiento'). */
  title: string
  /** Big type header for the TV: 'EMOM 12′', 'Cada 2′ × 5', '3 rondas', 'AMRAP 10′', 'Biserie × 4', '8 × 20″ / 10″'. */
  headline: string
  /** Acronym badge ('EMOM', 'AMRAP', 'TABATA', 'FOR TIME'). */
  badge?: string
  /** Header chip, e.g. rep scheme '21-15-9'. */
  chip?: string
  /** Small line under the headline: 'Máximas rondas posibles', 'Total 4′', 'Límite 15′'. */
  subtitle?: string
  /** Footer line: 'Descanso 90s entre rondas'. */
  footer?: string
}

const restBetweenRounds = (sec?: number) => (sec ? `Descanso ${formatRest(sec)} entre rondas` : undefined)

function emomHeader(block: BlockLike, title: string): BlockHeader {
  const every = block.params.everyMin ?? 1
  const duration = block.params.durationMin ?? 0
  const headline =
    every === 1
      ? `EMOM ${formatMinutes(duration)}`
      : `Cada ${formatMinutes(every)} × ${Math.max(1, Math.floor(duration / every))}`
  const alternates = block.exercises.length > 1 ? `Alterna cada ${every === 1 ? 'minuto' : 'intervalo'}` : ''
  const total = every === 1 ? '' : `${formatMinutes(duration)} en total`
  return { title, headline, badge: 'EMOM', subtitle: [alternates, total].filter(Boolean).join(' · ') || undefined }
}

function tabataHeader(block: BlockLike, title: string): BlockHeader {
  const work = block.params.workSec ?? 20
  const rest = block.params.restSec ?? 10
  const rounds = block.params.rounds ?? 8
  const classic = work === 20 && rest === 10 && rounds === 8
  return {
    title,
    headline: `${rounds} × ${formatSeconds(work)} / ${formatSeconds(rest)}`,
    badge: classic ? 'TABATA' : 'INTERVALOS',
    subtitle: `Total ${formatSeconds(rounds * (work + rest))}`,
  }
}

function circuitHeader(block: BlockLike, title: string): BlockHeader {
  const p = block.params
  return {
    title,
    headline: plural(p.rounds ?? 1, 'ronda', 'rondas'),
    chip: p.repScheme || undefined,
    subtitle: p.restBetweenExercisesSec ? `Descanso ${formatRest(p.restBetweenExercisesSec)} entre ejercicios` : undefined,
    footer: restBetweenRounds(p.restBetweenRoundsSec),
  }
}

function forTimeHeader(block: BlockLike, title: string): BlockHeader {
  const p = block.params
  return {
    title,
    headline: p.rounds && p.rounds > 1 ? `${p.rounds} rondas por tiempo` : 'Por tiempo',
    badge: BLOCK_TYPE_META.fortime.acronym,
    chip: p.repScheme || undefined,
    subtitle: p.timeCapMin ? `Límite ${formatMinutes(p.timeCapMin)}` : undefined,
    footer: restBetweenRounds(p.restBetweenRoundsSec),
  }
}

export function getBlockHeader(block: BlockLike): BlockHeader {
  const title = getBlockTitle(block)
  const p = block.params
  switch (block.type) {
    case 'superset':
      return {
        title,
        headline: p.rounds ? `${title} × ${p.rounds}` : title,
        footer: restBetweenRounds(p.restBetweenRoundsSec),
      }
    case 'circuit':
      return circuitHeader(block, title)
    case 'emom':
      return emomHeader(block, title)
    case 'amrap':
      return {
        title,
        headline: `AMRAP ${formatMinutes(p.timeCapMin ?? 0)}`,
        badge: 'AMRAP',
        subtitle: 'Máximas rondas posibles',
      }
    case 'tabata':
      return tabataHeader(block, title)
    case 'fortime':
      return forTimeHeader(block, title)
    case 'warmup':
    case 'cooldown':
      return { title, headline: title, subtitle: p.durationMin ? formatMinutes(p.durationMin) : undefined }
    case 'normal':
      return { title, headline: title }
  }
}

/** Compact summary for collapsed blocks in the editor: 'EMOM 12′ · 3 ejercicios'. */
export function getBlockSummary(block: BlockLike): string {
  const header = getBlockHeader(block)
  const count = block.exercises.length
  const content =
    count === 0 ? (block.text.trim() ? 'texto libre' : 'sin ejercicios') : plural(count, 'ejercicio', 'ejercicios')
  return [header.headline, header.chip, content].filter(Boolean).join(' · ')
}
