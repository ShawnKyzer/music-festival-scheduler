# Quickstart & Integration Scenarios: In-App APK Update Button

## Prerequisites

```bash
npx expo install expo-file-system expo-intent-launcher
```

Both packages are Expo SDK managed — no native config changes needed beyond `expo install`.

## File Layout (new files only)

```text
src/
├── services/
│   └── updateService.ts        # GitHub API fetch + version compare
├── hooks/
│   └── useAppUpdate.ts         # State machine hook (check → download → install)
└── types/
    └── index.ts                # Add UpdateStatus, UpdateCheckResult, DownloadProgress

app/
└── (tabs)/
    └── settings.tsx            # New Settings tab screen

__tests__/
└── updateService.test.ts       # Unit tests for updateService
```

## Integration Scenarios

### Scenario 1: Happy path — update available

```
1. User opens Settings tab
2. App shows current version (e.g., "Version 1.0.0")
3. User taps "Check for Updates"
4. Spinner appears while GitHub API is queried
5. "Update available: v1.1.0" message appears with "Download & Install" button
6. User taps "Download & Install"
7. Progress bar fills as APK downloads
8. Android OS install dialog appears
9. User installs; app restarts at new version
```

### Scenario 2: Already up to date

```
1. User taps "Check for Updates"
2. GitHub API returns latest = current version
3. "You're up to date (v1.0.0)" message appears
4. Button resets to idle state
```

### Scenario 3: No internet

```
1. User taps "Check for Updates" with no network
2. fetch throws a network error
3. "No internet connection. Please try again." message appears
4. Button resets to idle state; user can retry
```

### Scenario 4: GitHub API unavailable

```
1. User taps "Check for Updates"
2. API returns non-200 status (e.g., 403 rate limit, 404, 5xx)
3. "Could not check for updates. Please try again later." message appears
4. Button resets to idle state
```

### Scenario 5: No APK asset on latest release

```
1. API returns a release that has no .apk asset
2. "Update available but APK not found in release assets." message appears
3. Button resets to idle state
```

### Scenario 6: Rapid double-tap (debounce)

```
1. User taps "Check for Updates" twice quickly
2. Only one in-flight request is made
3. Button is disabled while checking is in progress
```

## Testing Notes

- `updateService.ts` functions are pure async — mock `fetch` in Jest to simulate all API scenarios
- No SQLite operations — no database setup needed for tests
- `useAppUpdate.ts` hook state transitions can be tested with `@testing-library/react-hooks`
- Android-only: `expo-intent-launcher` calls should be guarded with `Platform.OS === 'android'`
