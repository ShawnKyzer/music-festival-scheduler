# Research: In-App APK Update Button

## Decisions

### 1. Current Version Detection

**Decision**: Use `Constants.expoConfig?.version` from `expo-constants`
**Rationale**: Already installed (`expo-constants ~18.0.13`). Returns the version string from `app.json` (currently `"1.0.0"`). No additional dependency needed.
**Alternatives considered**: Hardcoding version — rejected (maintenance burden); native module — rejected (unnecessary complexity).

### 2. GitHub Releases API

**Decision**: Use `fetch` (React Native built-in) against `GET https://api.github.com/repos/shawnkyzer/music-festival-scheduler/releases/latest`
**Rationale**: Zero additional dependencies. The API is public (no auth required for public repos). Rate limit is 60 req/hr unauthenticated — acceptable for a manual update check triggered by the user.
**Alternatives considered**: `axios` — rejected (Principle III: unnecessary dep); GitHub GraphQL API — rejected (overkill for a single release query).

### 3. APK Download

**Decision**: Use `expo-file-system` (`FileSystem.downloadAsync`) to download to `FileSystem.cacheDirectory`
**Rationale**: Expo SDK package, aligned with Principle III. Provides a callback-based progress API. Downloads to the app's cache directory which is writable without extra permissions on Android.
**Alternatives considered**: `react-native-blob-util` — rejected (non-Expo, Principle III); `fetch` + manual buffer — rejected (no progress reporting, complex binary handling).

### 4. APK Installation (Android)

**Decision**: Use `expo-intent-launcher` + `FileSystem.getContentUriAsync()` to fire the Android package-installer intent
**Rationale**: Android 7+ requires a `content://` URI (via FileProvider) rather than a raw `file://` URI for APK installation. `FileSystem.getContentUriAsync()` handles the FileProvider translation. `expo-intent-launcher` fires the `android.intent.action.INSTALL_PACKAGE` intent. Both are Expo SDK packages.
**Alternatives considered**: `Linking.openURL` — rejected (does not support content:// URIs for APK install on Android 7+); direct native module — rejected (not needed when Expo provides the capability).

### 5. UI Placement

**Decision**: New **Settings** tab — `app/(tabs)/settings.tsx`
**Rationale**: Satisfies "discoverable within 2 taps" (main screen → Settings tab). Keeps update UI isolated from core feature screens (Lineup, Schedule, Map). Follows the existing tab pattern. Provides a natural home for future app info (version display, about).
**Alternatives considered**: Header action button on Lineup screen — considered (fewer taps) but rejected (pollutes the core feature screen); modal from long-press — rejected (not discoverable).

### 6. Version Comparison

**Decision**: Strip the `v` prefix from GitHub release tag before comparing with the app's version string
**Rationale**: GitHub releases use `v1.0.0` tag convention (confirmed from CI workflow: `git tag v{version}`). `expo-constants` returns `"1.0.0"` without the `v`. Comparison is string equality after normalization; semver ordering is not needed since we only check latest vs current.
**Alternatives considered**: Semver library — rejected (Principle III; string equality after prefix strip is sufficient for this use case).

### 7. Constitution Alignment

**Principle I (Offline-First)**: The update feature explicitly requires network. This is permitted under the constitution: *"Network access is permitted only for optional enhancements and MUST degrade gracefully when unavailable."* The update feature is opt-in (user taps a button) and all offline errors surface a clear message. Core app functionality is not gated on this feature.

**Principle III (Minimal Dependencies)**: Two new packages required — `expo-file-system` and `expo-intent-launcher`. Both are Expo SDK packages with no transitive weight beyond what Expo already manages. No non-Expo packages added.

**Principle IV (Dark UI)**: All new UI uses `Colors` from `src/constants/theme.ts`. No hard-coded color literals.

**Principle V (SQLite Testing)**: No new SQLite operations. Service logic (version fetch, comparison) should have unit tests covering happy path and error cases.
