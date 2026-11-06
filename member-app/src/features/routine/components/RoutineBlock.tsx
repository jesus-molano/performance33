import { StyleSheet, View } from 'react-native'
import type { DisplayBlock } from '@shared/routine/displayTypes.ts'
import { foldLines } from '@shared/routine/format/text.ts'
import { AppText } from '@/components/ui/AppText'
import { Card } from '@/components/ui/Card'
import { COLORS, RADIUS, SPACING } from '@/config/theme'
import { ExerciseLine } from './ExerciseLine'

/** A block as the gym's screens show it: letter, headline ('EMOM 10′'), badge, lines, note and footer. */
export function RoutineBlock({ block }: { block: DisplayBlock }) {
  return (
    <Card style={block.muted ? styles.muted : undefined}>
      <View style={styles.header}>
        {block.letter ? (
          <View style={styles.letter}>
            <AppText variant="large" color={COLORS.white}>
              {block.letter}
            </AppText>
          </View>
        ) : null}
        <View style={styles.titles}>
          <AppText variant="large">{block.headline}</AppText>
          {block.subtitle ? (
            <AppText variant="small" muted>
              {block.subtitle}
            </AppText>
          ) : null}
        </View>
        {block.chip ? <Chip text={block.chip} /> : null}
      </View>
      {block.text ? <AppText muted>{foldLines(block.text)}</AppText> : null}
      {block.exercises.map((line) => (
        <ExerciseLine key={line.id} line={line} />
      ))}
      {block.note ? (
        <AppText variant="small" color={COLORS.accent} style={styles.note}>
          {block.note}
        </AppText>
      ) : null}
      {block.footer ? (
        <AppText variant="small" muted>
          {block.footer}
        </AppText>
      ) : null}
    </Card>
  )
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <AppText variant="small" color={COLORS.accent} style={styles.chipText}>
        {text}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  muted: { backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  letter: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { flex: 1 },
  chip: { borderRadius: RADIUS.pill, backgroundColor: COLORS.accentSoft, paddingVertical: 2, paddingHorizontal: SPACING.md },
  chipText: { fontWeight: '700' },
  note: { fontWeight: '600' },
})
