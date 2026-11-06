import { Input } from '@/components/ui'
import { TV_SCREEN_NAME_MAX_LENGTH } from '@/config/app'
import { SCREENS_PANEL_COPY } from '@/features/screens/config/panel'
import { useScreenNameDraft } from '@/features/screens/hooks/useScreenNameDraft'

export interface ScreenNameFieldProps {
  id: number
  name: string
  onRename: (name: string) => void
}

/** Name of a screen (toolbar and tab of its window): saved on blur or Enter. */
export function ScreenNameField({ id, name, onRename }: ScreenNameFieldProps) {
  const draft = useScreenNameDraft(id, name, onRename)
  return (
    <Input
      label={SCREENS_PANEL_COPY.nameLabel}
      value={draft.text}
      maxLength={TV_SCREEN_NAME_MAX_LENGTH}
      nativeUndo
      onChange={(e) => draft.onChange(e.target.value)}
      onBlur={draft.commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}
