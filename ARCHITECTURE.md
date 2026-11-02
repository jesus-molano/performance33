# Performance33 · Rutinas — Architecture

Vite 8 + React 19 + TypeScript (strict) + Tailwind v4 + zustand 5 + zundo 2 + @dnd-kit + lucide-react + nanoid + supabase-js.
All UI text is Spanish (Spain), informal "tú", without technical words (never "Supabase"). Hash routing.
Data lives behind a `Repository`: Supabase when the env vars are set, localStorage in local test mode.

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
  main.tsx, App.tsx            refuses a half-configured build; starts the session; route switch: screen routes vs dashboard
  app/DashboardGate.tsx        session status → login / new password / no access / offline / dashboard
  app/DashboardRoot.tsx        bootstrap data + autosave/sync, branding vars, Ctrl+Z
  app/DashboardPage.tsx        dashboard route → page
  app/ScreenRoutes.tsx         display/tv routes → pages, behind the session (no private data loaded)
  index.css                    Tailwind v4 @theme tokens
  types.ts                     domain types
  config/  app.ts backend.ts (cloud | local | invalid, from env vars) blockTypes.ts capacity.ts branding.ts colors.ts exerciseFields.ts plans.ts synonyms.ts
  data/    exercises.ts (294 exercises, EXERCISE_LIBRARY, EXERCISE_CATEGORIES)  seed/ (createSeedData, SEED_TEAM)
  lib/     arrays blocks branding capacity cloudClient cn color dataRows dates debounce deepEqual displayWindow exerciseLibrary factories files ids numbers ownership pagination
           plans program programDates progression routes search  format/  display/
  auth/    types instance session messages supabaseAuth supabaseTeam localBackend
  store/   appStore history rebase hooks selectors locate types undoGroup uiStore sessionStore toastStore confirmStore slices/*
  persistence/ repository repositoryInstance localStorageRepository supabaseRepository rowGateway supabaseGateway dbRows
           displayCache migrate backup channels sync dashboardSync tabId
  hooks/   usePagination useExerciseBrowser useHashRoute useDisclosure useMediaQuery(useIsMobile) useDebouncedValue useClickOutside useToast
           useConfirm useUndoRedo useUndoShortcuts useDisplayWindow useDisplayData useBrandingStyles
           useDashboardBootstrap useSessionBootstrap useModalBehavior
  components/ui/  Button IconButton Input Textarea Select Field SegmentedControl Chip Badge Avatar Card
                  EmptyState Switch HelpTip Privacy(PrivacyLabel, PrivateSurface) Modal ConfirmDialog(ConfirmHost)
                  Toaster DropdownMenu Pagination PaginatedList styles
  components/  exercises/ (ExerciseSearchLink, ExerciseFilterFields), GoogleIcon, ColorSwatchPicker (profile + client forms), SplashScreen, ConfigErrorScreen, AppErrorBoundary
  features/{auth,team,shell,clients,settings,editor,display}/
supabase/  schema.sql (tables, RLS, triggers, realtime; run once)  schema.test.ts (checks it on real Postgres via PGlite)
```

## 3. Routes (`src/lib/routes.ts`)

| Hash | Route | Page (props) |
|---|---|---|
| `#/`, `#/clientes` | `clients` | `ClientsPage` |
| `#/clientes/:clientId` | `client` | `ClientDetailPage { clientId }` |
| `#/clientes/:clientId/programa/:programId` | `program` | `ProgramEditorPage { clientId, programId }` |
| `#/ajustes?tab=marca\|biblioteca\|equipo\|datos` | `settings` | `SettingsPage { tab: SettingsTab }` (default `marca`; monitors only get `biblioteca`, see `useSettingsTabs`) |
| `#/pantalla/:clientId?dia=N&programa=pid` | `display` | `DisplayPage { clientId, day: number\|null, programId: string\|null }` |
| `#/tv?slots=cid:1,-,cid:2` | `tv` | `TvPage { slots: TvSlot[] }` (`TV_MIN_SLOTS`–`TV_MAX_SLOTS` = 1–4 columns, `-` = empty column; missing list → `TV_DEFAULT_SLOTS` = 3; old `cid:1,cid:2,` URLs still give 3) |

Helpers: `paths.*` builders, `navigate(path)`, `replaceRoute(path)` (no history entry), `parseRoute`,
`isScreenRoute`, `absoluteHashUrl`, `parseTvSlots`/`serializeTvSlots`, `SETTINGS_TABS`.
Hook: `useHashRoute(): Route`. Without a ready session every dashboard route renders the login (or the
matching session screen) and keeps its address, so the person lands where they were going.

## 4. Store (`src/store`, import from `'@/store'`)

Data store = zustand + zundo; only `data: AppData` is tracked (limit 100). Session (`sessionStore`: status,
signed-in coach, team), save status, toasts and confirm requests live in separate stores and are never undone.
The team is NOT in AppData: not in undo, not in backups.
Edits to the same id + same fields within 1 s merge into one undo step (typing never undoes one char).
Call `breakUndoGroup()` on input blur if you want the next edit to start a new step.

Actions (`useAppActions()`; ids returned are the new entity id, `''` if the parent was not found):

- Clients: `addClient(NewClientInput) → id`, `updateClient(id, ClientPatch)`, `archiveClient(id)`,
  `restoreClient(id)`, `deleteClient(id)` (cascade programs+notes; confirm first).
- Programs: `createProgram(clientId, {name?,startDate?,weeks?,dayCount?,makeCurrent?}) → id`
  (dayCount default client.trainingDays, weeks 4, current by default), `updateProgram(id, {name})`,
  `setProgramDates(id, {startDate?|weeks?|endDate?})`, `duplicateProgram(id, {startDate?,makeCurrent?}) → id`
  ("Duplicar como nueva rutina", starts after the previous one ends or today), `setCurrentProgram(clientId, programId|null)`,
  `deleteProgram(id)` (confirm first; falls back to newest remaining).
- Days: `addDay(programId, {name?,label?}) → id`, `updateDay(dayId, {name?,label?})`, `settleDayNames(dayId)`, `duplicateDay(dayId) → id`,
  `deleteDay(dayId)`, `moveDay(dayId, toIndex)`.
- Blocks: `addBlock(dayId, type, {index?, withExercise?}) → id`, `updateBlock(blockId, {title?,note?,text?})`,
  `updateBlockParams(blockId, Partial<BlockParams>)` (undefined clears a key), `changeBlockType(blockId, type)`
  (keeps exercises), `duplicateBlock(blockId) → id`, `deleteBlock(blockId)`, `moveBlock(blockId, toDayId, toIndex)`,
  `copyBlockToDay(blockId, dayId) → id`, `copyBlockToAllDays(blockId) → count`.
- Exercises: `addExercise(blockId, init?: Partial<ExerciseEntry>, {index?, inherit = true}) → id`
  (inherits sets, reps, restSec, loadUnit from the row above), `updateExercise(exerciseId, ExercisePatch)`,
  `duplicateExercise(id) → id`, `deleteExercise(id)`, `moveExercise(id, toBlockId, toIndex)` (cross-block/day ok).
- Notes (private): `addNote(clientId, text, {pinned?}) → id` (author = signed-in coach), `updateNote(id, {text?,pinned?})`, `deleteNote(id)`.
- Settings: `updateBranding(Partial<Branding>)`, `resetBranding()`, `addCustomExercise(CustomExerciseInput) → id`,
  `updateCustomExercise(id, patch)`, `deleteCustomExercise(id)`, `importData(AppData)`, `resetDemoData()` and `loadDemoData()` (all clear history; signatures from people outside the team pass to the signed-in coach, see `adoptImportedData`).

History: `undo()`, `redo()`, `breakUndoGroup()`, `clearHistory()`; hooks `useUndoRedo() → {canUndo, canRedo, undo, redo}`.
`applyRemoteRows` / `hydrateData` are for persistence only.

Selector hooks: `useAppData(selector)`, `useAppActions()`, `useSessionStatus()`, `useCurrentStaff()` (signed-in coach),
`useIsAdmin()`, `useTeam()`, `useStaffMember(id|null)`, `useSessionNotice()`, `useClients({includeArchived?})` (sorted by name),
`useClient(id)`, `useProgram(id)`, `useClientPrograms(clientId)` (newest first), `useCurrentProgram(clientId)`,
`useClientNotes(clientId)` (pinned first, newest first), `usePinnedNotes(clientId)`, `usePinnedNoteCounts()`,
`useSessionEmail()`, `useBranding()`, `useExerciseLibrary()` (custom + built-in), `useSaveStatus() → {status:'idle'|'saving'|'saved'|'error', lastSavedAt}`,
`useHistoryState()`. Non-hook: `getCurrentStaffId()`.
Pure selectors: `findClient`, `findProgram`, `sortClients`, `selectClientNotes`, `countPinnedNotes`,
`findDayContext`, `findBlockContext`, `findExerciseContext`.

## 5. Feature contracts (exact exports)

| Import from | Export | Props |
|---|---|---|
| `features/auth` | `LoginPage`, `SetPasswordPage`, `NoAccessPage`, `SessionOfflinePage` | none |
| `features/auth` | `DataLoadFailedPage` | `{ onRetry: () => void }` |
| `features/team` | `TeamPanel` | none (Ajustes → Equipo) |
| `features/team` | `ProfileModal` | `{ staff: StaffMember; onClose: () => void }` (Mi perfil; render only while open) |
| `features/display` | `ScreenSignInRequired` | none (TV window without a session) |
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
full names, searchable by first name and surname (`label` from `utils/clientOptions.ts`); an open
list keeps its column's controls visible. A single column renders `RoutineDisplay layout="full"`. TV copy lives in
`features/display/config/tv.ts`.

Routine density: `useAutoFit({ preferColumns, fontScale, fitKey })` picks `compact` (width < `AUTO_FIT.compactMaxAspect` × height: 2–4 TV
columns, editor preview) or `comfortable` (full screen) from the slot's shape. `planFit` keeps the target size (`AUTO_FIT.target*`, names 28 px at
3 columns on 1080p) by hiding secondary content in the order of `DETAIL_LEVELS`: cues, then tempo/rest lines, then block notes. Only with all of that
hidden does the text go below the target, down to `lastResortUnitPerHeight`; below `readableUnitPerHeight` it reports `tooSmall`. The block's rest stays
in its header. The level is applied with CSS variables (`fitVars`), so measuring needs no re-render. `FitStatus.detailHidden` tells the editor preview to say so.
Per-density classes live in `components/routine/densityStyles.ts`. Name and prescription share one size, the prescription right-aligned; the current week's
progression value is shown without any week mark (the header already says 'Semana 2 de 4').

### Capacity

Limits in `config/capacity.ts`, rules in `lib/capacity.ts` (`getDayChangeRefusal` is the only rule: a number over its limit may stay or shrink, never grow).
Store actions apply it and return unchanged (`''` or nothing) on every path: add, duplicate, copy, move; `copyBlockToAllDays` skips the days that are full and
returns how many it did copy. `updateExercise`/`addExercise` cut name and cue to their maximum (`clampExerciseTexts`). Over-limit data (imports) still renders,
with a warning in `DayCapacityIndicator`. Editor: `getDayCapacity`, `AddExerciseButton`, `AddBlockButton`, `useCapacityToast`.

Measured at 1920 × 1080 with the limits at their maximum (5 blocks, 16 exercises), exercise name in px, nothing cut off:

| Day | 1 col | 2 col | 3 col | 4 col |
|---|---|---|---|---|
| Library names, 5 of them on two lines | 36,3 | 34,1 | 28,1 | 24,8 |
| All names of 30+ characters | not measured | not measured | 25,3 | 21,7 |
| All names of 44 characters | 30,0 | 30,4 | 21,7 | 21,7 |

A two-line name costs a full row: only about 20 lines fit at 28 px, which is why long names lower the size. Change a limit or a size only after measuring again.

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
- Programs: `getProgramStatus(program|null) → {kind, label ('Semana 2 de 4' | 'Termina en 3 días' | 'Sin rutina' | 'Finalizada' | 'Empieza en N días'), detail, tone, info}`,
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

`config/backend.ts` decides once: `cloud` (both env vars), `local` (neither, see below for published sites) or `invalid` (`main.tsx` shows
`ConfigErrorScreen` and never loads the app). `lib/cloudClient` is null unless cloud; `auth/instance` and
`persistence/repositoryInstance` pick from it, so the demo login cannot be reached when the cloud is set.

`Repository`: `load`, `save(getData, {source, revision})`, `saveDisplay`, `clear` (this device only), `release`, `subscribe`,
`loadDisplaySync`, `subscribeDisplay`, `sharesDataAcrossTabs`.

- `normalize*` in `migrate.ts` must be idempotent against what the store writes (`dbRows.test`): a cleared param stays cleared, and day names are not renumbered on read (`settleDayNames` does it when the field is left).
- `SupabaseRepository` (over a `RowGateway`, faked in its tests): one row per client, program, note, library exercise,
  plus the `settings` row (`lib/dataRows`, translation in `dbRows`). `base` = last version known on the server; `save` upserts or
  deletes ONLY `diff(base, latest)`, one save at a time. Same row: last write wins. Network errors reject (`dashboardSync` retries
  with backoff and shows 'Sin conexión, reintentando…'; `beforeunload` warns); refusals (`PermanentWriteError`) put that row back to
  the server version and show a toast. A `save` queued before `release()` never runs, not even once the next session has loaded. It reads nothing from or to
  localStorage but the display copy, whose write never throws (full device: `toCompactDisplayData`, only current routines of active clients).
- Live: realtime row events → `base` and store updated together (batched `REMOTE_BATCH_MS`), own echoes dropped by `client_origin`
  (deletes by `deleteEchoes`, registered before asking). Catch-up by `refetch()`: on reconnect, on tab focus, on `online`, and every `CLOUD_REFETCH_INTERVAL_MS`.
  A reload overlapped by a save or a live event is dropped and retried after `CLOUD_REFETCH_RETRY_MS`.
- Leaving the page: `visibilitychange` (phones) and `pagehide` flush the debounce; small writes use `keepalive` (`lib/keepalive`). Offline edits live only in memory.
- `applyRemoteRows(changes)` (`store/history`): replaces the rows in the store, without undo, keeping rows with unsaved local edits,
  and `rebaseSnapshots` puts the same rows in every past/future undo snapshot and drops steps left empty. Undo never overwrites another coach.
- `LocalStorageRepository` (local test mode, key `p33:data:v2`): whole dataset, shared across tabs by BroadcastChannel `p33-data` + storage
  event; `dashboardSync` turns those snapshots into row changes with `diffData`, so both modes apply remote changes the same way.
- TV windows: every change (local or remote) goes out on BroadcastChannel `p33-display` and to the sanitised cache
  (`displayCache`, key `p33:display:v1`). Display windows never load private data: `useDisplayData()` = initial sanitised read +
  live channel + storage event. They update only while a dashboard is open in that browser.

Session (`auth/session`, same flow in dashboards and TV windows, results in `useSessionStore`): `loading → signed-out | no-access |
recovery | offline | ready`. `getUser` rejects when it could not check (expired token, no connection), which never counts as a sign-out: `ready` stays, a cold start
goes to `offline`. `claim_staff_profile` decides access (re-checked on focus). Its first link needs a Google-only account with that same email or
`allow_password_account` (run by the database owner): a verified email alone is not enough, anyone can register a coach's address. Leaving removes the display cache; `dashboardSync`
watches the status and, in this order, stops listening, `repository.release()`s and empties the store (so emptying can never be saved as a
mass delete). API: `startSession`, `signOut`, `retrySession`, `finishRecovery`, `refreshTeam`, `watchTeam`, `auth`, `teamService` from `@/auth`;
`flushDashboardSaves()` from `@/persistence`; `refreshTeamQuietly` after a change that already worked. Login uses PKCE (tokens never in the hash the routes use), and Google always asks which account.

Permissions: `supabase/schema.sql` enforces them (RLS + triggers, tested in `schema.test.ts`); `lib/ownership` (`canEditNote`, `accessChangeError`,
`isActiveAdmin`, `canDeleteClient`) mirrors them for the UI and for local mode. To change a rule, change both and their tests. Only admins delete clients (the cascade
takes every coach's notes); monitors can still delete routines, since their undo works for them and they could overwrite those rows anyway.

Local mode: `cloud` wins; a production build without env vars is `invalid` unless `VITE_ALLOW_LOCAL_DEMO=true`, because it means a passwordless admin button. `vercel.json` sets the CSP and other headers.

Local mode seeds demo data on first run. An empty cloud does not: an admin gets 'Cargar datos de demostración' on the clients page (`loadDemoData`: adds clients, routines and notes, keeps branding and library).
Demo data is relative to today (Carla & Dani, `SEED_TEAM`; Laura week 2/4 with a shoulder important notification and a previous
block; Javier ends in 3 days; Marta elite 4 days with every block type; Carlos finished; Lucía no routine;
Andrés 1 day; Sergio archived). Every routine day has 4–5 realistic blocks (Laura's 'Pierna' day is the 5-block,
15-line stress case; her programs never contain overhead work, see `seed.test.ts`). Saved data has no seed version:
an existing browser keeps its old demo until "Restablecer datos de demostración" (admins only, typing `BORRAR`: `requireText` in `useConfirm`).

Not checkable without a real project, so check it there: Google OAuth and its account chooser, `auth.identities` contents for each sign-in path (Google, console-created,
outside password, and Google linked onto an unconfirmed outside password), password reset links, realtime payloads and reconnect, `schema.sql` under Supabase's own roles and default grants
(`information_schema.role_table_grants`), the last-admin lock under concurrency, and whether a stranger's realtime subscription sees the table and id of deleted rows (documented behaviour for DELETE events).

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
  Private data (notes, internalNote, goal) NEVER reaches display components: only `toDisplayData` output does.
  It carries `lastName` only for the coach-facing TV client picker; routine views show the first name alone.
- Autosave everywhere, no Save buttons. Row/block/day deletes: no confirm, show `toastUndo('Ejercicio eliminado')`.
  Confirm (`useConfirm`, `danger: true`) only for deleting a program/client, importing or resetting data; offer archive for clients.
- Pinned private notes are called "notificaciones importantes" in the UI (`ImportantBadge`, `ImportantNotes`, `CompactImportantNotes`); a routine past its end date is "Finalizada", one about to end "Termina en N días".
- Browsing exercises: `useExerciseBrowser` (filters + `usePagination`, pure logic in `lib/pagination`), `PaginatedList`, `ExerciseFilterFields`. `ExerciseSearchLink` (Google, `exerciseSearchUrl`) is dashboard only, never on the TV, and hidden on collapsed rows on phones (the row's sheet has it).
- Limited texts: `maxLength` on the field plus `getLengthHint` near the limit; the store clamp is only a safety net. At the limit, phone add buttons stay enabled and explain with a toast (`useDayAddActions`).
- Spanish labels first, acronym as a badge and `HelpTip` for jargon (EMOM, AMRAP, RPE, RIR, tempo).
- Free-text friendly inputs (reps '8-10', 'máx'; load 'KB 16'); `inputMode="numeric"` for pure numbers.
- Mobile: single column, Modal becomes a bottom sheet, sticky day tabs in the editor, bottom nav in the shell.
- Store-bound inputs use store undo (global Ctrl+Z); local-state inputs (search boxes, modal forms) pass `nativeUndo`
  (Modal content already keeps native undo).
