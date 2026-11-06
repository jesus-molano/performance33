import type { DisplayDensity } from '@/features/display/utils/autoFit'

/** Spacing/size classes that differ between the compact (narrow slot) and comfortable layouts. All em. */
interface DensityStyles {
  content: string
  /** Gap and divider between the two parts of a split screen. */
  split: string
  /** The block card and the space below it. */
  card: string
  /** Header band: padding and gaps. */
  band: string
  /** Letter (or warm-up icon) tile in the band. */
  tile: string
  /** Custom title, headline and subtitle: stacked, or on one flowing line in narrow slots. */
  titles: string
  headline: string
  overline: string
  subtitle: string
  /** Type and rest pills on the right of the band. */
  chip: string
  /** Everything under the band. */
  body: string
  blockText: string
  note: string
  exerciseList: string
  bracket: string
  row: string
  label: string
  /** Exercise name and prescription: the same size, the largest text in a block. */
  main: string
  /** Cue and tempo/rest lines. */
  secondary: string
}

export const DENSITY_STYLES: Record<DisplayDensity, DensityStyles> = {
  compact: {
    // The width limit only acts on a landscape screen: the prescription stays close enough to its name to follow the row.
    content: 'mx-auto w-full max-w-[62em] gap-[0.5em] px-[0.45em] pt-[0.4em] pb-[0.1em]',
    split: '',
    card: 'mb-[0.5em] rounded-[0.55em]',
    band: 'gap-x-[0.45em] gap-y-[0.15em] px-[0.4em] py-[0.2em]',
    tile: 'min-w-[1.45em] rounded-[0.3em] px-[0.2em] text-[1.35em]',
    titles: 'flex flex-wrap items-baseline gap-x-[0.4em]',
    headline: 'text-[1.3em] leading-[1.2]',
    overline: 'text-[1em]',
    subtitle: 'text-[1.1em] leading-[1.2]',
    chip: 'rounded-[0.35em] px-[0.4em] text-[1.1em]',
    body: 'px-[0.5em] pt-[0.1em] pb-[0.15em]',
    blockText: 'line-clamp-3 py-[0.1em] text-[1.25em] leading-snug',
    note: 'my-[0.15em] gap-[0.4em] rounded-[0.45em] px-[0.5em] py-[0.1em] text-[1.25em] leading-snug',
    exerciseList: '',
    bracket: 'border-l-[0.18em] pl-[0.4em]',
    row: 'gap-x-[0.35em] py-[0.14em]',
    label: 'min-w-[1.7em] rounded-[0.35em] px-[0.25em] text-[1.15em]',
    main: 'text-[1.5em] leading-[1.15]',
    secondary: 'text-[1.25em] leading-snug',
  },
  comfortable: {
    content: 'gap-[1em] px-[1.2em] pt-[1em] pb-[0.3em]',
    split: '[column-gap:2.4em] [column-rule-style:solid] [column-rule-width:0.2em]',
    card: 'mb-[1em] rounded-[0.9em]',
    band: 'gap-x-[0.7em] gap-y-[0.2em] px-[0.8em] py-[0.45em]',
    tile: 'min-w-[1.5em] rounded-[0.3em] px-[0.25em] text-[1.9em]',
    titles: '',
    headline: 'text-[1.6em] leading-tight',
    overline: 'text-[1em]',
    subtitle: 'text-[1.2em] leading-snug',
    chip: 'rounded-[0.4em] px-[0.55em] py-[0.05em] text-[1.3em]',
    body: 'px-[1em] pt-[0.3em] pb-[0.5em]',
    blockText: 'pt-[0.3em] text-[1.4em] leading-snug whitespace-pre-line',
    note: 'mt-[0.5em] gap-[0.5em] rounded-[0.6em] px-[0.7em] py-[0.4em] text-[1.35em] leading-snug',
    exerciseList: '',
    bracket: 'ml-[0.2em] border-l-[0.22em] pl-[0.7em]',
    row: 'gap-x-[0.6em] py-[0.45em]',
    label: 'min-w-[2.1em] rounded-[0.4em] px-[0.35em] text-[1.25em]',
    main: 'text-[1.9em] leading-[1.15]',
    secondary: 'text-[1.35em] leading-snug',
  },
}
