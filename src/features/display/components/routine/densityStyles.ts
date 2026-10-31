import type { DisplayDensity } from '@/features/display/utils/autoFit'

/** Spacing/size classes that differ between the compact (narrow slot) and comfortable layouts. All em. */
interface DensityStyles {
  content: string
  columnGap: string
  card: string
  blockText: string
  note: string
  exerciseList: string
  bracket: string
  /** 'Actualizado' tag placement: compact cards have no room above them, so it sits inline. */
  flashTag: string
}

export const DENSITY_STYLES: Record<DisplayDensity, DensityStyles> = {
  compact: {
    content: 'gap-[0.6em] px-[0.75em] pt-[0.65em] pb-[0.3em]',
    columnGap: '[column-gap:1em]',
    card: 'mb-[0.45em] rounded-[0.6em] px-[0.7em] py-[0.4em]',
    blockText: 'mt-[0.2em] text-[1.15em] leading-snug',
    note: 'mt-[0.25em] gap-[0.4em] rounded-[0.45em] px-[0.5em] py-[0.2em] text-[1.1em] leading-snug',
    exerciseList: 'mt-[0.15em]',
    bracket: 'ml-[0.1em] border-l-[0.18em] pl-[0.5em]',
    flashTag: 'ml-auto self-center',
  },
  comfortable: {
    content: 'gap-[1.1em] px-[1.3em] pt-[1.2em] pb-[0.4em]',
    columnGap: '[column-gap:1.4em]',
    card: 'mb-[0.9em] rounded-[0.9em] px-[1em] py-[0.85em]',
    blockText: 'mt-[0.5em] text-[1.4em] leading-snug whitespace-pre-line',
    note: 'mt-[0.5em] gap-[0.5em] rounded-[0.6em] px-[0.7em] py-[0.45em] text-[1.3em] leading-snug',
    exerciseList: 'mt-[0.45em]',
    bracket: 'ml-[0.2em] border-l-[0.22em] pl-[0.7em]',
    flashTag: 'absolute -top-[1.3em] right-0',
  },
}
