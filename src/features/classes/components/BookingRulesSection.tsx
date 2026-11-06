import { Select, Switch } from '@/components/ui'
import { SettingsSection } from '@/features/settings/components/SettingsSection'
import { SCHEDULE_COPY } from '@/features/classes/config/copy'
import type { BookingRulesEditor } from '@/features/classes/hooks/useBookingRulesEditor'

/** How far ahead members book, when cancelling stops being free and how the waitlist works. Saved on each change. */
export function BookingRulesSection({ editor, canEdit }: { editor: BookingRulesEditor; canEdit: boolean }) {
  const { settings, options } = editor
  return (
    <SettingsSection title={SCHEDULE_COPY.rulesTitle} description={SCHEDULE_COPY.rulesDescription}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={SCHEDULE_COPY.horizon}
          options={options.horizonDays}
          value={String(settings.horizonDays)}
          onChange={(value) => editor.setNumber('horizonDays', value)}
          disabled={!canEdit}
        />
        <Select
          label={SCHEDULE_COPY.cancelUntil}
          options={options.cancelUntilMinutes}
          value={String(settings.cancelUntilMinutes)}
          onChange={(value) => editor.setNumber('cancelUntilMinutes', value)}
          disabled={!canEdit}
        />
      </div>
      <Switch
        checked={settings.lateCancelCounts}
        onChange={(value) => editor.setFlag('lateCancelCounts', value)}
        label={SCHEDULE_COPY.lateCancel}
        description={SCHEDULE_COPY.lateCancelHint}
        disabled={!canEdit}
      />
      <Switch
        checked={settings.waitlistEnabled}
        onChange={(value) => editor.setFlag('waitlistEnabled', value)}
        label={SCHEDULE_COPY.waitlist}
        description={SCHEDULE_COPY.waitlistHint}
        disabled={!canEdit}
      />
      {settings.waitlistEnabled && (
        <Select
          label={SCHEDULE_COPY.promoteUntil}
          options={options.promoteUntilMinutes}
          value={String(settings.promoteUntilMinutes)}
          onChange={(value) => editor.setNumber('promoteUntilMinutes', value)}
          disabled={!canEdit}
          containerClassName="sm:max-w-[calc(50%-0.5rem)]"
        />
      )}
    </SettingsSection>
  )
}
