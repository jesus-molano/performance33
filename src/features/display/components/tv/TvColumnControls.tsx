import { plural } from '@/lib/format'
import { TV_COLUMN_TEXTS } from '@/features/display/config/tv'
import { OverlayButton } from '@/features/display/components/screen/OverlayButton'

interface TvColumnControlsProps {
  count: number
  canAdd: boolean
  canRemove: boolean
  onAdd: () => void
  onRemove: () => void
}

/** '− columna · 3 columnas · + columna' for the Modo TV toolbar. */
export function TvColumnControls({ count, canAdd, canRemove, onAdd, onRemove }: TvColumnControlsProps) {
  return (
    <>
      <OverlayButton label={TV_COLUMN_TEXTS.removeLabel} onClick={onRemove} disabled={!canRemove} wide>
        {TV_COLUMN_TEXTS.remove}
      </OverlayButton>
      <span aria-live="polite" className="px-1 text-sm font-semibold whitespace-nowrap tabular opacity-80">
        {plural(count, TV_COLUMN_TEXTS.singular, TV_COLUMN_TEXTS.plural)}
      </span>
      <OverlayButton label={TV_COLUMN_TEXTS.addLabel} onClick={onAdd} disabled={!canAdd} wide>
        {TV_COLUMN_TEXTS.add}
      </OverlayButton>
    </>
  )
}
