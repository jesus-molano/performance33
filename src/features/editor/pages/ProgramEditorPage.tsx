import { PagePlaceholder } from '../../../components/PagePlaceholder'

export interface ProgramEditorPageProps {
  clientId: string
  programId: string
}

export function ProgramEditorPage(_props: ProgramEditorPageProps) {
  return <PagePlaceholder title="Editor de rutina" />
}
