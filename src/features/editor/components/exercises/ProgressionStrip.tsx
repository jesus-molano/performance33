import { TrendingUp, X } from 'lucide-react'
import { Button, HelpTip, IconButton, Select } from '../../../../components/ui'
import { PROGRESSION_TARGET_META } from '../../../../config/exerciseFields'
import type { ExerciseEntry } from '../../../../types'
import { useProgressionEditor } from '../../hooks/useProgressionEditor'
import type { WeekContext } from '../../types'
import { PROGRESSION_TARGETS, progressionLabel } from '../../utils'
import { LinearFill } from './LinearFill'
import { WeekValueInput } from './WeekValueInput'

const TARGET_OPTIONS = PROGRESSION_TARGETS.map((value) => ({ value, label: PROGRESSION_TARGET_META[value].label }))
const HELP = 'La pantalla muestra solo el valor de la semana en curso. Si una semana está vacía, se usa el valor normal.'

export interface ProgressionStripProps {
  entry: ExerciseEntry
  weeks: WeekContext
}

/** Optional per-week values S1..SN (e.g. carga 20 → 22,5 → 25 → descarga 20). */
export function ProgressionStrip({ entry, weeks }: ProgressionStripProps) {
  const editor = useProgressionEditor(entry, weeks.total)
  const { progression } = editor

  if (!progression) {
    return (
      <Button variant="secondary" size="sm" leftIcon={TrendingUp} onClick={editor.enable} className="self-start">
        Añadir progresión semanal
      </Button>
    )
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3" aria-label="Progresión semanal">
      <div className="flex items-center gap-2">
        <TrendingUp size={17} aria-hidden className="text-emerald-700" />
        <span className="flex-1 text-[15px] font-semibold text-fg">
          Progresión semanal <HelpTip text={HELP} className="align-middle" />
        </span>
        <IconButton icon={X} size="sm" label="Quitar progresión" onClick={editor.remove} />
      </div>
      <Select
        label="Qué cambia cada semana"
        options={TARGET_OPTIONS}
        value={progression.target}
        onChange={editor.setTarget}
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg">{progressionLabel(progression.target, entry)}</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {progression.values.map((value, index) => (
            <WeekValueInput
              key={index}
              week={index + 1}
              isCurrent={weeks.current === index + 1}
              value={value}
              placeholder={editor.baseValue}
              onChange={(next) => editor.setValue(index, next)}
            />
          ))}
        </div>
      </div>
      <LinearFill key={progression.target} target={progression.target} onFill={editor.fill} />
    </section>
  )
}
