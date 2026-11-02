import { DEFAULT_BRANDING } from '@/config/branding'
import { createSeedData } from '@/data/seed'
import { removeById, updateById } from '@/lib/arrays'
import { newId } from '@/lib/ids'
import { adoptImportedData } from '@/lib/ownership'
import { mapProgramExercises } from '@/lib/programTree'
import type { AppData, LibraryExercise, LibraryExerciseInput } from '@/types'
import { getCurrentProfileId, getTeamIds } from '@/store/sessionStore'
import type { SettingsActions, SliceContext } from '@/store/types'
import { groupKey } from '@/store/undoGroup'

function buildLibraryExercise(id: string, input: LibraryExerciseInput): LibraryExercise {
  return {
    id,
    name: input.name.trim(),
    category: input.category,
    equipment: input.equipment ?? [],
    defaultMeasure: input.defaultMeasure ?? 'reps',
    ...(input.perSide ? { perSide: true } : {}),
    ...(input.aliases?.length ? { aliases: input.aliases } : {}),
    ...(input.link ? { link: input.link } : {}),
    createdAt: new Date().toISOString(),
  }
}

/** A removed link leaves no empty key behind: the saved row must read back equal. */
function withoutEmptyLink(exercise: LibraryExercise): LibraryExercise {
  if (exercise.link) return exercise
  const clean = { ...exercise }
  delete clean.link
  return clean
}

/** Notes and routines signed by people outside this team pass to whoever loads them. */
const adopt = (data: AppData): AppData => adoptImportedData(data, getTeamIds(), getCurrentProfileId())

export function createSettingsSlice({ commit, clearHistory }: SliceContext): SettingsActions {
  return {
    updateBranding: (patch) =>
      commit((d) => ({ ...d, branding: { ...d.branding, ...patch } }), groupKey('branding', '', patch)),
    resetBranding: () => commit((d) => ({ ...d, branding: { ...DEFAULT_BRANDING } })),
    addLibraryExercise: (input) => {
      const id = newId('exercise')
      commit((d) => ({ ...d, library: [...d.library, buildLibraryExercise(id, input)] }))
      return id
    },
    updateLibraryExercise: (id, patch) =>
      commit(
        (d) => ({ ...d, library: updateById(d.library, id, (e) => withoutEmptyLink({ ...e, ...patch })) }),
        groupKey('library', id, patch),
      ),
    // Rows that used it become free text (so 'Guardar en biblioteca' works again); one undo restores both.
    deleteLibraryExercise: (id) =>
      commit((d) => ({
        ...d,
        library: removeById(d.library, id),
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
