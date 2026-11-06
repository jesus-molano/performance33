import { MonitorPlay, Plus } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'
import { SCREENS_PANEL_COPY } from '@/features/screens/config/panel'
import { TV_WINDOWS_COPY } from '@/features/screens/config/tvWindows'
import { useDetectedDisplays } from '@/features/screens/hooks/useDetectedDisplays'
import { useScreensPanel } from '@/features/screens/hooks/useScreensPanel'
import { DetectedDisplaysCard } from './DetectedDisplaysCard'
import { ScreenCard } from './ScreenCard'
import { TvWindowsActions } from './TvWindowsActions'

/**
 * Ajustes → Pantallas: the gym's TVs, how many sections each one has and a button to open it. When the TVs are seen,
 * each one gets its screen by itself and adding one by hand goes to the foot, as an advanced option.
 */
export function ScreensPanel() {
  const panel = useScreensPanel()
  const displays = useDetectedDisplays(panel.screens)
  const loading = panel.status === 'idle'
  const addDisabled = !panel.canAdd || loading
  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">{SCREENS_PANEL_COPY.title}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">{panel.canAdd ? SCREENS_PANEL_COPY.description : SCREENS_PANEL_COPY.atMaximum}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <TvWindowsActions />
          {!panel.followsTvs && (
            <Button leftIcon={Plus} onClick={panel.add} disabled={addDisabled}>
              {SCREENS_PANEL_COPY.add}
            </Button>
          )}
        </div>
      </Card>
      {displays.visible && <DetectedDisplaysCard displays={displays} />}
      {loading && <p className="text-sm text-fg-muted">{SCREENS_PANEL_COPY.loading}</p>}
      {!loading && !panel.screens.length && <EmptyState icon={MonitorPlay} title={SCREENS_PANEL_COPY.empty} />}
      {panel.screens.map((screen) => (
        <ScreenCard
          key={screen.id}
          screen={screen}
          canRemove={panel.canRemove}
          removeBlockedLabel={panel.removeBlockedLabel}
          onRename={panel.rename}
          onSectionsChange={panel.setSections}
          onRemove={(target) => void panel.remove(target)}
          onOpen={panel.open}
        />
      ))}
      {panel.followsTvs && (
        <div className="flex flex-col items-start gap-1">
          <Button variant="ghost" size="sm" leftIcon={Plus} onClick={panel.add} disabled={addDisabled}>
            {TV_WINDOWS_COPY.addAdvanced}
          </Button>
          <p className="px-3 text-sm text-fg-subtle">{TV_WINDOWS_COPY.addAdvancedHint}</p>
        </div>
      )}
    </div>
  )
}
