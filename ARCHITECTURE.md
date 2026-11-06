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
  app/DashboardGate.tsx        session status → login / create password / no access / offline / dashboard
  app/DashboardRoot.tsx        bootstrap data + autosave/sync, branding vars, Ctrl+Z
  app/DashboardPage.tsx        dashboard route → page
  app/ScreenRoutes.tsx         display/tv routes → pages, behind the session (sanitised data only)
  index.css                    Tailwind v4 @theme tokens
  types.ts                     domain types
  config/  app.ts backend.ts (cloud | local | invalid, from env vars) blockTypes.ts capacity.ts branding.ts colors.ts exerciseFields.ts exerciseTags.ts plans.ts synonyms.ts
  data/    exercises.ts (EXERCISE_LIBRARY, 322 exercises: only the initial seed)  seed/ (createSeedData, SEED_TEAM, LOCAL_TEST_PASSWORDS)
  lib/     accountRules (re-exports functions/_shared/accounts) accountMessages arrays blocks branding calendar capacity cloudClient cn color dataRows dates dateText debounce deepEqual displayWindow screenDetails detectedDisplays tvDisplays tvDisplayStore tvPlacement tvControl autoFullscreen exerciseLibrary factories files ids numbers ownership pagination
           plans program programDates progression routes search  format/  display/
  auth/    types instance session messages signInMethods edgeFunctions supabaseAuth supabaseTeam localBackend localAccounts localTeam
  store/   appStore history rebase hooks selectors locate types undoGroup uiStore sessionStore toastStore confirmStore slices/*
  persistence/ repository repositoryInstance localStorageRepository supabaseRepository rowGateway supabaseGateway dbRows
           cloudDisplayFeed displayCache migrate libraryTags backup channels sync dashboardSync tabId
  hooks/   usePagination useExerciseBrowser useHashRoute useDisclosure useMediaQuery(useIsMobile) useDebouncedValue useClickOutside useToast
           useConfirm useUndoRedo useUndoShortcuts useDisplayWindow useDisplayData useBrandingStyles useScreenDetails useTvDisplays useAutoFullscreenPermission
           useDashboardBootstrap useSessionBootstrap useModalBehavior
  components/ui/  Button IconButton Input DateField CalendarDialog Textarea Select Field SegmentedControl Chip Badge Avatar Card
                  EmptyState Switch HelpTip Privacy(PrivacyLabel, PrivateSurface) Modal ConfirmDialog(ConfirmHost)
                  Toaster DropdownMenu Pagination PaginatedList styles
  components/  exercises/ (ExerciseLink, ExerciseFilterFields), GoogleIcon, ColorSwatchPicker (profile + client forms), SplashScreen, ConfigErrorScreen, AppErrorBoundary
  features/{auth,team,shell,clients,settings,editor,display,screens}/
supabase/  schema.sql (tables, RLS, triggers, realtime; re-run whole on every update)  schema.test.ts (checks it on real Postgres via PGlite, also over fixtures/schema.previous.sql, the live project's last version)  config.toml
  functions/  admin-users/ login-username/ (thin Deno entry points, outside the Vite and tsc builds)
              _runtime/ (Deno only: env and clients)  _shared/ (pure TS with injected backends: type-checked by tsconfig.node, tested by vitest)
```

## 3. Routes (`src/lib/routes.ts`)

| Hash | Route | Page (props) |
|---|---|---|
| `#/`, `#/clientes` | `clients` | `ClientsPage` |
| `#/clientes/:clientId` | `client` | `ClientDetailPage { clientId }` |
| `#/clientes/:clientId/programa/:programId` | `program` | `ProgramEditorPage { clientId, programId }` |
| `#/ajustes?tab=marca\|biblioteca\|pantallas\|equipo\|datos` | `settings` | `SettingsPage { tab: SettingsTab }` (default `marca`; monitors only get `biblioteca` and `pantallas`, see `useSettingsTabs`) |
| `#/pantalla/:clientId?dia=N&programa=pid` | `display` | `DisplayPage { clientId, day: number\|null, programId: string\|null }` (phone: normal page with scroll) |
| `#/tv?pantalla=2` | `tv` | `TvPage { screen: number, legacySlots: TvSlot[] \| null }` (phone: list of people; no or invalid `pantalla` = Pantalla 1; its sections live in the database, see Screens). Old links `#/tv?slots=cid:1,-,cid:2&pantalla=2` still open: `legacySlots` fills that screen if it shows nobody, once per link and device (`utils/legacyLinks.ts`), then the address loses `slots` |

Helpers: `paths.*` builders (`paths.tv(screen)`), `navigate(path)`, `replaceRoute(path)` (no history entry), `parseRoute`,
`isScreenRoute`, `absoluteHashUrl`, `parseLegacyTvSlots`/`serializeTvSlots`, `SETTINGS_TABS`.
Hook: `useHashRoute(): Route`. Without a ready session every dashboard route renders the login (or the
matching session screen) and keeps its address, so the person lands where they were going.

## 4. Store (`src/store`, import from `'@/store'`)

Data store = zustand + zundo; only `data: AppData` is tracked (limit 100). Session (`sessionStore`: status,
own profile, team), save status, toasts and confirm requests live in separate stores and are never undone.
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
- Settings: `updateBranding(Partial<Branding>)`, `resetBranding()`, `addLibraryExercise(LibraryExerciseInput) → id`,
  `updateLibraryExercise(id, patch)` (`link: ''` removes the link), `deleteLibraryExercise(id)` (rows using it become free text), `importData(AppData)`, `resetDemoData()` and `loadDemoData()` (all clear history; signatures from people outside the team pass to the signed-in coach, see `adoptImportedData`).

History: `undo()`, `redo()`, `breakUndoGroup()`, `clearHistory()`; hooks `useUndoRedo() → {canUndo, canRedo, undo, redo}`.
`applyRemoteRows` / `hydrateData` are for persistence only.

Selector hooks: `useAppData(selector)`, `useAppActions()`, `useSessionStatus()`, `useCurrentProfile()` (own `Profile`),
`useIsAdmin()`, `useTeam()` (`TeamMember[]`), `useTeamMember(id|null)`, `useSessionNotice()`, `useClients({includeArchived?})` (sorted by name),
`useClient(id)`, `useProgram(id)`, `useClientPrograms(clientId)` (newest first), `useCurrentProgram(clientId)`,
`useClientNotes(clientId)` (pinned first, newest first), `usePinnedNotes(clientId)`, `usePinnedNoteCounts()`,
`useSessionEmail()`, `useBranding()`, `useExerciseLibrary()`, `useExerciseLibraryLink(id|null)`, `useSaveStatus() → {status:'idle'|'saving'|'saved'|'error', lastSavedAt}`,
`useHistoryState()`. Non-hook: `getCurrentProfileId()`.
Pure selectors: `findClient`, `findProgram`, `sortClients`, `selectClientNotes`, `countPinnedNotes`,
`findDayContext`, `findBlockContext`, `findExerciseContext`.

## 5. Feature contracts (exact exports)

| Import from | Export | Props |
|---|---|---|
| `features/auth` | `LoginPage`, `CreatePasswordPage`, `NoAccessPage`, `SessionOfflinePage` | none |
| `features/auth` | `DataLoadFailedPage` | `{ onRetry: () => void }` |
| `features/team` | `TeamPanel` | none (Ajustes → Equipo) |
| `features/screens` | `ScreensPanel` | none (Ajustes → Pantallas, and the same list in the 'Pantallas' menu: add up to `TV_MAX_SCREENS`, remove with confirmation (one always stays; its window in this browser closes, `closeTvScreen`), name saved on blur, 1-6 sections with a mini preview from `gridFor` (`emptyGridCells` filled with the background) and an undo toast (Ctrl+Z too) when fewer sections empty someone, readability warning above `TV_READABLE_SECTIONS`, "Abrir" via `useDisplayWindow().openTv`; `useScreensPanel`, pure rules in `utils/panel.ts`. Above the list, computers only, `DetectedDisplaysCard` ("Teles detectadas en este portátil": `ScreenDetectionNotice` and, with more than one screen seen, a select per screen of the TV it opens on, kept on this computer; `useDetectedDisplays`, `utils/detectedDisplays.ts`; at its foot `AutoFullscreenStatus`: "Pantalla completa automática: Activada ✓ / Sin activar", and when off, for admins only (`useIsAdmin`), the two steps and the download links of `public/teles/*.reg`; coaches read "pulsa una vez «Pantalla completa»"; `unsupported` (Firefox, Safari) only says "Este navegador no puede: usa Chrome", no links). In the header "Traer al portátil" / "Cerrar todas" (`TvWindowsActions`) and "Añadir pantalla" only while the TVs are not seen) |
| `features/screens` | `ScreenSendButton` | `{ clientId: string; day: number; dayLabel: string; className?: string }` ("Pantalla" on each day of the current routine, "Mandar" on phones: click opens `ScreenPicker` (one card per TV with its sections in the TV grid, "Libre" or the first name (archived people count as free), "Ya está aquí" for the same day or "Ahora Día N · cambiar", windows not open grey with "Sin abrir" and "Abrir"); one tap sends, moving the person out of any other section, replacing; the toast names the day, who was replaced and where the person came from, and its "Deshacer" (or Ctrl+Z while it is up: `toastUndoAction`, `takeShortcutUndo`; toasts pause on hover/focus) puts back only the sections nobody changed since (`utils/undo.ts`, `planUndo`); Ctrl/Cmd+click or a long press sends to the last section used on this device (`store/lastDestination.ts`). `useSendToScreen`; the click/long-press wiring `useSendButton` (on `useLongPress`) and the look `SendButton` are shared with `ClientScreenButton`; pure rules in `utils/picker.ts`. A screen with `PICKER_WIDE_COLUMNS` = 4 sections side by side takes the whole width of the picker and its tiles say only the number on phones (`sectionShort`; the full place stays in the aria-label); «Última» sits under the name; also in the editor day ⋯ menu (`DayMenu`) and the editor header (`size="md"`), current routine only. `ScreenPicker` takes optional `children` shown above the screens) |
| `features/clients` | `ClientScreenButton` (internal) | `{ client; program: Program or null; iconOnPhones?: boolean }` ('Pantalla' on each card (footer, beside ⋯) and list row (actions column, `CLIENT_ROW_ACTIONS_WIDTH`, icon only on phones; 'Mandar' on phone cards): the picker starts with day chips `ScreenDayChips` on the day the person shows on a TV now (`shownScreenDay`, `initialScreenDay`; Día 1 when on none: the app has no 'next session'), back there when the picker closes, then the section; Ctrl+clic or a long press sends that same day to the last section. No current routine (or no days): disabled, tooltip 'Sin rutina'. `useClientScreenSend`, pure `utils/screenDays.ts`, copy `CLIENT_SCREEN_COPY`) |
| `features/screens` | `ScreensStatusChip` | `{ summary, expanded, onClick }` (top bar, via `shell/ScreensStatusMenu`: "Pantallas 2/2", "1 sin abrir", "Ninguna abierta → Abrir"; the menu is `TvScreensList`; `useTvDisconnectAlert` toasts "Pantalla 2 desconectada…" when the TV of a screen whose window is open in this browser goes away (`useBrowserScreenPresence`: TV windows also announce themselves over BroadcastChannel)) |
| `features/team` | `ProfileModal` | `{ profile: Profile; onClose: () => void }` (Mi perfil; render only while open) |
| `features/display` | `ScreenSignInRequired` | none (TV window without a session) |
| `features/shell` | `AppLayout` | `{ route: Route; children: ReactNode }` |
| `features/shell` | `NotFoundPage` | none |
| `features/clients` | `ClientsPage` | none |
| `features/clients` | `ClientDetailPage` | `{ clientId: string }` |
| `features/settings` | `SettingsPage` | `{ tab: SettingsTab }` |
| `features/editor` | `ProgramEditorPage` | `{ clientId: string; programId: string }` |
| `features/display` | `DisplayPage` | `{ clientId: string; day: number \| null; programId: string \| null }` |
| `features/display` | `TvPage` | `{ screen: number; legacySlots: TvSlot[] \| null }` |
| `features/display` | `RoutineDisplay` | `{ routine: DisplayRoutine; dayNumber: number; layout?: 'column'\|'full'\|'preview'; fontScale?: number; flashBlockIds?: ReadonlySet<string> }` (pure; only `full` may split) |
| `features/display` | `RoutinePreview` | `{ programId: string; dayId: string | null; className?: string }` (editor embeds it; owns its 640×1080 frame; reads store, sanitises with `toPublicClient` / `toPublicProgram`) |

Opening TV windows (Pantallas menu, Ajustes, picker 'Abrir'): `useDisplayWindow()` → `openTv(screen)`. The coach UI no
longer opens one person in a window of its own: a person goes to a TV section ('Pantalla'). `#/pantalla/:clientId`
stays for old links and the phone TV list. Call directly in the click handler; a blocked popup
shows a toast with an "Abrir pantalla" retry. On a phone (`isPhoneScreen`) there are no popups: once `flushDashboardSaves` succeeds, the same tab goes to the route. Display windows read ONLY `useDisplayData()` →
`{ data: DisplayData | null, version }` and format with `buildDisplayRoutine(data, clientId, {programId?})`,
`getDisplayableClients(data)`, `clampDayNumber(routine, day)` from `lib/display`. They must apply branding with
`useBrandingStyles(data.branding)` when data exists. TV section changes go through `useScreenActions()` (Screens below), never the URL.

TVs on their own screen (Window Management API, Chrome/Edge): `lib/screenDetails.ts` `createScreenDetector(env)` (browser passed in, tested with `screenDetails.fakes.ts`) follows `window.screen.isExtended` and its `change`, the `window-management` permission (`WINDOW_MANAGEMENT_PERMISSIONS`, also the old name) and `getScreenDetails()` + `screenschange`. States: `unsupported` (Firefox/Safari/phones: today's flow, open + drag + F11, with the guide), `needs-permission` (never asks by itself: "Buscar teles" must be clicked), `denied` (how to unblock it), `single` ("No hay ninguna tele conectada: pulsa Win+K y elige Extender"), `ok`. One detector per window: `useScreenDetails()`. Naming and keys of the screens: `lib/detectedDisplays.ts` (pure). `lib/tvDisplays.ts`: every screen but the main one is a TV, given to Pantalla 1, 2… left to right unless chosen on this computer (`STORAGE_KEYS.tvDisplays`, `lib/tvDisplayStore.ts`). What an automatic Pantalla got is kept while the window runs (`rememberTvDisplays`, in memory): when a TV goes away its Pantalla is left without one and nobody else takes it, nor does it take another's; a TV nobody had is free for anyone. A Pantalla whose TV (chosen or remembered) is missing gets none ("desconectada"). Only the gym's screens get a TV: `screensConnection` writes the screen ids it read into `saveKnownScreens` (`lib/tvDisplayStore.ts`, per window, null until read) and `resolveTvDisplays(…, existing)` skips choices and memories of removed screens and gives free TVs to existing screens in number order. `useTvDisplays()` → `{detection, tvCount, displayFor(screen), choices, choose}`. A `DetectedDisplay` has `area` (without the taskbar: tiling) and `bounds` (the whole screen). `useDisplayWindow().openTv` passes `displayFor(screen).bounds` to `openTvWindow(screen, target)`: the popup covers that whole TV even before fullscreen (`popupFeatures`), an open one is moved there, and it always broadcasts `place` (below), so a window this page lost track of (reload) goes back too. The TV window goes fullscreen on its TV with `requestFullscreen({ screen })` (`useFullscreen(target)`: `enterFullscreen`/`exitFullscreen`), only when this screen has a TV (`displayFor(screen)`, `canPlace`); the wiring is `useTvPlacement`. Automatic fullscreen: `lib/autoFullscreen.ts` asks `permissions.query({name: 'fullscreen', allowWithoutGesture: true})` (a TypeError = `unsupported`), `useAutoFullscreenPermission()` follows it (null until it answers). It is `granted` only with the Chrome machine policy `AutomaticFullscreenAllowedForUrls` (`public/teles/*.reg`: value "1" = the production origin only, `quitar` deletes only that value; CRLF kept by `.gitattributes`. Served publicly by Vercel and harmless; the links are only shown to admins in Ajustes. A dev copy for `http://localhost:5173`, value "2", lives in `tools/teles/`, never in `public/`). Then `useTvAutoFullscreen` enters fullscreen with no gesture on load and when it was lost without anybody asking (target TV found again, `online`, `focus`, visible again, `screen` `change`); leaving it inside the focused window (Esc, the button) holds it until the window is placed again or goes fullscreen again; an exit counts as by hand only if, `TV_MANUAL_EXIT_CHECK_MS` later, this screen still has its TV and the window is still on it (`isOnTv`, `utils/windowFrame.ts`), so a TV that drops (Win+K, switched off) is never held and comes back by itself. Otherwise, or when the request fails, the "Pantalla completa" bar at the foot (`TvFullscreenPrompt`, `useFullscreenPrompt`: gone after `FULLSCREEN_PROMPT_MS`, on blur or when dismissed, once per window in sessionStorage, `reopen` after a `place`); with no TV for the screen (no permission yet, one screen, Firefox) the drag hint. TV window lifecycle over BroadcastChannel `p33-tv-control` (`SYNC_CHANNELS.tvControl`; protocol and tiling pure in `lib/tvControl.ts`: `parseTvControlMessage`, `tileGrid`, `tileArea`; transport `broadcastTvControl`/`listenTvControl` in `persistence/channels`; every TV window listens with `useTvWindowControl`): `close-all` → `window.close()`, and a window still there after `TV_CLOSE_CHECK_MS` (not script-opened) leaves fullscreen and shows `TvCloseBlocked` ("Cierra esta ventana con la X"; "Seguir mostrándola" puts it back like a `place`); `bring-all {screens}` → holds auto fullscreen, leaves it, waits `TV_MOVE_AFTER_EXIT_MS` and `moveTo`/`resizeTo` its cell of a grid on the laptop's main screen (`tileArea`, by screen number, `TV_TILE_GAP_PX`; without detection, a `TV_WINDOW_SIZE` area at 0,0, never more than the current screen); `place {screen}` → that window moves to its TV `bounds` and goes fullscreen (auto) or reopens the bar. Dashboards: `useTvWindowsControl()` + `TvWindowsActions` ("Traer al portátil" / "Cerrar todas", only while `useBrowserScreenPresence` sees a TV window of this browser; toasts "Pantallas en el portátil · Devolver a sus teles" and "Pantallas cerradas · Abrir otra vez", which with several windows opens one per click ("Abrir Pantalla N", then the next: a click allows one popup); `closeTvWindows()` also closes the references this tab kept). Copy in `features/screens/config/tvWindows.ts`. Copy in `config/screenDetection.ts`; the menu rows say "En «tele»" or "Pantalla 2 desconectada" (`lib/tvPlacement.ts`). `vercel.json` sends no Permissions-Policy and its CSP does not cover window placement or fullscreen. **Any Permissions-Policy added later must keep `window-management=(self)` and `fullscreen=(self)`**, or TV placement breaks in production only.

Named screens: Pantalla 1, 2… (up to `TV_MAX_SCREENS`), one window per TV, each with its own window name (`tvWindowName`), URL and A-/A+ (Pantalla 1 keeps the older key). Rules in `utils/tvScreens.ts`, what the device keeps per window in `utils/tvScreenStore.ts`. The 'Pantallas' sidebar menu (`TvScreensMenu`, `useTvLauncher`) lists the gym's screens (`useScreensPanel`, the same list as Ajustes): opens each one or puts an open one back on its TV ("Colocar Pantalla N en su tele"), removes one (not the last) and has "Traer al portátil" / "Cerrar todas". One screen per TV of the TV laptop: when the TVs are seen (`followsDetectedTvs`: detection `ok`) and a TV window is open in this browser (`createsScreensHere`, `useBrowserScreenPresence`: a coach's computer with an extra monitor never creates screens for the gym), `useAutoTvScreens` (mounted by `shell/ScreensStatusMenu`) creates, once the screens are `ready`, one screen per TV no existing screen got (`unplacedTvCount`, `planMissingScreens` in `utils/autoScreens.ts`: first numbers chosen by hand for a TV here, then the lowest free; same inputs, same plan) through `screensActions.ensureScreens` (`saveScreens(configs, onlyNew)`, then a reload: two tabs at once are fine, an existing screen is never touched); nothing is removed when a TV goes away ("desconectada"). Then "Añadir pantalla" leaves the menu (Ajustes keeps it at the foot as "Añadir otra pantalla"), and a screen can be removed only while it has no TV now (`canRemoveWithTvs`, per screen: `canRemove(id)`, `removeBlockedLabel(id)`); without detection the menu offers "Añadir pantalla" as before. Over BroadcastChannel `p33-tv-screens` a window closes itself when removed in this browser (`useTvScreenPresence`); elsewhere it shows "Esta pantalla ya no existe". The title (the screen's saved name) shows in the toolbar and in the tab. Columns that older versions kept on the device (`tvSlotsKey`) fill their screen once, like an old link, and are forgotten.

Screens (`features/screens`, import from `'@/features/screens'`): what each TV shows lives in two tables, `screens` (id '1'..'8', `data {name, sections 1-6}`) and `screen_sections` (id 'N:M', `screen_id` with cascade, `data {clientId|null, day, assignedAt}`), one row per section so two coaches sending at once to different sections never collide. Nothing private, not in `DOMAIN_TABLES` (no undo, no backups). `screensService` (`services/instance.ts`): `cloudScreens` (table helpers of `persistence/supabaseGateway`, Presence on the shared **private** topic `p33-screens-presence` (policies on `realtime.messages` in schema.sql: active staff, presence only), a copy in `p33:screens:cache:v1` for a TV opened offline) or `localScreens` (`p33:screens:v1`, other windows reload on the storage event; presence over `p33-tv-screens`). Own zustand store (`store/screensStore.ts`, outside zundo), loaded and followed while any hook is mounted (`retainScreens`: reload on (re)connect, focus, `online`, visible tab, every `CLOUD_REFETCH_INTERVAL_MS`). An empty gym gets Pantalla 1 and 2 with `TV_DEFAULT_SECTIONS` = 3 (insert that never overwrites, so two windows at once are fine). Besides one screen per TV of the TV laptop (`useAutoTvScreens`, same insert-only write), nothing else creates a screen implicitly: a write to a screen the gym does not have, or past its sections, is dropped (`utils/sectionLimits.ts`, `writableWrites`), so a removed screen stays removed. A new number of sections empties, in the same change, the sections it leaves out or brings back (`trim_screen_sections` trigger; local mode `sectionsAfterResize`). Writes show at once, run one after another and a failure reloads; until the server sends back a row this window wrote (`SCREENS_ECHO_WINDOW_MS`), older copies of it are ignored (`utils/pendingWrites.ts`; a failure forgets only its own value). A first read that fails with nothing cached retries with `SAVE_RETRY_DELAYS_MS` and the TV says "Sin conexión, reintentando…" (`loadFailed`). Leaving the session (signed-out, no-access) empties the store and the cache (`resetScreensState`, subscribed to `useSessionStore`). The SQL checks live outside `create table` (drop, add `not valid`, validate), so a re-run updates them; their limits match `config/app.ts` (schema.test.ts), `clientId` must look like an app id and `assignedAt` like `toISOString()` or ''.
Hooks: `useScreens() → {status, screens: ScreenView[]}` (each with `contents` per section and `online`), `useScreenSections(n) → {status, loadFailed, exists, config, contents}`, `useScreenPresence() → ReadonlySet<number>`, `useBrowserScreenPresence()` (windows of this browser), `useTrackScreenPresence(n)` (TV windows), `useScreensPanel()`, `useScreenActions()` → `assign(ref, {clientId, day})`, `send(ref, target)` (also takes the client out of any other section), `clear(ref)`, `swap(a, b)`, `reorder(screen, from, to)`, `undo(change) → {skipped, saved}`, `restore(previous)` (exact write-back, for the sections-count undo), `fillScreen(screen, targets)`, `saveScreen(config)` (creates or updates; fewer sections empties the rest), `ensureScreens(configs)` (creates only the missing ones), `removeScreen(id)`. Section writes return `{written, previous, saved: Promise<boolean>}`. `status`: `idle` (nothing yet), `cached` (last copy), `ready` (read from the server). Pure rules in `utils/sections.ts` (`sectionId`, `parseSectionId`, `gridFor`: 1-4 side by side (`TV_TWO_ROWS_FROM` = 5; a routine is a tall list, 2 × 2 halved it), 5-6 in 3 × 2, `firstFreeSection`, `findClientSections`, `plan*`).

Phones (`usePhoneScreen`: `PHONE_SCREEN_QUERY` and not a popup, recognised by its `window.name`, because a Pantalla popup is also narrow): `DisplayPage` renders `MobileDisplayPage` (normal scroll, sticky equal numbered day buttons with the name below, nothing hidden, no auto-fit, 'Volver' returns to the page it came from through `goBackInApp`; the dashboard reloads on return, so its undo does not survive and `useDisplayWindow` says so when there was something to undo) and `TvPage` renders `MobileTvPage` (list of people plus a note). Same `useScreenData`, so the same sanitised data.

Modo TV (`features/display`): `useTvSlots(screen, legacySlots, candidateClientIds)` reads the screen's sections
(`useScreenSections`) and writes every change through `useScreenActions` (picking a client in a section uses `send`, like the button: one screen at a time; an archived client shows as nobody, `shownClientId`; before the first read or for a removed screen the window shows `TvWindowStatus` and no section controls, `tvWindowState`) (pure helpers in
`utils/tvSlots.ts`: `assignSlotClient` keeps the day when the same client is picked, `addSlot`/`removeLastSlot`/`moveSlot`;
'+ sección'/'− sección' change the screen's number of sections, 1 to `TV_MAX_SECTIONS` = 6)
and gives each column a stable `slotIds[i]` (React key + dnd-kit sortable id; never the index, client ids can repeat).
`useTvScreenSetup` fills the screen from an old link (once per link and device) and never creates it. `useTvScreen` also tracks presence and holds a Screen Wake Lock (`useWakeLock`).
Sections are laid out by `gridFor` with a `TV_SECTION_GAP` gutter and reordered by their grip (`TvColumns` + `useTvColumnSort`, pointer after `TV_DRAG_ACTIVATION_DISTANCE` px or
keyboard). The client picker is a searchable combobox (`useComboboxSearch`, pure logic in `utils/combobox.ts`) showing
full names, searchable by first name and surname (`label` from `utils/clientOptions.ts`); an open
list keeps its column's controls visible. A single column renders `RoutineDisplay layout="full"`, like the Pantalla window. TV copy lives in
`features/display/config/tv.ts`.

Block order: in a portrait slot (2-4 TV sections side by side; a 4-column section is about 470 × 1080 and never splits) a client is always one column, top to bottom. In a landscape slot (one client on the screen, or a section of a 2-row grid; `canSplit` is anything but the editor preview), `getFitStages` tries one comfortable column, then one compact column (limited to `max-w-[62em]` so the prescription stays near its name), and only if neither holds the whole day at the target size, two parts: blocks flow down the left then down the right (CSS columns, `break-inside-avoid`), with a `column-rule` divider (the block letters already give the order).

Text size across columns: `useSharedTextSize` (`TvWindow`) collects what each column could show by itself and passes the smallest back as `unitCap`; the fit keeps finding and reporting its own unit, so a day getting shorter lifts the others again. When A+ cannot grow the text the toolbar says so (`sizeAtLimit`).

The stage walk needs a commit per density. `awaitingDensity` says one is pending: `continueFit` does not measure meanwhile, and a layout effect with no dependencies carries on after every commit. It must not depend on the density: two requests in one batch (a resize observer firing while the walk runs) can leave it where it was, and the screen would stay on the last size measured. No name, cue or day title is clamped on the TV: the fit measures their real lines.

Sizes are read against the TV, not the section: TV sections pass `referenceHeight` (`useWindowHeight`), so the max, target and readable floor of a section of a 2-row grid are those of a full-height column; only the last resort follows the section. A landscape section (2-row grids) may split in two parts like a single full screen. With a shared size below its own, a section plans again at that size (`maxUnit`), so detail hiding, `tooSmall` and `detailHidden` describe what is shown. A day that does not fit even at the last resort gets `DisplayOverflowBand` ("+N ejercicios más abajo, no caben", at least 20 px; `countHiddenRows` over `[data-fit-row]`).

Routine density: `useAutoFit({ canSplit, fontScale, fitKey, unitCap, referenceHeight })` picks `compact` (width < `AUTO_FIT.compactMaxAspect` × height: 2–4 TV
columns, editor preview) or `comfortable` (full screen) from the slot's shape. `planFit` keeps the target size (`AUTO_FIT.target*`, names 28 px on 1080p in both densities) by hiding secondary content in the order of `DETAIL_LEVELS`: cues (`--display-cue`), then small icons and the week pill (`--display-extra`), then tempo/rest lines (`--display-detail`), then block notes. Only with all of that
hidden does the text go below the target, down to `lastResortUnitPerHeight`; below `readableUnitPerHeight` it reports `tooSmall`. The block's rest stays
in its header. The level is applied with CSS variables (`fitVars`), so measuring needs no re-render. `FitStatus.detailHidden` tells the editor preview to say so.
Growing: each detail level is tried from everything shown, so spare room first brings back what was hidden, then the binary search takes the largest size that still holds the day, up to `maxUnitPerHeight` (names 56 px on 1080p, twice the target, so one short day on a whole TV does not turn into a poster) and `maxUnitPerWidth` (an outer bound for narrow columns). Above the target a size also has to pass `wrapsTooMuch` (`useAutoFit`, read right after measuring): nothing sticks out sideways and no name or prescription (`[data-fit-main]`) takes more than `AUTO_FIT.maxMainLines` = 2 lines. Below the target it is never asked, so it can only hold growth back, never hide or shrink anything. In a 4-column section this, not the height, is what stops a very short day: a name like "Movilidad de tobillo en pared" next to "2 × 10 c/lado" takes a third line past about 30 px.
Blocks (`DisplayBlockCard`): a card with a full-width band (`DisplayBlockHeader`): a tile (`DisplayBlockTile`) with the block letter A/B/C (`getBlockLetter` in `lib/format/labels.ts`, also used by A1/A2; `DisplayBlock.letter`) or the icon of a warm-up/mobility block on a soft band, the headline, and pills for type, rep scheme and rest that drop below when they do not fit. Theme: light by default (off-white canvas, white cards, black bands; `tv-*` tokens in `index.css`, `tv-accent` = brand accent darkened to 7:1 on white, `config/contrast.ts`), dark stays selectable in Ajustes. `displayThemeVersion` moves branding saved before the light default to light once (`persistence/migrate.ts`); a later choice of dark is kept. Classes per theme in `utils/theme.ts` (`sectionGutter` colours the gap between TV sections).
Per-density classes live in `components/routine/densityStyles.ts`. Name and prescription share one size, the prescription right-aligned; the current week's
progression value is shown without any week mark (the header already says 'Semana 2 de 4').

### Capacity

Limits in `config/capacity.ts`, rules in `lib/capacity.ts` (`getDayChangeRefusal` is the only rule for what a day holds: a number over its limit may stay or shrink, never grow; `getAddDayRefusal` is the same for `MAX_DAYS_PER_PROGRAM` = 6 days per routine).
Store actions apply it and return unchanged (`''` or nothing) on every path: add, duplicate, copy, move; `copyBlockToAllDays` skips the days that are full and
returns how many it did copy. `updateExercise`/`addExercise` cut name and cue to their maximum (`clampExerciseTexts`). Over-limit data (imports) still renders,
with a warning in `DayCapacityIndicator`. Editor: `getDayCapacity`, `AddExerciseButton`, `AddBlockButton`, `useCapacityToast`.

Measured at 1920 × 1080 in the real TV window (`#/tv?pantalla=N`, local mode, same day in every section), exercise name in px, "used" = bottom of the day / section height. Nothing cut off, no sideways overflow, no "no caben" band and no name over 2 lines in any row unless said. All the sections of a screen show the same size. "Before" = 4 sections in 2 × 2 (954 × 534) and the old caps (names 42 px compact / 53 px comfortable, 0,04 × width).

| Day | 1 section (1920 × 1080) | 2 (954 × 1080) | 3 (632 × 1080) | 4 (now 471 × 1080; before 2 × 2) | 5-6 (3 × 2, 632 × 534) |
|---|---|---|---|---|---|
| Densest demo day (Laura, Día 1: 5 blocks, 15 exercises) | 32,1, two parts, everything visible (before 32,2) | 30,2, cues hidden (same) | 29,0, cues hidden (same) | 26,0, one column, only notes kept, 100 % used (before 18,3, two parts, all hidden) | 16,3, two parts, all hidden (same) |
| Short demo day (Carlos, Día 1: 4 blocks, 8 exercises) | 32,5, everything, 99 % (same) | 43,1, 98 % (before 42,1, 96 %) | 35,4, 100 % (same) | 29,8, everything, 91 % (before 24,9, two parts, all hidden) | 20,0, two parts, all hidden, 3-line names (same) |
| Very short (Laura's previous routine, Día 1: text warm-up + 3 blocks) | 30,7, 100 % (same) | 42,1, 100 % (same) | 37,7, 98 % (same) | 32,2, everything, 90 % (before 24,6, two parts, all hidden) | 20,0 (same) |
| Tiny (Carlos Día 1 cut to 2 blocks, 4 exercises) | 51,7, 99 % (before 51,8) | 56,7 (the cap), 91 % (before 42,1, 59 %) | 40,1, 69 % (before 37,9, 61 %): two-line limit | 29,8, 52 % (before 35,0 in 2 × 2): two-line limit | 32,5, one column, everything, 100 % (same) |
| 4 different people (Laura, Andrés, Carlos, Marta), 4 sections | | | | 25,6 in all; Andrés and Carlos keep everything at that size (70-81 % used) | 5 people (+ Javier): 16,1 (same as before) |

Live check: in a 4-section TV, emptying the two densest sections lifted the other two from 17,1 to 19,9 px units at once, the same as a fresh load; the sizes then stay put (no style change in 3 s of watching).
A two-line name costs a full row: only about 20 lines fit at 28 px, which is why long names lower the size. Change a limit or a size only after measuring again.

## 6. Shared primitives (`components/ui`)

`Button {variant: primary|secondary|ghost|danger|dark, size: sm|md|lg, leftIcon?, rightIcon?, fullWidth?}` ·
`IconButton {icon, label (required), variant?, size: sm|md}` · `Input {label?, hint?, error?, leftIcon?, suffix?, nativeUndo?}` ·
`DateField {value (ISO or ''), onChange, min?, max?, label?, hint?, error?}` (always dd/mm/aaaa: text with a mask + `CalendarDialog`, Monday first; `onChange('')` while the text is not a valid date) ·
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
  isValidISODate, parseISODate, toISODate, formatDate ('31/10/2026', the only format for a date on screen), formatDateWithWeekday, formatMonthYear,
  formatDateRange, formatDateTime ('hoy, 10:42')`. Typed dates (`lib/dateText`): `maskDateText, parseDateText, readDateText, isDateWithinLimits`. Never `type="date"` (it follows the browser's language) nor `toLocale*`.
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
- Exercises: lib `normalizeExerciseLink` (http/https or null), `exerciseLinkUrl(name, link)`; config `MEASURE_META/ORDER`, `LOAD_UNIT_META/ORDER` (with Spanish help), `PROGRESSION_TARGET_META`, `TEMPO_HELP`,
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

`Repository`: `load`, `save(getData, {source, revision})`, `seedLibrary(seed)`, `saveDisplay`, `clear` (this device only), `release`, `subscribe`,
`loadDisplaySync`, `subscribeDisplay`, `sharesDataAcrossTabs`.

- `normalize*` in `migrate.ts` must be idempotent against what the store writes (`dbRows.test`): a cleared param stays cleared, and day names are not renumbered on read (`settleDayNames` does it when the field is left).
- `SupabaseRepository` (over a `RowGateway`, faked in its tests): one row per client, program, note, library exercise,
  plus the `settings` row (`lib/dataRows`, translation in `dbRows`). `base` = last version known on the server; `save` upserts or
  deletes ONLY `diff(base, latest)` (at most `CLOUD_WRITE_BATCH_SIZE` rows per request), one save at a time. Same row: last write wins. Network errors reject (`dashboardSync` retries
  with backoff and shows 'Sin conexión, reintentando…'; `beforeunload` warns); refusals (`PermanentWriteError`) put that row back to
  the server version and show a toast. A `save` queued before `release()` never runs, not even once the next session has loaded. It reads nothing from or to
  localStorage but the display copy, whose write never throws (full device: `toCompactDisplayData`, only current routines of active clients).
- Live channels get a new name per subscription (`uniqueChannelTopic`): the client hands a channel still being removed to anyone asking for the same name, and it never delivers. Phones swap subscribers at every change between dashboard and screen pages.
- Live: realtime row events → `base` and store updated together (batched `REMOTE_BATCH_MS`), own echoes dropped by `client_origin`
  (deletes by `deleteEchoes`, registered before asking). Catch-up by `refetch()`: on reconnect, on tab focus, on `online`, and every `CLOUD_REFETCH_INTERVAL_MS`.
  A reload overlapped by a save or a live event is dropped and retried after `CLOUD_REFETCH_RETRY_MS`.
- Leaving the page: `visibilitychange` (phones) and `pagehide` flush the debounce; small writes use `keepalive` (`lib/keepalive`). Offline edits live only in memory.
- `applyRemoteRows(changes)` (`store/history`): replaces the rows in the store, without undo, keeping rows with unsaved local edits,
  and `rebaseSnapshots` puts the same rows in every past/future undo snapshot and drops steps left empty. Undo never overwrites another coach.
- `LocalStorageRepository` (local test mode, key `p33:data:v2`): whole dataset, shared across tabs by BroadcastChannel `p33-data` + storage
  event; `dashboardSync` turns those snapshots into row changes with `diffData`, so both modes apply remote changes the same way.
- Exercise tags (no SQL change: they live in the `data` jsonb of `library_exercises`): `muscle` (one main), `secondaryMuscles?`, `type`, plus `equipment`; lists and search words in `config/exerciseTags.ts`. Rows saved with the old `category` are translated on every read by `resolveExerciseTags` (`persistence/libraryTags`): valid tags are kept, an initial exercise takes its tags by id, any other maps its category; the next edit saves the new shape. `SCHEMA_VERSION` 2: saved data and backups from version 1 also get `EXERCISES_ADDED_IN_V2` once. A cloud library that was already seeded does not (the seed never runs twice). Search: `searchExercises` also matches muscle and type words ('pecho', 'cardio', 'piernas'), main muscle above names that only mention it; `findSimilarExercises` looks at names only. Filter: a muscle finds main and secondary, main ones first.
- Library: `AppData.library` holds every exercise, one normal row each in `library_exercises`. `dashboardSync` calls `seedLibrary(EXERCISE_LIBRARY)` for an admin: while `settings.library_seeded_at` is empty (`library_seed_pending`) it sends all the rows to the `seed_library` RPC, one transaction under a lock that inserts without overwriting and sets the flag: whole or nothing, so a retry or a second admin cannot bring back something deleted. A failure shows a toast and the next admin session tries again. It never runs again, even if the library is emptied. Local mode has the library in its first-run seed. Data without a `library` key (older browsers and backups) gets the initial library plus its `customExercises`.
- TV windows: `useDisplayData()` = sanitised cache at start + `subscribeDisplay`: BroadcastChannel `p33-display` and the storage event in both modes (instant edits from a dashboard of the same browser) and, in the cloud, `startCloudDisplayFeed`: the window itself reads and follows `settings`, `clients` and `programs` (never `notes` or `library_exercises`), runs each row through `toPublicClient`/`toPublicProgram` as it arrives and keeps only that in memory, with the same catch-up as dashboards (reconnect, focus, `online`, interval). It writes the sanitised cache, so a reopened window has something to show without connection. Nothing is published before the first good read (live events alone would look like a gym with one person). Duplicates of one change are dropped by `deepEqual`, and for `DISPLAY_LOCAL_PRIORITY_MS` after a message from a dashboard of this browser the feed is ignored: the echo of an earlier save would flip the TV back to older text. So a TV stays live with no dashboard open, and an edit from a phone appears on it. The rows come over the network with their private fields, as for any coach of that session; they are never kept or persisted.

Session (`auth/session`, same flow in dashboards and TV windows, results in `useSessionStore`): `loading → signed-out | no-access |
must-change-password | offline | ready`. `getUser` rejects when it could not check (expired token, no connection), which never counts as a sign-out: `ready` stays, a cold start
goes to `offline`. `teamService.getOwnProfile` (`my_profile`) decides access (re-checked on focus). Leaving removes the display cache; `dashboardSync`
watches the status and, in this order, stops listening, `repository.release()`s and empties the store (so emptying can never be saved as a
mass delete). API: `startSession`, `signOut`, `retrySession`, `finishPasswordChange`, `refreshTeam`, `watchTeam`, `auth`, `teamService` from `@/auth`;
`flushDashboardSaves()` from `@/persistence`; `refreshTeamQuietly` after a change that already worked. Login uses PKCE (tokens never in the hash the routes use), and Google always asks which account.

### Accounts

No sign-up (`enable_signup = false`): an admin creates every account. `profiles` has `user_id` (set at creation), `username`, `email` (null = none: the login uses a random `<hex>@accounts.invalid`, only in `auth.users`, so nobody can guess it and try passwords at the auth server), `role` (text + check + `PROFILE_ROLES`/`ROLE_LABELS`; a new role gets no staff access until `is_active_staff` lists it), `active`, `must_change_password`, `temp_password_expires_at` (72 h, set by the same trigger as the hash). `name`: at most 30 characters, none invisible (Cyrillic look-alikes are not caught). `TeamMember` = what everyone can read (column grants: id, name, color, role, active); `Profile` = the full account, only through `my_profile` and `team_accounts` (admin).

- `TeamService` (cloud: `supabaseTeam`, local: `localTeam`, same interface): `getOwnProfile`, `list`, `updateOwnProfile`, `finishPasswordChange`, `subscribe`; admin: `listAccounts`, `createAccount → temporary password`, `resetPassword → temporary password`, `setRole`, `setActive`, `deleteAccount`. `AuthService`: `signIn(identifier, password)` ('@' = email directly, else the `login-username` function then `setSession`), `signInWithGoogle`, `changePassword`, `verifyPassword` (a throwaway client, so the session in use is untouched; Mi perfil asks for the current password with it, `secure_password_change` stays off because reauthenticating needs a mail), `getSignInMethods(hasOwnPassword)`, `connectGoogle`, `disconnectGoogle`.
- `admin-users` (POST `{action: create|reset-password|set-role|set-active|delete, ...}`): checks the token with `auth.getUser` and the caller with `current_profile_id` under their own JWT, then re-checks the rules in `accessChangeRefusal`. Errors are codes only (`AccountErrorCode`), worded by `lib/accountMessages`. `set-active` also bans or unbans, and revokes sessions; `reset-password` first removes Google identities that are not the profile's email (`remove_other_google_identities`), then writes the password, THEN the flag, then revokes and unlocks; `set-active true` also unlocks.
- `login-username` (anon): returns `{session: {access_token, refresh_token}}` only. Unknown user, wrong password and banned account give the same `invalid_credentials`, in at least `MIN_RESPONSE_MS`. Each attempt is reserved atomically BEFORE the password is tried (`login_reserve_attempt`), so parallel requests cannot slip through: in 15 minutes, 5 per username and connection (salted hash of the address), 20 per username, 50 per connection, counting unknown names too. A server failure gives the attempt back. So a stranger only spends their own allowance; shutting a coach out takes more than 4 connections. Email logins go straight to the auth server, limited by `sign_in_sign_ups` per IP only. Service role only.
- Both: `ALLOWED_ORIGINS` (comma list, default localhost), `verify_jwt = false` in `config.toml` (they check by themselves).
- First login: while `must_change_password`, `current_profile_id`/`is_active_staff`/`is_admin` are false, so nothing is readable; the session stops at `must-change-password` (`CreatePasswordPage`). `finish_password_change` only clears it if `auth.users.encrypted_password` differs from `temp_password_hash`, which a trigger copies whenever the flag is written: calling the RPC cannot skip the step, and it refuses after `temp_password_expires_at` (`temporaryPasswordExpired`: `CreatePasswordPage` says to ask for another). A Google session is not asked only if the `amr` claim says oauth AND `auth.identities` has a google row with the profile's email (`signed_in_with_google`): the admin wrote that email, while anyone at a session could link their own Google by hand. `hasOwnPassword` (the raw flag) decides whether Mi perfil asks for the current password and whether Google can be disconnected; setting a password there also ends the flag.
- Equipo shows `googleConnected`; creating an account with an email asks to confirm it, because `email_confirm: true` makes it count as verified for auto-link.
- Google: an account with that verified email auto-links; anyone else is refused by the server (`signup_disabled`), which `readRedirectError` words as 'Tu cuenta no tiene acceso'; a session without a profile gets `NoAccessPage`.
- Local mode: `localTeam` + `localAccounts` (plain test passwords, key `p33:local:accounts`), same rules through `lib/accountRules`.

Permissions: `supabase/schema.sql` and the functions enforce them (RLS, column grants, triggers; tested in `schema.test.ts` and `functions/_shared/*.test.ts`); `lib/ownership` (`canEditNote`, `accessChangeError`,
`isActiveAdmin`, `canDeleteClient`) mirrors them for the UI and for local mode. To change a rule, change both and their tests. Only admins delete clients (the cascade
takes every coach's notes); monitors can still delete routines, since their undo works for them and they could overwrite those rows anyway. `row_history` (trigger on clients, programs and library, no client access, 30 days) keeps what each update or delete replaced, so damage can be undone from the SQL Editor; notes stay out on purpose. Rows must keep their key field (`data ? 'firstName'` and so on). `schema.sql` refuses to run over the previous version (`staff` table).

Local mode: `cloud` wins; a production build without env vars is `invalid` unless `VITE_ALLOW_LOCAL_DEMO=true`, because it means an admin account with its password on the login page. `vercel.json` sets the CSP and other headers.

Local mode seeds demo data on first run. An empty cloud does not: an admin gets 'Cargar datos de demostración' on the clients page (`loadDemoData`: adds clients, routines and notes, keeps branding and library).
Demo data is relative to today (Carla & Dani, `SEED_TEAM`; Laura week 2/4 with a shoulder important notification and a previous
block; Javier ends in 3 days; Marta elite 4 days with every block type; Carlos finished; Lucía no routine;
Andrés 1 day; Sergio archived). Every routine day has 4–5 realistic blocks (Laura's 'Pierna' day is the 5-block,
15-line stress case; her programs never contain overhead work, see `seed.test.ts`). Saved data has no seed version:
an existing browser keeps its old demo until "Restablecer datos de demostración" (admins only, typing `BORRAR`: `requireText` in `useConfirm`).

Not checkable without a real project, so check it there: both functions running under Deno (they have never been deployed; `_shared` is tested, `index.ts` and `_runtime` are not), Google OAuth and its account chooser, auto-link and `signup_disabled` with sign-ups off and the exact error in the redirect, `linkIdentity`/`unlinkIdentity`, the `amr` claim of a Google session and after a token refresh, `.invalid` addresses accepted by `auth.admin.createUser`, `ban_duration` and whether a banned login gets `user_banned`, `revoke_user_sessions` and `encrypted_password` reads as table owner on the `auth` schema, realtime payloads and reconnect (also with column grants on `profiles`), Presence on the private topic `p33-screens-presence` with its `realtime.messages` policies (an active coach joins, nobody without a session does, a TV window open for days survives token refresh) and the realtime events of `screen_sections` rows removed by the cascade, a TV window surviving token refresh for days, `schema.sql` under Supabase's own roles and default grants
(`information_schema.role_table_grants`), reading and deleting `auth.identities` as table owner (`signed_in_with_google`, `remove_other_google_identities`), `cf-connecting-ip` or the last `x-forwarded-for` being the caller's real address (`clientKey`), `password_requirements` and `.invalid` under the admin API, `enable_confirmations` not disturbing admin-created accounts or Google, the `seed_library` request size for 322 rows, the last-admin lock under concurrency, and whether a stranger's realtime subscription sees the table and id of deleted rows (documented behaviour for DELETE events).

## 9. Design tokens & UI conventions

Tailwind tokens (`src/index.css`): `brand` #f79cce (ONLY on black: sidebar, TV), `brand-strong` #d6449a (text/buttons on white),
`brand-soft`, `brand-line`, `ink` #0b0b0c (sidebar/TV bg), `ink-soft`, `ink-line`, `ink-muted`, `canvas` (app bg), `surface`,
`line`, `line-strong`, `fg`, `fg-muted`, `fg-subtle`, `private` / `private-bg` / `private-line` / `private-icon` (amber),
spacing `header` / `bottom-nav` (chrome sizes for sticky offsets), shadows `shadow-card`, `shadow-pop`, animations `animate-fade-in|slide-up|pop-in|flash`, utilities `tabular`, `scrollbar-none`.
Font Jost (400–800). Brand colours follow Ajustes at runtime via CSS variables.

- Light, calm dashboard (Linear/Notion-like): canvas background, white cards, hairline borders, rounded-2xl cards,
  rounded-xl controls, generous spacing; black sidebar with `branding.logoUrl` and pink active item.
- Touch targets ≥ 44 px (`Button`/`IconButton` md). No hover-only controls: secondary actions go in `DropdownMenu` ('⋯').
- Words: gym clients are "usuarios" on screen (code, routes and tables keep `Client`/`clientes`), coaches are "monitores", accounts live in "Equipo". The login name is always "nombre de usuario", never "usuario" alone.
- PRIVATE = amber + lock + "Solo monitores" (`PrivateSurface`, `PrivacyLabel kind="private"`, `Badge tone="private"`).
  CLIENT-VISIBLE text fields (block note, cue) = `PrivacyLabel kind="visible"` ("Lo verá el usuario", eye, pink).
  Private data (notes, internalNote, goal) NEVER reaches display components: only `toDisplayData` output does.
  It carries `lastName` only for the coach-facing TV client picker; routine views show the first name alone.
- Autosave everywhere, no Save buttons. Row/block/day deletes: no confirm, show `toastUndo('Ejercicio eliminado')`.
  Confirm (`useConfirm`, `danger: true`) only for deleting a program/client, importing or resetting data; offer archive for clients.
- Pinned private notes are called "notificaciones importantes" in the UI (`ImportantBadge`, `ImportantNotes`, `CompactImportantNotes`); a routine past its end date is "Finalizada", one about to end "Termina en N días".
- Browsing exercises: `useExerciseBrowser` (filters + `usePagination`, pure logic in `lib/pagination`), `PaginatedList`, `ExerciseFilterFields`. `ExerciseLink` (`ExternalLink` icon for the exercise's `link`, else `Search` for a Google search, never a Google logo, always a new tab; `EntryExerciseLink` resolves it for a routine row by `libraryId`) is dashboard only, never on the TV, and hidden on collapsed rows on phones (the row's sheet has it).
- Limited texts: `maxLength` on the field plus `getLengthHint` near the limit; the store clamp is only a safety net. At the limit, phone add buttons stay enabled and explain with a toast (`useDayAddActions`).
- Spanish labels first, acronym as a badge and `HelpTip` for jargon (EMOM, AMRAP, RPE, RIR, tempo).
- Free-text friendly inputs (reps '8-10', 'máx'; load 'KB 16'); `inputMode="numeric"` for pure numbers.
- Mobile: single column, Modal becomes a bottom sheet, bottom nav in the shell. Nothing scrolls sideways: chips wrap, plans become a `Select`, settings tabs and days share the row.
- Sticky day switcher in the editor (`DayTabs`): phones get `DayNumberTabs` (equal numbered buttons, 6 fit at 320 px with 44 px targets, long press and drag; the name and '⋯' go right below in `DayHeader`), wider screens `DayNamedTabs` (tabs share the row and shorten names). '⋯' also moves a day ('Mover antes', 'Mover después').
- The sidebar is an icon rail from 768 px and gets its labels at `lg`, so a portrait tablet keeps its width.
- Form text is 16 px below `md` (`text-base md:text-md`): iOS zooms into a focused field under that.
- Store-bound inputs use store undo (global Ctrl+Z); local-state inputs (search boxes, modal forms) pass `nativeUndo`
  (Modal content already keeps native undo).
