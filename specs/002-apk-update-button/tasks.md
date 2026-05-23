# Tasks: In-App APK Update Button

**Input**: Design documents from `specs/002-apk-update-button/`
**Branch**: `002-apk-update-button`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup

**Purpose**: Install new packages and define shared types before any story work begins.

- [X] T001 [P] Install expo-file-system and expo-intent-launcher via `npx expo install expo-file-system expo-intent-launcher`
- [X] T002 [P] Add `UpdateStatus`, `UpdateCheckResult`, `DownloadProgress`, `GitHubRelease`, `GitHubReleaseAsset` interfaces to `src/types/index.ts`

**Checkpoint**: Packages installed, TypeScript types compile without errors — Phase 2 can begin.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Core service logic that both user stories depend on. Neither US1 nor US2 can be built without this.

**⚠️ CRITICAL**: Must be complete before any user story work begins.

- [X] T003 Implement `src/services/updateService.ts` with `normalizeVersion`, `findApkAsset`, and `checkForUpdate` functions — fetches `https://api.github.com/repos/shawnkyzer/music-festival-scheduler/releases/latest`, strips `v` prefix from tag, locates first `.apk` asset, returns `UpdateCheckResult`

**Checkpoint**: `updateService.ts` exists and TypeScript compiles — user story phases can begin.

---

## Phase 3: User Story 1 — Check for and Install Latest Update (Priority: P1) 🎯 MVP

**Goal**: Full end-to-end update flow — check version, confirm, download APK, trigger OS install prompt.

**Independent Test**: Tap "Check for Updates" on the Settings tab → see version comparison result → confirm → observe download activity indicator → Android OS install dialog appears. Up-to-date path shows "You're up to date" message.

### Implementation for User Story 1

- [X] T004 [US1] Implement `src/hooks/useAppUpdate.ts` — state machine hook with phases `idle | checking | update_available | up_to_date | downloading | installing | error`, `checkForUpdate()` calls `updateService`, `downloadAndInstall()` uses `FileSystem.downloadAsync` + `FileSystem.getContentUriAsync` + `IntentLauncher.startActivityAsync` (Android-only guard via `Platform.OS`), `reset()` clears state
- [X] T005 [US1] Create `app/(tabs)/settings.tsx` — Settings screen with "About" section (app name + version from `Constants.expoConfig?.version`), "Updates" section with "Check for Updates" `Pressable` button; state-driven rendering: spinner while `checking`, version info + "Download & Install" button when `update_available`, success message when `up_to_date`, activity indicator during `downloading`, error text (in `Colors.accent`) when `error`; all colors from `src/constants/theme.ts`
- [X] T006 [US1] Register Settings tab in `app/(tabs)/_layout.tsx` — add `<Tabs.Screen name="settings">` with `title: 'Settings'` and `Ionicons name="settings-outline"` icon

**Checkpoint**: Settings tab appears in the nav bar, full happy-path update flow works end-to-end on Android, up-to-date message works, generic error state visible when network fails.

---

## Phase 4: User Story 2 — Update Progress and Error Feedback (Priority: P2)

**Goal**: Real-time download progress percentage and specific error messages for every failure mode.

**Independent Test**: Trigger a download and confirm the progress bar fills with a percentage. Disable network and confirm the error message says "No internet connection. Please try again." Tap the button twice rapidly and confirm only one request fires.

### Implementation for User Story 2

- [X] T007 [US2] Enhance `src/hooks/useAppUpdate.ts` — wire `FileSystem.downloadAsync` progress callback to update `downloadProgress: DownloadProgress` state (`{ totalBytes, downloadedBytes, fraction }`); add debounce guard (`isInFlight` ref) to prevent duplicate simultaneous requests (FR-010)
- [X] T008 [US2] Enhance `app/(tabs)/settings.tsx` — replace activity indicator during `downloading` with a progress bar component showing `Math.round(fraction * 100)%` text and a filled bar using `Colors.primary`; disable "Check for Updates" button while any async phase is active
- [X] T009 [US2] Enhance `src/services/updateService.ts` — add specific error messages per failure mode: network failure → `"No internet connection. Please try again."`, non-200 response → `"Could not check for updates. Please try again later."`, no APK asset found → `"Update available but APK not found in release assets."`

**Checkpoint**: Progress percentage visible during download, each network failure mode shows its specific message, rapid double-tap produces only one in-flight request.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Test coverage and quickstart scenario validation.

- [X] T010 [P] Write unit tests in `src/services/__tests__/updateService.test.ts` — mock `fetch`, cover: `normalizeVersion` strips `v` prefix; `checkForUpdate` returns `up_to_date` when versions match; `checkForUpdate` returns `update_available` with correct URL; `checkForUpdate` returns `error` on network failure; `checkForUpdate` returns `error` on non-200 response; `findApkAsset` returns first `.apk` asset; `findApkAsset` returns `null` when no APK in assets (7 test cases)
- [ ] T011 Manually walk through all 6 scenarios in `specs/002-apk-update-button/quickstart.md` on an Android device or emulator and confirm each passes

**Checkpoint**: All 7 unit tests pass (`npm test`), all 6 quickstart scenarios verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T001 and T002 are parallel
- **Phase 2 (Foundational)**: Depends on T002 (types must exist for service to compile)
- **Phase 3 (US1)**: Depends on T003 (service must exist for hook); T004 → T005 → T006 (sequential within story)
- **Phase 4 (US2)**: Depends on Phase 3 completion; T007 and T008 are parallel (different files); T009 is parallel with both
- **Phase 5 (Polish)**: T010 depends on T003+T009 (tests the final service); T011 depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Can begin after Phase 2 — no dependency on US2
- **US2 (P2)**: Extends US1 — begins after US1 checkpoint; T007, T008, T009 are all parallel

### Parallel Opportunities Per Story

**Phase 1:**
```
T001 (install packages)      ← parallel
T002 (add types)             ← parallel
```

**Phase 4 (US2):**
```
T007 (hook progress)         ← parallel
T008 (screen progress bar)   ← parallel
T009 (service error msgs)    ← parallel
```

---

## Implementation Strategy

### MVP (Phase 1 + 2 + 3 only — US1)

1. `T001 + T002` — install packages and types (parallel)
2. `T003` — build `updateService.ts`
3. `T004` → `T005` → `T006` — hook, screen, tab registration
4. **STOP & VALIDATE**: Full happy-path update flow works on Android; up-to-date message works; error state renders
5. Ship as MVP — users can check for and install updates

### Incremental Delivery

1. MVP above → ships US1
2. `T007 + T008 + T009` (parallel) → ships US2 on top of MVP
3. `T010 + T011` → ships polish/tests

---

## Notes

- All new files MUST import colors from `src/constants/theme.ts` (Principle IV)
- `downloadAndInstall` MUST be guarded with `Platform.OS === 'android'` — show informational message on other platforms
- Mark completed tasks with `[X]` as you go
- `T001` requires an internet connection to install Expo packages
- The GitHub API endpoint is unauthenticated — rate limit is 60 req/hr, acceptable for manual user-triggered checks
