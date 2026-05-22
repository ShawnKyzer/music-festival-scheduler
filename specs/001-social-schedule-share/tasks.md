# Tasks: Social Schedule Share

**Input**: Design documents from `specs/001-social-schedule-share/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included for data layer only (Constitution Principle V requires tests for all `src/db/` functions).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and add shared types/schema required by all stories

- [ ] T001 Install `expo-sharing` and `react-native-view-shot` via `npm install expo-sharing react-native-view-shot`
- [ ] T002 [P] Add `ShareHistory` interface to `src/types/index.ts` per data-model.md
- [ ] T003 [P] Add `share_history` table creation to `initializeSchema()` in `src/db/database.ts` per data-model.md SQL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data layer and tests that MUST be complete before any UI story can record share history

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement `addShareHistory(dayFilter, showCount)` function in `src/db/queries.ts`
- [ ] T005 Implement `getShareHistory()` function in `src/db/queries.ts`
- [ ] T006 Implement `getShareCount()` function in `src/db/queries.ts`
- [ ] T007 Create `src/db/__tests__/shareHistory.test.ts` with tests: insert single event, insert with null dayFilter, insert with specific dayFilter, retrieve ordered by most recent, getShareCount returns correct total, empty history returns empty array

**Checkpoint**: Share history data layer complete and tested. UI story implementation can begin.

---

## Phase 3: User Story 1 — Share Full Schedule as Image (Priority: P1) 🎯 MVP

**Goal**: User taps Share on the My Schedule screen → branded PNG image of full schedule is generated → native share sheet opens with the image

**Independent Test**: Add 3+ shows across multiple days to the schedule, tap the Share button, verify a branded image is generated showing all shows grouped by day with artist name, time, and stage, and the native share sheet opens.

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `ShareableSchedule` component in `src/components/ShareableSchedule.tsx` — a React Native `<View>` (with `collapsable={false}`) that renders the full schedule grouped by day. Must include: branded header ("Mad Cool 2026 · July 8–11, Madrid"), day section headers with purple accent, show rows with artist name, start/end time, and stage name. Style using only `Colors.*` from `src/constants/theme.ts`. Accept props: `sections: Section[]` (same shape as `schedule.tsx` `groupByDay` output). Width fixed at 1080px for capture resolution.
- [ ] T009 [P] [US1] Create `useShareSchedule` hook in `src/components/ShareableSchedule.tsx` (or co-located) that: (a) holds a `ref` to the `ShareableSchedule` view, (b) calls `captureRef(ref, { format: 'png', quality: 1.0, result: 'tmpfile', width: 1080 })`, (c) checks `Sharing.isAvailableAsync()`, (d) calls `Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Mad Cool schedule' })`, (e) on success calls `addShareHistory(null, showCount)`, (f) wraps all in try/catch with user-facing error alert.
- [ ] T010 [US1] Add Share button to `app/(tabs)/schedule.tsx` — render an `<Ionicons name="share-outline">` Pressable in the header area. Button MUST be hidden when `sections` is empty (FR-006). On press, trigger the capture-and-share flow from T009.
- [ ] T011 [US1] Mount `ShareableSchedule` off-screen in `app/(tabs)/schedule.tsx` — position with `{ position: 'absolute', left: -9999 }` so it is rendered in the native view hierarchy but invisible. Pass current `sections` data as props.
- [ ] T012 [US1] Handle edge cases in `app/(tabs)/schedule.tsx`: (a) show `ActivityIndicator` or disable button while image is generating, (b) if `Sharing.isAvailableAsync()` returns false, show an `Alert` saying sharing is not available on this device, (c) if `captureRef` throws, show an `Alert` with a generic error message, (d) if user cancels share sheet, return to previous state silently.

**Checkpoint**: Full-schedule sharing flow is end-to-end functional. User can share a branded image of all scheduled shows.

---

## Phase 4: User Story 2 — Share Single Day Schedule (Priority: P2)

**Goal**: When viewing a filtered single-day schedule, the Share button generates an image containing only that day's shows with the day/date as heading.

**Independent Test**: Add shows across multiple days, filter the schedule screen to one day, tap Share, verify the generated image contains only that day's shows with the day name as heading.

**Depends on**: Phase 3 (US1) components — reuses `ShareableSchedule`, `useShareSchedule`, and the Share button.

### Implementation for User Story 2

- [ ] T013 [US2] Add `DaySelector` to `app/(tabs)/schedule.tsx` — import the existing `DaySelector` component from `src/components/DaySelector.tsx`. Add state for `selectedDay` (default: `'all'`). Extract unique days from schedule entries. When a day is selected, filter `sections` to only that day. Add an "All Days" option to reset the filter.
- [ ] T014 [US2] Update `ShareableSchedule` in `src/components/ShareableSchedule.tsx` to accept an optional `dayFilter: string | null` prop. When `dayFilter` is set, render only sections matching that day and include the day/date as a prominent heading below the brand header.
- [ ] T015 [US2] Update share flow in `app/(tabs)/schedule.tsx` — pass the current `selectedDay` filter value (or `null` for all days) through to `useShareSchedule` and to `addShareHistory(dayFilter, showCount)`. Ensure the off-screen `ShareableSchedule` receives the filtered sections.
- [ ] T016 [US2] Handle empty day edge case — if the selected day has zero shows, disable the Share button and optionally show inline text "No shows on this day to share".

**Checkpoint**: Single-day sharing works. User can share either the full schedule or a single day's schedule.

---

## Phase 5: User Story 3 — Preview Image Before Sharing (Priority: P3)

**Goal**: After tapping Share, a full-screen modal shows a preview of the generated image. User can confirm (opens share sheet) or cancel (dismisses modal).

**Independent Test**: Tap Share, verify a modal appears with the image preview and two buttons (Share, Cancel). Tap Cancel — modal dismisses, no share sheet. Tap Share — share sheet opens with the same image.

**Depends on**: Phase 3 (US1) capture infrastructure.

### Implementation for User Story 3

- [ ] T017 [P] [US3] Create `SharePreviewModal` component in `src/components/SharePreviewModal.tsx` — a full-screen `Modal` (transparent background with dark overlay) that displays the captured image URI in a scrollable `<Image>` view. Two buttons at the bottom: "Share" (purple primary, calls `onShare`) and "Cancel" (text-only, calls `onCancel`). Style using only `Colors.*` from `src/constants/theme.ts`.
- [ ] T018 [US3] Update share flow in `app/(tabs)/schedule.tsx` — after `captureRef` succeeds, instead of immediately calling `Sharing.shareAsync`, set state `{ previewUri: uri, previewVisible: true }`. Mount `SharePreviewModal` with `visible={previewVisible}`. On `onShare`: call `Sharing.shareAsync` + `addShareHistory`, then clear preview state. On `onCancel`: clear preview state.
- [ ] T019 [US3] Handle preview edge cases: if image URI is invalid or file was cleaned up, show error in the modal. Ensure modal is dismissed if the app goes to background and returns.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 [P] Verify all new components import colors exclusively from `src/constants/theme.ts` — no inline hex values (Principle IV compliance audit)
- [ ] T021 [P] Verify all new functions in `src/db/queries.ts` have explicit parameter and return types (Principle II compliance audit)
- [ ] T022 Run full test suite: `npx jest src/db/__tests__/shareHistory.test.ts` — confirm all tests pass
- [ ] T023 Manual end-to-end test per `specs/001-social-schedule-share/quickstart.md`: build APK, install on device, test share flow for full schedule, single day, and preview
- [ ] T024 Run `npx expo start` and verify no TypeScript or runtime errors on all tabs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 for packages, T002–T003 for types/schema)
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 3 (reuses ShareableSchedule and share flow)
- **US3 (Phase 5)**: Depends on Phase 3 (reuses capture infrastructure)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

```text
Phase 1 (Setup)
  └─→ Phase 2 (Foundational: DB + tests)
       └─→ Phase 3 (US1: Full Schedule Share) 🎯 MVP
            ├─→ Phase 4 (US2: Single Day Share)
            └─→ Phase 5 (US3: Preview Modal)
                 └─→ Phase 6 (Polish)
```

- **US1** is fully independent after foundational phase
- **US2** builds on US1's components (ShareableSchedule, share flow) but adds day filtering
- **US3** builds on US1's capture infrastructure but adds preview modal
- **US2 and US3 can run in parallel** after US1 is complete

### Parallel Opportunities

**Within Phase 1**: T002 and T003 can run in parallel (different files)
**Within Phase 3**: T008 and T009 can run in parallel (different concerns, same file but independent sections)
**Phases 4 & 5**: Can proceed in parallel once Phase 3 is complete
**Within Phase 6**: T020 and T021 can run in parallel (independent audits)

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch US1 parallel tasks:
Task T008: "Create ShareableSchedule component in src/components/ShareableSchedule.tsx"
Task T009: "Create useShareSchedule hook in src/components/ShareableSchedule.tsx"

# Then sequential tasks that depend on T008+T009:
Task T010: "Add Share button to app/(tabs)/schedule.tsx"
Task T011: "Mount ShareableSchedule off-screen in app/(tabs)/schedule.tsx"
Task T012: "Handle edge cases in app/(tabs)/schedule.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational data layer + tests (T004–T007)
3. Complete Phase 3: User Story 1 (T008–T012)
4. **STOP and VALIDATE**: Test full-schedule sharing end-to-end on device
5. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Data layer ready
2. Add US1 → Test independently → **MVP ready** ✅
3. Add US2 → Test day filtering → Enhanced sharing
4. Add US3 → Test preview flow → Full feature complete
5. Polish → Compliance audit + final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution Principle V requires tests for `src/db/` functions — tests are included in Phase 2
- UI component tests are not required by the constitution — excluded to minimize scope
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
