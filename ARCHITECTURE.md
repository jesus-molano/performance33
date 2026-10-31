# Performance33 · Rutinas — Architecture

Vite 8 + React 19 + TypeScript (strict) + Tailwind v4 + zustand 5 + zundo 2 + @dnd-kit + lucide-react + nanoid.
All UI text is Spanish (Spain), informal "tú". Hash routing. Data in localStorage behind a `Repository`.

## 1. Code rules (mandatory)

- Small focused components (< 150 lines). Shared primitives in `src/components/ui`. Feature code in
  `src/features/<feature>/{components,hooks,utils,pages}` with a barrel `index.ts`.
- Logic out of components: store wiring, derived data and effects live in custom hooks (`useXxx`);
  pure functions in `src/lib` or `features/<f>/utils` (no React inside, unit-testable).
- Strict TS, no `any`, named exports only, constants in `src/config` (no magic values inline),
  no duplicated logic, no dead or commented-out code, brief comments only where intent is non-obvious.
- Read data ONLY through the selector hooks in `src/store` (never `useAppStore(s => s)`).
  Write data ONLY through store actions (`useAppActions()`).

## 2. Folder structure

Conventions: imports use the `@/` alias (`@/components/ui`, `@/hooks`, `@/store`, `@/features/<f>`) and
barrels where they exist; `./` only for siblings. A feature may add a `store/` folder for its own
ephemeral UI store (e.g. `features/editor/store/editorUiStore.ts`); global UI stores live in `src/store`.
Components never touch stores directly: they use feature hooks (e.g. `useExerciseFields`, `useBlockCard`).
Pure functions have unit tests next to them (`*.test.ts`, run with `npm test`).

```
src/
  main.tsx, App.tsx            route switch: screen routes vs dashboard
  app/DashboardRoot.tsx        bootstrap data + autosave/sync, branding vars, Ctrl+Z, coach guard
  app/DashboardPage.tsx        dashboard route → page
  app/ScreenRoutes.tsx         display/tv routes → pages (no private data loaded)
  index.css                    Tailwind v4 @theme tokens
  types.ts                     domain types
  config/  app.ts blockTypes.ts branding.ts colors.ts exerciseFields.ts plans.ts synonyms.ts
  data/    exercises.ts (294 exercises, EXERCISE_LIBRARY, EXERCISE_CATEGORIES)  seed/ (createSeedData)
  lib/     arrays blocks branding cn color dates debounce displayWindow factories files ids numbers
           plans program programDates progression routes search  format/  display/
  store/   appStore history hooks selectors locate types undoGroup uiStore toastStore confirmStore slices/*
  persistence/ repository localStorageRepository repositoryInstance migrate backup channels sync dashboardSync tabId
  hooks/   useHashRoute useDisclosure useMediaQuery(useIsMobile) useDebouncedValue useClickOutside useToast
           useConfirm useUndoRedo useUndoShortcuts useDisplayWindow useDisplayData useBrandingStyles
           useDashboardBootstrap useModalBehavior
  components/ui/  Button IconButton Input Textarea Select Field SegmentedControl Chip Badge Avatar Card
                  EmptyState Switch HelpTip Privacy(PrivacyLabel, PrivateSurface) Modal ConfirmDialog(ConfirmHost)
                  Toaster DropdownMenu styles
  components/ColorSwatchPicker.tsx   colour swatch radio group (coach + client forms)
  features/{shell,coaches,clients,settings,editor,display}/
```

## 3. Routes (`src/lib/routes.ts`)

| Hash | Route | Page (props) |
|---|---|---|
| `#/` | `pick-coach` | `CoachPickerPage` |
| `#/clientes` | `clients` | `ClientsPage` |
| `#/clientes/:clientId` | `client` | `ClientDetailPage { clientId }` |
| `#/clientes/:clientId/programa/:programId` | `program` | `ProgramEditorPage { clientId, programId }` |
| `#/ajustes?tab=marca\|biblioteca\|monitores\|datos` | `settings` | `SettingsPage { tab: SettingsTab }` (default `marca`) |
| `#/pantalla/:clientId?dia=N&programa=pid` | `display` | `DisplayPage { clientId, day: number\|null, programId: string\|null }` |
| `#/tv?slots=cid:1,-,cid:2` | `tv` | `TvPage { slots: TvSlot[] }` (`TV_MIN_SLOTS`–`TV_MAX_SLOTS` = 1–4 columns, `-` = empty column; missing list → `TV_DEFAULT_SLOTS` = 3; old `cid:1,cid:2,` URLs still give 3) |

Helpers: `paths.*` builders, `navigate(path)`, `replaceRoute(path)` (no history entry), `parseRoute`,
`isScreenRoute`, `absoluteHashUrl`, `parseTvSlots`/`serializeTvSlots`, `SETTINGS_TABS`.
Hook: `useHashRoute(): Route`. Without a valid current coach every dashboard route renders the picker;
the picker must `navigate(paths.clients())` after choosing when the route is `#/`.

## 4. Store (`src/store`, import from `'@/store'`)

Data store = zustand + zundo; only `data: AppData` is tracked (limit 100). UI state (current coach,
save status), toasts and confirm requests live in separate stores and are never undone.
Edits to the same id + same fields within 1 s merge into one undo step (typing never undoes one char).
Call `breakUndoGroup()` on input blur if you want the next edit to start a new step.

Actions (`useAppActions()`; ids returned are the new entity id, `''` if the parent was not found):

- Coaches: `addCoach({name,color}) → id`, `updateCoach(id, patch)`, `deleteCoach(id) → boolean` (false if last).
- Clients: `addClient(NewClientInput) → id`, `updateClient(id, ClientPatch)`, `archiveClient(id)`,
  `restoreClient(id)`, `deleteClient(id)` (cascade programs+notes; confirm first).
- Programs: `createProgram(clientId, {name?,startDate?,weeks?,dayCount?,makeCurrent?}) → id`
  (dayCount default client.trainingDays, weeks 4, current by default), `updateProgram(id, {name})`,
  `setProgramDates(id, {startDate?|weeks?|endDate?})`, `duplicateProgram(id, {startDate?,makeCurrent?}) → id`
  ("Duplicar como nueva rutina", starts after the previous one ends or today), `setCurrentProgram(clientId, programId|null)`,
  `deleteProgram(id)` (confirm first; falls back to newest remaining).
- Days: `addDay(programId, {name?,label?}) → id`, `updateDay(dayId, {name?,label?})`, `duplicateDay(dayId) → id`,
  `deleteDay(dayId)`, `moveDay(dayId, toIndex)`.
- Blocks: `addBlock(dayId, type, {index?, withExercise?}) → id`, `updateBlock(blockId, {title?,note?,text?})`,
  `updateBlockParams(blockId, Partial<BlockParams>)` (undefined clears a key), `changeBlockType(blockId, type)`
  (keeps exercises), `duplicateBlock(blockId) → id`, `deleteBlock(blockId)`, `moveBlock(blockId, toDayId, toIndex)`,
  `copyBlockToDay(blockId, dayId) → id`, `copyBlockToAllDays(blockId) → count`.
- Exercises: `addExercise(blockId, init?: Partial<ExerciseEntry>, {index?, inherit = true}) → id`
  (inherits sets, reps, restSec, loadUnit from the row above), `updateExercise(exerciseId, ExercisePatch)`,
  `duplicateExercise(id) → id`, `deleteExercise(id)`, `moveExercise(id, toBlockId, toIndex)` (cross-block/day ok).
- Notes (private): `addNote(clientId, text, {pinned?}) → id` (author = current coach), `updateNote(id, {text?,pinned?})`, `deleteNote(id)`.
- Settings: `updateBranding(Partial<Branding>)`, `resetBranding()`, `addCustomExercise(CustomExerciseInput) → id`,
  `updateCustomExercise(id, patch)`, `deleteCustomExercise(id)`, `importData(AppData)` and `resetDemoData()` (both clear history).

History: `undo()`, `redo()`, `breakUndoGroup()`, `clearHistory()`; hooks `useUndoRedo() → {canUndo, canRedo, undo, redo}`.
`applyRemoteData` / `hydrateData` are for persistence only.

Selector hooks: `useAppData(selector)`, `useAppActions()`, `useCoaches()`, `useCoach(id|null)`,
`useCurrentCoachId()`, `useCurrentCoach()`, `useClients({includeArchived?})` (sorted by name),
`useClient(id)`, `useProgram(id)`, `useClientPrograms(clientId)` (newest first), `useCurrentProgram(clientId)`,
`useClientNotes(clientId)` (pinned first, newest first), `usePinnedNotes(clientId)`, `usePinnedNoteCounts()`,
`useBranding()`, `useExerciseLibrary()` (custom + built-in), `useSaveStatus() → {status:'idle'|'saving'|'saved'|'error', lastSavedAt}`,
`useHistoryState()`. UI store: `useUiStore(s => s.setCurrentCoach)` to switch coach.
Pure selectors: `findCoach`, `findClient`, `findProgram`, `sortClients`, `selectClientNotes`, `countPinnedNotes`,
`findDayContext`, `findBlockContext`, `findExerciseContext`.

## 5. Feature contracts (exact exports)

| Import from | Export | Props |
|---|---|---|
| `features/coaches` | `CoachPickerPage` | none |
| `features/shell` | `AppLayout` | `{ route: Route; children: ReactNode }` |
| `features/shell` | `NotFoundPage` | none |
| `features/clients` | `ClientsPage` | none |
| `features/clients` | `ClientDetailPage` | `{ clientId: string }` |
| `features/settings` | `SettingsPage` | `{ tab: SettingsTab }` |
| `features/editor` | `ProgramEditorPage` | `{ clientId: string; programId: string }` |
| `features/display` | `DisplayPage` | `{ clientId: string; day: number \| null; programId: string \| null }` |
| `features/display` | `TvPage` | `{ slots: TvSlot[] }` |
| `features/display` | `RoutineDisplay` | `{ routine: DisplayRoutine; dayNumber: number; layout?: 'column'\|'full'\|'preview'; fontScale?: number; flashBlockIds?: ReadonlySet<string> }` (pure) |
| `features/display` | `RoutinePreview` | `{ programId: string; dayId: string | null; className?: string }` (editor embeds it; owns its 640×1080 frame; reads store, sanitises with `toPublicClient` / `toPublicProgram`) |

Opening displays from anywhere (shell client page, editor header): `useDisplayWindow()` →
`openDisplay(clientId, day?, programId?)`, `openTv(slots?)`. Call directly in the click handler; a blocked popup
shows a toast with an "Abrir pantalla" retry. Display windows read ONLY `useDisplayData()` →
`{ data: DisplayData | null, version }` and format with `buildDisplayRoutine(data, clientId, {programId?})`,
`getDisplayableClients(data)`, `clampDayNumber(routine, day)` from `lib/display`. They must apply branding with
`useBrandingStyles(data.branding)` when data exists. Persist TV slot changes with `replaceRoute(paths.tv(slots))`.

Modo TV (`features/display`): `useTvSlots(slots, candidateClientIds)` owns every slot change (pure helpers in
`utils/tvSlots.ts`: `assignSlotClient` keeps the day when the same client is picked, `addSlot`/`removeLastSlot`/`moveSlot`)
and gives each column a stable `slotIds[i]` (React key + dnd-kit sortable id; never the index, client ids can repeat).
Columns are reordered by their grip (`TvColumns` + `useTvColumnSort`, pointer after `TV_DRAG_ACTIVATION_DISTANCE` px or
keyboard). The client picker is a searchable combobox (`useComboboxSearch`, pure logic in `utils/combobox.ts`) showing
first names only (`label` from `utils/clientOptions.ts`, plus `lastInitial` when two clients share a first name); an open
list keeps its column's controls visible. A single column renders `RoutineDisplay layout="full"`. TV copy lives in
`features/display/config/tv.ts`.

Routine density: `useAutoFit({ preferColumns, fontScale, fitKey })` picks `compact` (width < `AUTO_FIT.compactMaxAspect` ×
height: 3–4 TV columns, editor preview) or `comfortable` from the slot's shape, never fits below the readable floor
(`AUTO_FIT.readableUnitPerHeight`), splits into two sub-columns when `preferColumns` and each is ≥ `minColumnWidthUnits`,
else overflows with '…'. Per-density classes live in `components/routine/densityStyles.ts`; compact text never goes
below 1em (the floor) and the client-visible cue gets its own line (clamped to two).

## 6. Shared primitives (`components/ui`)

`Button {variant: primary|secondary|ghost|danger|dark, size: sm|md|lg, leftIcon?, rightIcon?, fullWidth?}` ·
`IconButton {icon, label (required), variant?, size: sm|md}` · `Input {label?, hint?, error?, leftIcon?, suffix?, nativeUndo?}` ·
`Textarea {label?, hint?, error?, nativeUndo?}` · `Select<T> {options, value, onChange(value), label?}` ·
`SegmentedControl<T> {options:{value,label,icon?}[], value, onChange, ariaLabel, size?, fullWidth?}` ·
`Chip {active?}` · `Badge {tone: neutral|brand|success|warning|danger|info|private, icon?, size?}` (tone = `getProgramStatus().tone`) ·
`Avatar {firstName, lastName?, color, imageUrl?, size: sm|md|lg|xl}` · `Card {padding: none|sm|md|lg}` ·
`EmptyState {icon, title, description?, action?}` · `Switch {checked, onChange, label, description?}` · `HelpTip {text}` ·
`PrivacyLabel {kind: private|visible}` · `PrivateSurface` (amber box) · `Modal {open, onClose, title, description?, footer?, size: sm|md|lg|xl}`
(bottom sheet < 768 px) · `ConfirmDialog` · `DropdownMenu {items: MenuItem[], label?, triggerIcon?, triggerSize?, align?}` ·
`Toaster`/`ConfirmHost` (already mounted in App). Hooks: `useToast() → {toast, toastUndo(message), dismiss}`,
`useConfirm() → (options) => Promise<boolean>`, `useDisclosure`, `useIsMobile`, `useMediaQuery`, `useDebouncedValue`,
`useClickOutside`, `useModalBehavior`.

## 7. Lib & config cheat-sheet

- Dates (local, never `new Date('YYYY-MM-DD')`): `todayISO, addDays, addWeeks, diffDays, endDateFor, weeksBetween,
  isValidISODate, parseISODate, toISODate, formatDateShort ('31 oct'), formatDateLong, formatDateWithWeekday,
  formatDateRange, formatDateTime ('hoy, 10:42'), formatRelativeDays`.
- Programs: `getProgramStatus(program|null) → {kind, label ('Semana 2 de 4' | 'Caduca en 3 días' | 'Sin rutina' | 'Caducada' | 'Empieza en N días'), detail, tone, info}`,
  `getProgramWeekInfo`, `formatWeekOf`, `getCurrentProgram`, `getClientPrograms`, `getProgramDisplayName`, `applyProgramDates`, `nextBlockStart`.
- Formatting (`lib/format`): `formatEntrySummary(entry, {showSets?, week?})` → '4 × 8-10 · 60 kg · desc. 90s',
  `getEntryParts`, `formatVolume`, `formatLoad` ('70% (56 kg)'), `formatSeconds` (30″, 1′30″), `formatRest`, `formatMinutes`,
  `formatDistance`, `formatCalories`, `plural`, `getBlockHeader(block) → {title, headline, badge?, chip?, subtitle?, footer?}`,
  `getBlockSummary` ('EMOM 12′ · 3 ejercicios'), `getExerciseLabels(dayBlocks, blockIndex)` (A1/A2 derived from position),
  `formatDayTitle`, `getInitials`, `formatFullName`.
- Blocks: `getBlockTitle`, `getAutoBlockTitle`, `shouldSuggestCircuit`, `blockShowsSets`, `isAccessoryBlock`;
  config `BLOCK_TYPE_META[type] {label, acronym?, description, icon, params, defaultParams, rowsHaveSets, allowsText, muted}`,
  `BLOCK_TYPE_ORDER`, `BLOCK_PARAM_META[param] {label, unit, help?}`, `INTERVAL_PRESETS`.
- Exercises: config `MEASURE_META/ORDER`, `LOAD_UNIT_META/ORDER` (with Spanish help), `PROGRESSION_TARGET_META`, `TEMPO_HELP`,
  `REP_CHIPS`, `REST_CHIPS`, `TIME_CHIPS`, `DEFAULT_SETS`, `DEFAULT_REPS`, `DEFAULT_PROGRESSION_STEP`;
  lib `createExercise`, `exercisePatchFromLibrary(lib, base?)`, `searchExercises(query, library, limit)` (accent-insensitive,
  synonyms, fuzzy), `findSimilarExercises`, `findExerciseByName`, `findExerciseById`, `matchesQuery` (client search),
  `normalizeText`, progression `buildLinearProgression(base, step, weeks)`, `fitProgression`, `resolveEntryForWeek`,
  `getProgressionValue`, `defaultProgressionTarget`, `getBaseValue`; numbers `parseNumber`, `formatNumber` ('22,5'), `parseOptionalInt`, `clamp`.
- Plans: `PLANS`, `PLAN_BY_ID`, `TRAINING_DAY_OPTIONS`, `planLabel(plan, days?)`, `formatTrainingDays`.
- Misc: `cn`, `pickColor`, `readableTextOn`, `AVATAR_COLORS`, `fileToDataUrl` (logo upload ≤ 1,5 MB), `DEFAULT_BRANDING`,
  persistence `downloadBackup(data)`, `readBackupFile(file) → Promise<AppData>`, timings in `config/app.ts`.

## 8. Persistence & sync

`Repository` interface (`load`, `loadSync`, `save(data, {source, revision})`, `clear`, `subscribe`) with
`LocalStorageRepository` (key `p33:data:v1`); swap in `persistence/repositoryInstance.ts` for Supabase.
Dashboard tabs: every local change is broadcast immediately (BroadcastChannel `p33-data` full data and
`p33-display` sanitised data) and saved after 400 ms (save pill: saving → saved/error). Remote changes are applied
without undo history and without re-saving (no echo loops); duplicates are filtered by (source, revision).
Display windows never load private data: `useDisplayData()` = initial sanitised read + live channel + storage event.
First run seeds demo data relative to today (Carla & Dani; Laura week 2/4 with pinned shoulder alert and a previous
block; Javier expires in 3 days; Marta elite 4 days with every block type; Carlos expired; Lucía no routine;
Andrés 1 day; Sergio archived). Every routine day has 4–5 realistic blocks (Laura's 'Pierna' day is the 5-block,
15-line stress case; her programs never contain overhead work, see `seed.test.ts`). Saved data has no seed version:
an existing browser keeps its old demo until "Restablecer datos de demostración".

## 9. Design tokens & UI conventions

Tailwind tokens (`src/index.css`): `brand` #f79cce (ONLY on black: sidebar, TV), `brand-strong` #d6449a (text/buttons on white),
`brand-soft`, `brand-line`, `ink` #0b0b0c (sidebar/TV bg), `ink-soft`, `ink-line`, `ink-muted`, `canvas` (app bg), `surface`,
`line`, `line-strong`, `fg`, `fg-muted`, `fg-subtle`, `private` / `private-bg` / `private-line` / `private-icon` (amber),
spacing `header` / `bottom-nav` (chrome sizes for sticky offsets), shadows `shadow-card`, `shadow-pop`, animations `animate-fade-in|slide-up|pop-in|flash`, utilities `tabular`, `scrollbar-none`.
Font Jost (400–800). Brand colours follow Ajustes at runtime via CSS variables.

- Light, calm dashboard (Linear/Notion-like): canvas background, white cards, hairline borders, rounded-2xl cards,
  rounded-xl controls, generous spacing; black sidebar with `branding.logoUrl` and pink active item.
- Touch targets ≥ 44 px (`Button`/`IconButton` md). No hover-only controls: secondary actions go in `DropdownMenu` ('⋯').
- PRIVATE = amber + lock + "Solo monitores" (`PrivateSurface`, `PrivacyLabel kind="private"`, `Badge tone="private"`).
  CLIENT-VISIBLE text fields (block note, cue) = `PrivacyLabel kind="visible"` ("Lo verá el cliente", eye, pink).
  Private data (notes, internalNote, lastName, goal) NEVER reaches display components: only `toDisplayData` output does
  (it carries `lastInitial`, the surname's first letter, only so the TV picker can tell apart two clients with the same first name).
- Autosave everywhere, no Save buttons. Row/block/day deletes: no confirm, show `toastUndo('Ejercicio eliminado')`.
  Confirm (`useConfirm`, `danger: true`) only for deleting a program/client, importing or resetting data; offer archive for clients.
- Spanish labels first, acronym as a badge and `HelpTip` for jargon (EMOM, AMRAP, RPE, RIR, tempo).
- Free-text friendly inputs (reps '8-10', 'máx'; load 'KB 16'); `inputMode="numeric"` for pure numbers.
- Mobile: single column, Modal becomes a bottom sheet, sticky day tabs in the editor, bottom nav in the shell.
- Store-bound inputs use store undo (global Ctrl+Z); local-state inputs (search boxes, modal forms) pass `nativeUndo`
  (Modal content already keeps native undo).
