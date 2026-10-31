import { DEFAULT_BRANDING } from '@/config/branding'
import { createSeedData } from '@/data/seed'
import { removeById, updateById } from '@/lib/arrays'
import { newId } from '@/lib/ids'
import { mapProgramExercises } from '@/lib/programTree'
import type { CustomExercise, CustomExerciseInput } from '@/types'
import type { SettingsActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

function buildCustomExercise(id: string, input: CustomExerciseInput): CustomExercise {
  return {
    id,
    name: input.name.trim(),
    category: input.category,
    equipment: input.equipment ?? [],
    defaultMeasure: input.defaultMeasure ?? 'reps',
    ...(input.perSide ? { perSide: true } : {}),
    ...(input.aliases?.length ? { aliases: input.aliases } : {}),
    custom: true,
    createdAt: new Date().toISOString(),
  }
}

export function createSettingsSlice({ commit, clearHistory }: SliceContext): SettingsActions {
  return {
    updateBranding: (patch) =>
      commit((d) => ({ ...d, branding: { ...d.branding, ...patch } }), groupKey('branding', '', patch)),
    resetBranding: () => commit((d) => ({ ...d, branding: { ...DEFAULT_BRANDING } })),
    addCustomExercise: (input) => {
      const id = newId('custom')
      commit((d) => ({ ...d, customExercises: [...d.customExercises, buildCustomExercise(id, input)] }))
      return id
    },
    updateCustomExercise: (id, patch) =>
      commit(
        (d) => ({ ...d, customExercises: updateById(d.customExercises, id, (e) => ({ ...e, ...patch })) }),
        groupKey('custom', id, patch),
      ),
    // Rows that used it become free text (so 'Guardar en biblioteca' works again); one undo restores both.
    deleteCustomExercise: (id) =>
      commit((d) => ({
        ...d,
        customExercises: removeById(d.customExercises, id),
        programs: d.programs.map((p) =>
          mapProgramExercises(p, (e) => (e.libraryId === id ? { ...e, libraryId: null } : e)),
        ),
      })),
    importData: (data) => {
      commit(() => data)
      clearHistory()
    },
    resetDemoData: () => {
      commit(() => createSeedData())
      clearHistory()
    },
  }
}
