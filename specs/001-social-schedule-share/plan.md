# Implementation Plan: Social Schedule Share

**Branch**: `001-social-schedule-share` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-social-schedule-share/spec.md`

## Summary

Add social sharing to the Music Festival Scheduler so users can generate a branded PNG image of their personal schedule and share it via the device's native share sheet. Use `react-native-view-shot` to capture a React Native view hierarchy as an image (no canvas/webview), and `expo-sharing` to invoke the OS share sheet. Store share history in the existing SQLite database. All rendering and capture happens on-device with zero network dependency.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: expo-sharing (~13.0), react-native-view-shot (~4.0), expo-sqlite (existing)
**Storage**: expo-sqlite with WAL mode (existing `madcool2026v2.db`)
**Testing**: Jest + expo-sqlite in-memory database for data layer tests
**Target Platform**: Android (primary), iOS (secondary) via Expo SDK 54
**Project Type**: Mobile app (React Native / Expo)
**Performance Goals**: Share sheet opens within 3 seconds of tap on mid-range device
**Constraints**: Fully offline; no network requests during image generation or sharing
**Scale/Scope**: Up to 72 shows across 4 days; single user, single device

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| **I. Offline-First** | Image generation and sharing MUST work without network | ✅ PASS — `react-native-view-shot` captures locally; `expo-sharing` invokes OS share sheet; no remote calls |
| **II. Clean TypeScript** | All new files MUST use strict TS with explicit types in `src/types/` | ✅ PASS — new `ShareHistory` type will be added to `src/types/index.ts`; all functions explicitly typed |
| **III. Minimal Dependencies** | New packages MUST be justified | ✅ PASS — `expo-sharing` is an Expo SDK module (no alternative in core); `react-native-view-shot` is the only maintained RN view-capture library (no Expo built-in equivalent). Two additions, both essential. |
| **IV. Dark-Themed UI** | All new UI MUST use `Colors` from `theme.ts` | ✅ PASS — share image component and preview modal will import only from `theme.ts` |
| **V. SQLite Testing** | New `src/db/` functions MUST have tests | ✅ PASS — `addShareHistory` and `getShareHistory` will have tests covering insert, retrieval, and edge cases |

**Gate result**: ALL PASS — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-social-schedule-share/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ShowCard.tsx              # Existing
│   ├── DaySelector.tsx           # Existing
│   ├── ShareableSchedule.tsx     # NEW — off-screen RN view for image capture
│   └── SharePreviewModal.tsx     # NEW — full-screen preview with Share/Cancel
├── constants/
│   └── theme.ts                  # Existing (no changes)
├── db/
│   ├── database.ts               # MODIFIED — add share_history table to schema
│   ├── queries.ts                # MODIFIED — add share history query functions
│   └── __tests__/
│       └── shareHistory.test.ts  # NEW — SQLite tests for share history
└── types/
    └── index.ts                  # MODIFIED — add ShareHistory interface

app/(tabs)/
└── schedule.tsx                  # MODIFIED — add Share button + hook up capture/share flow
```

**Structure Decision**: Follows the existing single-project mobile pattern. New components go in `src/components/`, new DB functions in `src/db/queries.ts`, new types in `src/types/index.ts`. No new directories needed beyond a `__tests__/` folder under `src/db/`.

## Complexity Tracking

> No constitution violations. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
