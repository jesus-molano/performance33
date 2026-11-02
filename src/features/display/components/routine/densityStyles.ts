import type { DisplayDensity } from '@/features/display/utils/autoFit'

/** Spacing/size classes that differ between the compact (narrow slot) and comfortable layouts. All em. */
interface DensityStyles {
  content: string
  /** Gap and divider between the two parts of a split screen. */
  split: string
  card: string
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
  /** 'Actualizado' tag placement: compact cards have no room above them, so it sits inline. */
  flashTag: string
}

export const DENSITY_STYLES: Record<DisplayDensity, DensityStyles> = {
  compact: {
    // The width limit only acts on a landscape screen: the prescription stays close enough to its name to follow the row.
    content: 'mx-auto w-full max-w-[62em] gap-[0.35em] px-[0.35em] pt-[0.35em] pb-[0.1em]',
    split: '',
    card: 'mb-[0.25em] rounded-[0.5em] px-[0.45em] py-[0.15em]',
    blockText: 'line-clamp-3 text-[1.25em] leading-snug',
    note: 'mt-[0.15em] gap-[0.4em] rounded-[0.45em] px-[0.5em] py-[0.1em] text-[1.25em] leading-snug',
    exerciseList: '',
    bracket: 'border-l-[0.18em] pl-[0.4em]',
    row: 'gap-x-[0.35em] py-[0.08em]',
    label: 'min-w-[1.7em] rounded-[0.35em] px-[0.25em] text-[1.15em]',
    main: 'text-[1.5em] leading-[1.15]',
    secondary: 'text-[1.25em] leading-snug',
    flashTag: 'ml-auto self-center',
  },
  comfortable: {
    content: 'gap-[1em] px-[1.2em] pt-[1em] pb-[0.3em]',
    split: '[column-gap:2.4em] [column-rule-style:solid] [column-rule-width:0.2em]',
    card: 'mb-[0.8em] rounded-[0.9em] px-[1em] py-[0.7em]',
    blockText: 'mt-[0.4em] text-[1.4em] leading-snug whitespace-pre-line',
    note: 'mt-[0.5em] gap-[0.5em] rounded-[0.6em] px-[0.7em] py-[0.4em] text-[1.35em] leading-snug',
    exerciseList: 'mt-[0.3em]',
    bracket: 'ml-[0.2em] border-l-[0.22em] pl-[0.7em]',
    row: 'gap-x-[0.6em] py-[0.35em]',
    label: 'min-w-[2.1em] rounded-[0.4em] px-[0.35em] text-[1.25em]',
    main: 'text-[1.9em] leading-[1.15]',
    secondary: 'text-[1.35em] leading-snug',
    flashTag: 'absolute -top-[1.3em] right-0',
  },
}
