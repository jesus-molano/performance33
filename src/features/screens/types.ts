// TV screens (Pantalla 1…8) and what each of their sections shows. Nothing private: a client id and a day number.

export interface ScreenConfig {
  /** 1..TV_MAX_SCREENS: 'Pantalla N' and the window #/tv?pantalla=N. */
  id: number
  name: string
  /** TV_MIN_SECTIONS..TV_MAX_SECTIONS. */
  sections: number
}

/** A section of a screen, both 1-based. */
export interface SectionRef {
  screen: number
  section: number
}

/** Who a section shows: a client (or nobody) on a day of their routine. */
export interface SectionTarget {
  clientId: string | null
  /** 1-based day number. */
  day: number
}

export interface SectionContent extends SectionTarget {
  /** ISO time it was sent there ('' for a section never used). */
  assignedAt: string
}

export interface ScreenSection extends SectionRef, SectionContent {}

/** Sections by id ('N:M'). Only rows that exist: a missing one is empty. */
export type SectionMap = Readonly<Record<string, ScreenSection>>

export interface ScreensSnapshot {
  screens: ScreenConfig[]
  sections: ScreenSection[]
}

/** One section to write and what it will show. */
export interface SectionWrite {
  ref: SectionRef
  content: SectionContent
}

/**
 * What a write did. `written` is what it wrote and `previous` what those sections showed before (undo puts it back
 * where nothing changed since). `saved` resolves to false when the server refused it or could not be reached: the
 * screens are then reloaded from the server.
 */
export interface SectionChange {
  written: SectionWrite[]
  previous: SectionWrite[]
  saved: Promise<boolean>
}

/** What an undo did: `skipped` sections had changed again and were left as they are. */
export interface UndoResult {
  skipped: number
  saved: Promise<boolean>
}

/** 'cached': showing the last copy of this browser until the first read works. */
export type ScreensStatus = 'idle' | 'cached' | 'ready'

/** A screen as the dashboard lists it. */
export interface ScreenView extends ScreenConfig {
  /** One per section, in order (empty ones included). */
  contents: SectionContent[]
  /** Its TV window is open somewhere right now. */
  online: boolean
}

export type ScreensEvent =
  | { kind: 'screen'; id: number; screen: ScreenConfig | null }
  | { kind: 'section'; id: string; section: ScreenSection | null }
