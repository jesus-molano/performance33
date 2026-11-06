import { StyleSheet, View } from 'react-native'
import type { DisplayExerciseLine } from '@shared/routine/displayTypes.ts'
import { AppText } from '@/components/ui/AppText'
import { COLORS, RADIUS, SPACING } from '@/config/theme'

/** 'A1  Sentadilla  4 × 8-10  60 kg', with tempo, rest and the coach's cue below. */
export function ExerciseLine({ line }: { line: DisplayExerciseLine }) {
  return (
    <View style={styles.row}>
      {line.label ? (
        <View style={styles.label}>
          <AppText variant="small" color={COLORS.accent} style={styles.labelText}>
            {line.label}
          </AppText>
        </View>
      ) : null}
      <View style={styles.body}>
        <AppText variant="large">{line.name}</AppText>
        <View style={styles.amounts}>
          {line.volume ? <AppText style={styles.volume}>{line.volume}</AppText> : null}
          {line.load ? <AppText color={COLORS.accent} style={styles.volume}>{line.load}</AppText> : null}
        </View>
        {line.detail ? (
          <AppText variant="small" muted>
            {line.detail}
          </AppText>
        ) : null}
        {line.cue ? (
          <AppText variant="small" muted style={styles.cue}>
            {line.cue}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.sm },
  label: {
    minWidth: 40,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  labelText: { fontWeight: '700' },
  body: { flex: 1, gap: 2 },
  amounts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACING.md },
  volume: { fontWeight: '700' },
  cue: { fontStyle: 'italic' },
})
