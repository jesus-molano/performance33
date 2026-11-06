import { MonitorPlay, Trash2 } from 'lucide-react'
import { Badge, Button, Card, IconButton } from '@/components/ui'
import { SCREENS_PANEL_COPY } from '@/features/screens/config/panel'
import type { ScreenView } from '@/features/screens/types'
import { ScreenLayoutPreview } from './ScreenLayoutPreview'
import { ScreenNameField } from './ScreenNameField'
import { SectionCountField } from './SectionCountField'

export interface ScreenCardProps {
  screen: ScreenView
  canRemove: boolean
  onRename: (screen: ScreenView, name: string) => void
  onSectionsChange: (screen: ScreenView, sections: number) => void
  onRemove: (screen: ScreenView) => void
  onOpen: (screen: ScreenView) => void
}

/** One TV: its name, how many sections it has and a live picture of how they are laid out. */
export function ScreenCard({ screen, canRemove, onRename, onSectionsChange, onRemove, onOpen }: ScreenCardProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-lg font-semibold text-fg">{screen.name}</h3>
          {screen.online && (
            <Badge tone="success" size="sm">
              {SCREENS_PANEL_COPY.online}
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="secondary" size="sm" leftIcon={MonitorPlay} aria-label={SCREENS_PANEL_COPY.openLabel(screen.name)} onClick={() => onOpen(screen)}>
            {SCREENS_PANEL_COPY.open}
          </Button>
          <IconButton
            icon={Trash2}
            size="sm"
            label={canRemove ? SCREENS_PANEL_COPY.remove(screen.name) : SCREENS_PANEL_COPY.lastScreen}
            disabled={!canRemove}
            onClick={() => onRemove(screen)}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] sm:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <ScreenNameField id={screen.id} name={screen.name} onRename={(name) => onRename(screen, name)} />
          <SectionCountField value={screen.sections} onChange={(sections) => onSectionsChange(screen, sections)} />
        </div>
        <ScreenLayoutPreview contents={screen.contents} label={SCREENS_PANEL_COPY.previewLabel(screen.name, screen.sections)} />
      </div>
    </Card>
  )
}
