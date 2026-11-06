// Formats a public routine for reading (pure). The web's buildDisplayRoutine and the members' app both use it.

import { blockShowsSets } from './blocks.ts'
import { BLOCK_TYPE_INFO } from './blockTypes.ts'
import { todayISO } from './dates.ts'
import type { DisplayBlock, DisplayDay, ProgramRoutine } from './displayTypes.ts'
import { getBlockHeader } from './format/blockHeader.ts'
import { getEntryParts } from './format/exercise.ts'
import { getBlockLetter, getExerciseLabels } from './format/labels.ts'
import { formatDayTitle } from './format/text.ts'
import { formatProgramPeriod, getProgramWeekInfo, getProgressionWeek } from './programWeek.ts'
import type { ISODate, PublicDay, PublicProgram } from './types.ts'

function formatBlock(day: PublicDay, blockIndex: number, week: number | null): DisplayBlock {
  const block = day.blocks[blockIndex]
  const labels = getExerciseLabels(day.blocks, blockIndex)
  const showSets = blockShowsSets(block.type)
  return {
    id: block.id,
    type: block.type,
    letter: getBlockLetter(day.blocks, blockIndex),
    ...getBlockHeader(block),
    note: block.note.trim(),
    text: block.text.trim(),
    muted: BLOCK_TYPE_INFO[block.type].muted,
    exercises: block.exercises.map((entry, i) => {
      const parts = getEntryParts(entry, { showSets, week })
      return {
        id: entry.id,
        label: labels[i] ?? null,
        name: entry.name.trim(),
        volume: parts.volume,
        load: parts.load,
        detail: [parts.tempo, parts.rest].filter(Boolean).join(' · '),
        cue: entry.cue.trim(),
      }
    }),
  }
}

function formatDay(day: PublicDay, index: number, week: number | null): DisplayDay {
  return {
    id: day.id,
    number: index + 1,
    name: day.name,
    label: day.label,
    title: formatDayTitle(day),
    blocks: day.blocks.map((_, blockIndex) => formatBlock(day, blockIndex, week)),
  }
}

/** A public routine formatted for reading, with the progression values of the week that applies on `today`. */
export function buildProgramRoutine(program: PublicProgram, today: ISODate = todayISO()): ProgramRoutine {
  const info = getProgramWeekInfo(program, today)
  const week = getProgressionWeek(info)
  return {
    programId: program.id,
    programName: program.name,
    startDate: program.startDate,
    endDate: program.endDate,
    phase: info.phase,
    week,
    totalWeeks: info.totalWeeks,
    weekLabel: formatProgramPeriod(info, program.startDate),
    days: program.days.map((day, index) => formatDay(day, index, week)),
  }
}
