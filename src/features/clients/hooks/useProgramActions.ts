import { useCallback } from 'react'
import { useConfirm, useDisplayWindow, useToast } from '@/hooks'
import { getProgramDisplayName } from '@/lib/program'
import { navigate, paths } from '@/lib/routes'
import { useAppActions } from '@/store'
import type { CreateProgramOptions, ISODate, Program } from '@/types'

export interface ProgramActionsApi {
  open: (program: Program) => void
  create: (opts?: CreateProgramOptions) => void
  /** 'Duplicar como nueva rutina': copies days and exercises into a new current routine and opens it. */
  duplicateAsNext: (program: Program, startDate?: ISODate) => void
  makeCurrent: (program: Program) => void
  remove: (program: Program) => Promise<void>
  showOnScreen: (program: Program, day?: number) => void
}

/** Routine actions on the client page. Every create/duplicate opens the editor. */
export function useProgramActions(clientId: string): ProgramActionsApi {
  const actions = useAppActions()
  const { openDisplay } = useDisplayWindow()
  const { toast, toastUndo } = useToast()
  const confirm = useConfirm()

  const openEditor = useCallback((programId: string) => navigate(paths.program(clientId, programId)), [clientId])

  const create = useCallback(
    (opts?: CreateProgramOptions) => {
      const id = actions.createProgram(clientId, opts)
      if (id) openEditor(id)
    },
    [actions, clientId, openEditor],
  )

  const duplicateAsNext = useCallback(
    (program: Program, startDate?: ISODate) => {
      const id = actions.duplicateProgram(program.id, { startDate })
      if (!id) return
      toast({ message: 'Nueva rutina creada a partir de la anterior', tone: 'success' })
      openEditor(id)
    },
    [actions, openEditor, toast],
  )

  const makeCurrent = useCallback(
    (program: Program) => {
      actions.setCurrentProgram(clientId, program.id)
      toast({ message: `«${getProgramDisplayName(program)}» es ahora la rutina actual`, tone: 'success' })
    },
    [actions, clientId, toast],
  )

  const remove = useCallback(
    async (program: Program) => {
      const ok = await confirm({
        title: `¿Eliminar «${getProgramDisplayName(program)}»?`,
        description: 'Se borrarán todos sus días y ejercicios.',
        confirmLabel: 'Eliminar rutina',
        danger: true,
      })
      if (!ok) return
      actions.deleteProgram(program.id)
      toastUndo('Rutina eliminada')
    },
    [actions, confirm, toastUndo],
  )

  const showOnScreen = useCallback(
    (program: Program, day?: number) => openDisplay(clientId, day ?? null, program.id),
    [clientId, openDisplay],
  )

  return { open: (program) => openEditor(program.id), create, duplicateAsNext, makeCurrent, remove, showOnScreen }
}
