<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (5): Offline-First, Clean TypeScript,
      Minimal Dependencies, Dark UI, SQLite Testing
    - Technology Constraints
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (no changes needed)
    - .specify/templates/spec-template.md ✅ compatible (no changes needed)
    - .specify/templates/tasks-template.md ✅ compatible (no changes needed)
  Follow-up TODOs: None
-->

# Music Festival Scheduler Constitution

## Core Principles

### I. Offline-First Architecture

All app functionality MUST work without a network connection.
Data MUST be stored locally in an embedded SQLite database
via `expo-sqlite`. No feature may depend on a remote API for
core operations (browsing lineup, managing schedule, viewing
the map). Network access is permitted only for optional
enhancements (e.g., opening YouTube Music links) and MUST
degrade gracefully when unavailable.

- Every query and mutation MUST target the local SQLite
  database, never a remote endpoint.
- The database MUST be seeded on first launch so the app is
  immediately usable.
- If a future feature requires network data, it MUST cache
  locally and remain functional when the device is offline.

### II. Clean TypeScript Code

All source files MUST be written in strict TypeScript. Code
MUST be explicit, readable, and free of `any` types except
where a third-party type definition is genuinely unavailable.

- Every data structure MUST have a corresponding interface or
  type defined in `src/types/`.
- Functions MUST declare parameter and return types explicitly.
- Prefer `async/await` over raw Promises; avoid nested
  callbacks.
- File and directory naming MUST follow the existing
  conventions: PascalCase for components, camelCase for
  utilities and database modules.
- No `// @ts-ignore` or `// @ts-expect-error` without an
  accompanying justification comment.

### III. Minimal Dependencies

The dependency footprint MUST remain as small as practical.
Every new `dependencies` entry MUST be justified by a concrete
need that cannot be met with Expo SDK built-ins or a
reasonable amount of hand-written code.

- Before adding a package, verify whether Expo SDK or React
  Native core already provides the capability.
- `devDependencies` for tooling (linting, testing, types) are
  acceptable without the same scrutiny.
- Audit `package.json` periodically; remove unused packages.
- Pin Expo SDK-aligned versions (tilde ranges) for all Expo
  ecosystem packages to avoid version drift.

### IV. Consistent Dark-Themed UI with Purple Accents

The app MUST present a unified dark visual identity across
every screen, defined by the shared color palette in
`src/constants/theme.ts`.

- Background MUST use `Colors.background` (`#121212`);
  surfaces MUST use `Colors.surface` / `Colors.surfaceLight`.
- Primary accent MUST use `Colors.primary` (`#6C3CE1`) and
  `Colors.primaryLight` (`#A78BFA`).
- Text MUST use `Colors.text` (primary) and
  `Colors.textSecondary` (secondary) — never hard-coded color
  literals in component files.
- All new screens and components MUST import colors from
  `theme.ts`; inline hex values are prohibited.
- Interactive elements (buttons, toggles, selected states)
  MUST use the purple accent palette for visual consistency.

### V. Thorough Testing of SQLite Data Operations

Every database query and mutation exposed in `src/db/` MUST
have corresponding automated tests that verify correctness
against a real SQLite instance (not mocks).

- Tests MUST cover: schema creation, seed data integrity,
  CRUD operations on the `schedule` table, and edge cases
  (duplicate inserts, deleting non-existent rows, empty
  result sets).
- Test assertions MUST validate row counts, returned field
  values, and foreign-key constraint enforcement.
- New database functions MUST NOT be merged without a passing
  test that exercises the happy path and at least one error
  path.
- Use an in-memory or temporary SQLite database for tests to
  avoid side effects on the development database.

## Technology Constraints

- **Runtime**: React Native 0.81+ via Expo SDK 54
- **Language**: TypeScript 5.9+ with strict mode
- **Navigation**: Expo Router (file-based)
- **Storage**: expo-sqlite with WAL journal mode
- **Icons**: @expo/vector-icons (Ionicons)
- **Target platforms**: Android (primary), iOS (secondary)
- **Node.js**: v18+ for build tooling
- **Package manager**: npm (lockfile committed)

## Development Workflow

1. **Branch per feature** — Create a descriptive feature
   branch before starting work.
2. **Constitution check** — Verify the change respects all
   five Core Principles before implementation begins.
3. **Tests first for data layer** — Write failing SQLite tests
   before implementing new `src/db/` functions (Principle V).
4. **Theme compliance** — Run a visual check that new UI uses
   only `theme.ts` colors (Principle IV).
5. **Dependency review** — Any new package MUST be justified in
   the PR description (Principle III).
6. **Commit frequently** — Small, atomic commits with clear
   messages aligned to the task being completed.

## Governance

This constitution is the authoritative reference for all
development decisions on the Music Festival Scheduler project.
It supersedes informal conventions and ad-hoc patterns.

- **Amendments** MUST be documented with a version bump, a
  rationale, and an updated `LAST_AMENDED_DATE`.
- **Version scheme**: MAJOR.MINOR.PATCH
  - MAJOR: Principle removed or fundamentally redefined.
  - MINOR: New principle or section added; material expansion.
  - PATCH: Wording clarification, typo fix, non-semantic edit.
- **Compliance**: Every PR and code review MUST verify
  adherence to these principles. Deviations MUST be flagged
  and justified in a Complexity Tracking table (see
  plan-template.md).
- **Guidance file**: `README.md` serves as the runtime
  development guidance document and MUST stay aligned with
  this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25
