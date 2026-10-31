import { useClient, useProgram } from '../../../store'
import type { Client, Program } from '../../../types'

export interface EditorData {
  client: Client | null
  /** Null when missing or when it belongs to another client. */
  program: Program | null
}

export function useEditorData(clientId: string, programId: string): EditorData {
  const client = useClient(clientId)
  const program = useProgram(programId)
  return { client, program: program && program.clientId === clientId ? program : null }
}
