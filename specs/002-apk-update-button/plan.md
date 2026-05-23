# Implementation Plan: In-App APK Update Button

**Branch**: `002-apk-update-button` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/002-apk-update-button/spec.md`

## Summary

Add a Settings tab with a "Check for Updates" button that queries the GitHub Releases API for the latest APK, compares it against the installed version, and triggers the Android OS package installer when an update is available. The feature is opt-in, network-only, and degrades gracefully offline — satisfying the constitution's Offline-First carve-out for optional enhancements.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: React Native 0.81, Expo SDK 54, Expo Router 6
**New Packages**: `expo-file-system` (download), `expo-intent-launcher` (APK install)
**Existing Packages Used**: `expo-constants` (current version), `@expo/vector-icons` (Ionicons)
**Storage**: N/A — no SQLite changes; all state is ephemeral
**Testing**: Jest + ts-jest (existing setup)
**Target Platform**: Android (primary); settings screen renders on iOS/web but download/install path is Android-only
**Performance Goals**: Update check resolves in <5 seconds on normal network (GitHub API p50 ~300ms + download varies by file size)
**Constraints**: GitHub unauthenticated API rate limit (60 req/hr) — acceptable for user-triggered checks
**Scale/Scope**: Single-user device app; no concurrency concerns

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Offline-First | ✅ Compliant | Feature is an optional enhancement; errors degrade gracefully; core screens unaffected |
| II. Clean TypeScript | ✅ Compliant | New types in `src/types/index.ts`; no `any` types; async/await throughout |
| III. Minimal Dependencies | ✅ Compliant | 2 new Expo SDK packages (`expo-file-system`, `expo-intent-launcher`); no non-Expo additions |
| IV. Dark UI | ✅ Compliant | All new UI imports from `src/constants/theme.ts`; no inline hex values |
| V. SQLite Testing | ✅ N/A | No SQLite operations; `updateService.ts` unit tests cover happy path + error paths |

## Project Structure

### Documentation (this feature)

```text
specs/002-apk-update-button/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Types and state machine
├── quickstart.md        # Integration scenarios
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (new files and changes)

```text
src/
├── types/
│   └── index.ts                  # ADD: UpdateStatus, UpdateCheckResult, DownloadProgress
├── services/
│   └── updateService.ts          # NEW: GitHub API + version compare logic
└── hooks/
    └── useAppUpdate.ts           # NEW: state machine hook

app/
└── (tabs)/
    ├── _layout.tsx               # MODIFY: add Settings tab entry
    └── settings.tsx              # NEW: Settings screen with update UI

__tests__/
└── updateService.test.ts         # NEW: unit tests for updateService
```

## Implementation Phases

### Phase 1: Package Installation & Types

Install two new Expo SDK packages and add the required TypeScript types.

**New types** to add to `src/types/index.ts`:

```typescript
export type UpdateStatus = 'up_to_date' | 'update_available' | 'error';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: GitHubReleaseAsset[];
}

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface UpdateCheckResult {
  status: UpdateStatus;
  latestVersion: string | null;
  downloadUrl: string | null;
  error: string | null;
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  fraction: number;
}
```

### Phase 2: Update Service (`src/services/updateService.ts`)

Pure functions — easy to unit test.

```typescript
const GITHUB_API_URL =
  'https://api.github.com/repos/shawnkyzer/music-festival-scheduler/releases/latest';

// Normalize "v1.2.3" → "1.2.3"
function normalizeVersion(tag: string): string

// Fetch latest release and compare against currentVersion
async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult>

// Return the first .apk asset from a release, or null
function findApkAsset(release: GitHubRelease): GitHubReleaseAsset | null
```

Error handling:
- Network failure → `{ status: 'error', error: 'No internet connection. Please try again.' }`
- Non-200 response → `{ status: 'error', error: 'Could not check for updates. Please try again later.' }`
- No APK asset → `{ status: 'error', error: 'Update available but APK not found in release assets.' }`
- Up to date → `{ status: 'up_to_date', ... }`
- Update available → `{ status: 'update_available', downloadUrl: '...', latestVersion: '...' }`

### Phase 3: Update Hook (`src/hooks/useAppUpdate.ts`)

React hook that owns the full state machine (IDLE → CHECKING → downloading → INSTALLING / ERROR).

```typescript
type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'update_available'
  | 'up_to_date'
  | 'downloading'
  | 'installing'
  | 'error';

interface UseAppUpdateReturn {
  phase: UpdatePhase;
  latestVersion: string | null;
  downloadProgress: DownloadProgress | null;
  errorMessage: string | null;
  checkForUpdate: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  reset: () => void;
}
```

Key implementation notes:
- Guard `downloadAndInstall` with `Platform.OS === 'android'` — show an informative message on other platforms
- Use `FileSystem.downloadAsync` with a `callback` for progress updates
- Convert downloaded file to content URI with `FileSystem.getContentUriAsync` before passing to `IntentLauncher`
- Clean up the downloaded APK from cache after install dialog is dismissed
- Debounce: disable buttons while any async operation is in-flight

### Phase 4: Settings Screen (`app/(tabs)/settings.tsx`)

New tab screen. Layout:

```
┌─────────────────────────────────┐
│  [gear icon]  Settings          │  ← screen header (auto from Expo Router)
├─────────────────────────────────┤
│                                 │
│  About                          │  ← section header
│  ┌───────────────────────────┐  │
│  │ Music Festival Scheduler  │  │
│  │ Version 1.0.0             │  │  ← from Constants.expoConfig?.version
│  └───────────────────────────┘  │
│                                 │
│  Updates                        │  ← section header
│  ┌───────────────────────────┐  │
│  │ [↓] Check for Updates     │  │  ← primary action button (Colors.primary)
│  └───────────────────────────┘  │
│                                 │
│  [status message area]          │  ← shows result / progress / error
│                                 │
│  [Download & Install] (cond.)   │  ← appears only when update_available
│                                 │
└─────────────────────────────────┘
```

State-driven rendering:
- `idle` → "Check for Updates" button enabled
- `checking` → button shows spinner, disabled
- `up_to_date` → success message "You're up to date (vX.X.X)"
- `update_available` → version info + "Download & Install" button
- `downloading` → progress bar + percentage + cancel not available (keep it simple)
- `error` → error message in `Colors.accent` (red), button re-enabled for retry

### Phase 5: Tab Registration (`app/(tabs)/_layout.tsx`)

Add a fourth tab entry:

```typescript
<Tabs.Screen
  name="settings"
  options={{
    title: 'Settings',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  }}
/>
```

### Phase 6: Tests (`__tests__/updateService.test.ts`)

| Test | Coverage |
|------|----------|
| `normalizeVersion` strips `v` prefix | happy path |
| `checkForUpdate` returns `up_to_date` when versions match | happy path |
| `checkForUpdate` returns `update_available` with correct URL | happy path |
| `checkForUpdate` returns `error` on network failure | error path |
| `checkForUpdate` returns `error` on non-200 response | error path |
| `findApkAsset` returns first `.apk` asset | happy path |
| `findApkAsset` returns `null` when no APK in assets | error path |

## Complexity Tracking

No constitution violations. No complexity justification required.
