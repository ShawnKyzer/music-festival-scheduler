# Data Model: Social Schedule Share

**Date**: 2026-04-25
**Branch**: `001-social-schedule-share`

## Existing Entities (read-only for this feature)

### stages
| Column   | Type    | Constraints              |
|----------|---------|--------------------------|
| id       | INTEGER | PRIMARY KEY AUTOINCREMENT|
| name     | TEXT    | NOT NULL                 |
| location | TEXT    | NOT NULL                 |

### shows
| Column     | Type    | Constraints              |
|------------|---------|--------------------------|
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT|
| artist     | TEXT    | NOT NULL                 |
| description| TEXT    | NOT NULL DEFAULT ''      |
| stage_id   | INTEGER | NOT NULL, FK → stages(id)|
| start_time | TEXT    | NOT NULL (ISO 8601)      |
| end_time   | TEXT    | NOT NULL (ISO 8601)      |

### schedule
| Column     | Type    | Constraints              |
|------------|---------|--------------------------|
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT|
| show_id    | INTEGER | NOT NULL UNIQUE, FK → shows(id)|
| created_at | TEXT    | NOT NULL DEFAULT datetime('now')|

## New Entity

### share_history
Records each time the user shares their schedule as an image.

| Column     | Type    | Constraints              |
|------------|---------|--------------------------|
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT|
| day_filter | TEXT    | NULL (NULL = all days, otherwise ISO date e.g. '2026-07-08')|
| show_count | INTEGER | NOT NULL (number of shows in the shared image)|
| shared_at  | TEXT    | NOT NULL DEFAULT datetime('now')|

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS share_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_filter TEXT,
  show_count INTEGER NOT NULL,
  shared_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_share_history_shared_at
  ON share_history(shared_at);
```

**Relationships**:
- `share_history` is standalone — it does not reference `schedule`
  or `shows` via foreign keys. It records a snapshot event, not a
  persistent link to specific shows (the user's schedule may change
  after sharing).

## TypeScript Interfaces

### New: ShareHistory
```ts
export interface ShareHistory {
  id: number;
  dayFilter: string | null;  // null = all days
  showCount: number;
  sharedAt: string;           // ISO 8601
}
```

### Existing (unchanged)
- `Stage` — `{ id, name, location }`
- `Show` — `{ id, artist, description, stageId, stageName, stageLocation, startTime, endTime }`
- `ScheduleEntry` — `{ id, showId, artist, description, stageName, stageLocation, startTime, endTime }`

## New Database Functions

### queries.ts additions

| Function | Signature | Description |
|----------|-----------|-------------|
| `addShareHistory` | `(dayFilter: string \| null, showCount: number) => Promise<void>` | Insert a share event |
| `getShareHistory` | `() => Promise<ShareHistory[]>` | Retrieve all share events, ordered by most recent first |
| `getShareCount` | `() => Promise<number>` | Return total number of shares (for potential UI badge) |
