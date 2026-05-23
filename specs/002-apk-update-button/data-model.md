# Data Model: In-App APK Update Button

## Entities

### GitHubRelease

Represents a release record returned from the GitHub Releases API.

| Field | Type | Description |
|-------|------|-------------|
| `tag_name` | `string` | Version tag, e.g. `"v1.2.0"` |
| `name` | `string` | Release title |
| `published_at` | `string` | ISO 8601 publish timestamp |
| `assets` | `GitHubReleaseAsset[]` | List of binary assets attached to the release |

### GitHubReleaseAsset

Represents a single downloadable file attached to a release.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Filename, e.g. `"music-festival-scheduler.apk"` |
| `browser_download_url` | `string` | Direct download URL for the asset |
| `size` | `number` | File size in bytes |
| `content_type` | `string` | MIME type, e.g. `"application/vnd.android.package-archive"` |

### UpdateCheckResult

Application-level result from checking for an update.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `UpdateStatus` | Outcome of the version check |
| `latestVersion` | `string \| null` | Normalized version string, e.g. `"1.2.0"` (null if check failed) |
| `downloadUrl` | `string \| null` | APK download URL (null if up-to-date or check failed) |
| `error` | `string \| null` | Human-readable error message (null if no error) |

### UpdateStatus (enum)

```typescript
type UpdateStatus =
  | 'up_to_date'       // Current version matches latest release
  | 'update_available' // Newer version exists on GitHub
  | 'error'            // Network, API, or parse failure
```

### DownloadProgress

Represents the in-progress state of an APK download.

| Field | Type | Description |
|-------|------|-------------|
| `totalBytes` | `number` | Total file size in bytes (0 if unknown) |
| `downloadedBytes` | `number` | Bytes downloaded so far |
| `fraction` | `number` | `downloadedBytes / totalBytes`, range `[0, 1]` |

## State Machine

```
IDLE
  └─[user taps Check for Updates]─► CHECKING
       ├─[API error]─────────────────► ERROR (message shown)
       ├─[up to date]─────────────────► UP_TO_DATE (message shown)
       └─[update available]───────────► UPDATE_AVAILABLE (version + confirm shown)
            └─[user confirms]──────────► DOWNLOADING (progress shown)
                 ├─[download error]─────► ERROR (message shown)
                 └─[download complete]──► INSTALLING (OS install dialog)
                      └─[dismissed]──────► IDLE
```

## No SQLite Changes

This feature introduces no new database tables or queries. All state is ephemeral and held in React component/hook state.
