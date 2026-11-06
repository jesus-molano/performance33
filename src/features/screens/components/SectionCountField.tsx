import { TriangleAlert } from 'lucide-react'
import { Callout, SegmentedControl } from '@/components/ui'
import { SCREENS_PANEL_COPY, SECTION_COUNT_OPTIONS } from '@/features/screens/config/panel'
import { isHardToRead } from '@/features/screens/utils/panel'

export interface SectionCountFieldProps {
  value: number
  onChange: (sections: number) => void
}

/** How many sections a screen has (1-6), with a warning when the text will be too small for the TV. */
export function SectionCountField({ value, onChange }: SectionCountFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium text-fg">{SCREENS_PANEL_COPY.sectionsLabel}</p>
        <p className="text-sm text-fg-muted">{SCREENS_PANEL_COPY.sectionsHint}</p>
      </div>
      <SegmentedControl
        ariaLabel={SCREENS_PANEL_COPY.sectionsLabel}
        options={SECTION_COUNT_OPTIONS}
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        fullWidth
      />
      {isHardToRead(value) && (
        <Callout tone="warning" icon={TriangleAlert}>
          {SCREENS_PANEL_COPY.readability}
        </Callout>
      )}
    </div>
  )
}
