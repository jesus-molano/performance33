import { Card, Select } from '@/components/ui'
import { ScreenDetectionNotice } from '@/components/ScreenDetectionNotice'
import { SCREEN_DETECTION_COPY } from '@/config/screenDetection'
import type { DetectedDisplaysApi } from '@/features/screens/hooks/useDetectedDisplays'

export interface DetectedDisplaysCardProps {
  displays: DetectedDisplaysApi
}

/** Ajustes → Pantallas: the TVs this computer sees, and the TV each screen opens on (kept on this computer). */
export function DetectedDisplaysCard({ displays }: DetectedDisplaysCardProps) {
  const { detection, tvCount, rows, choose } = displays
  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-fg">{SCREEN_DETECTION_COPY.title}</h2>
        {rows.length > 0 && <p className="mt-0.5 text-sm text-fg-muted">{SCREEN_DETECTION_COPY.description}</p>}
      </div>
      <ScreenDetectionNotice state={detection.state} tvCount={tvCount} onRequest={detection.request} />
      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <Select
              key={row.screen}
              label={SCREEN_DETECTION_COPY.opensOn(row.name)}
              options={row.options}
              value={row.value}
              onChange={(value) => choose(row.screen, value)}
              error={row.disconnected ? SCREEN_DETECTION_COPY.disconnected(row.name) : undefined}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
