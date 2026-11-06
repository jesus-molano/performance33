import { ArrowLeft, Eye, EyeOff, Star } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { planLabel } from '@/lib/plans'
import { getProgramDisplayName } from '@/lib/program'
import { paths } from '@/lib/routes'
import type { Client, Program } from '@/types'
import { ScreenSendButton, type SendToScreenInput } from '@/features/screens'
import type { ProgramHeaderApi } from '@/features/editor/hooks/useProgramHeader'
import { InlineInput } from '@/features/editor/components/common/InlineInput'
import { ProgramDatesEditor } from './ProgramDatesEditor'

export interface ProgramHeaderProps {
  client: Client
  program: Program
  api: ProgramHeaderApi
  /** The selected day when it belongs to the current routine, so it can go to a TV section. */
  screenTarget: SendToScreenInput | null
  previewVisible: boolean
  onTogglePreview: () => void
}

export function ProgramHeader({ client, program, api, screenTarget, previewVisible, onTogglePreview }: ProgramHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      <a
        href={paths.client(client.id)}
        className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-1 text-md font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeft size={18} aria-hidden />
        Ficha de {client.firstName}
      </a>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 px-2">
            <Badge tone={api.status.tone}>{api.status.label}</Badge>
            {api.isCurrent ? (
              <Badge tone="brand" icon={Star}>
                Rutina actual
              </Badge>
            ) : (
              <Button size="sm" variant="secondary" leftIcon={Star} onClick={api.makeCurrent}>
                Marcar como actual
              </Button>
            )}
          </div>
          <InlineInput
            size="xl"
            aria-label="Nombre de la rutina"
            value={program.name}
            placeholder={getProgramDisplayName(program)}
            onValueChange={api.rename}
            className="mt-2"
          />
          <p className="px-2 text-md text-fg-muted">
            Rutina de <span className="font-medium text-fg">{client.firstName}</span> ·{' '}
            {planLabel(client.plan, client.trainingDays)}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <Button
            variant="secondary"
            leftIcon={previewVisible ? EyeOff : Eye}
            onClick={onTogglePreview}
            aria-expanded={previewVisible}
            className="flex-1 lg:flex-none"
          >
            <span className="sm:hidden">Vista previa</span>
            <span className="hidden sm:inline">{previewVisible ? 'Ocultar vista previa' : 'Mostrar vista previa'}</span>
          </Button>
          {screenTarget && <ScreenSendButton {...screenTarget} size="md" className="flex-1 lg:flex-none" />}
        </div>
      </div>

      <Card>
        <ProgramDatesEditor program={program} api={api} />
      </Card>
    </header>
  )
}
