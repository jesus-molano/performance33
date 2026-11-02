import { DEFAULT_BRANDING } from '@/config/branding'
import { createSeedData } from '@/data/seed'
import { removeById, updateById } from '@/lib/arrays'
import { newId } from '@/lib/ids'
import { adoptImportedData } from '@/lib/ownership'
import { mapProgramExercises } from '@/lib/programTree'
import type { AppData, CustomExercise, CustomExerciseInput } from '@/types'
import { getCurrentStaffId, getTeamIds } from '@/store/sessionStore'
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

/** Notes and routines signed by people outside this team pass to whoever loads them. */
const adopt = (data: AppData): AppData => adoptImportedData(data, getTeamIds(), getCurrentStaffId())

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
      commit(() => adopt(data))
      clearHistory()
    },
    resetDemoData: () => {
      commit(() => adopt(createSeedData()))
      clearHistory()
    },
    loadDemoData: () => {
      const demo = adopt(createSeedData())
      commit((d) => ({ ...d, clients: demo.clients, programs: demo.programs, notes: demo.notes }))
      clearHistory()
    },
  }
}
