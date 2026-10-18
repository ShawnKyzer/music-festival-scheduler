export interface Festival {
  id: number;
  slug: string;
  name: string;
  venue: string;
  city: string;
  startDate: string; // YYYY-MM-DD, first festival day
  endDate: string;   // YYYY-MM-DD, last festival day
}

export interface Stage {
  id: number;
  festivalId: number;
  name: string;
  location: string;
}

// Lineups are often announced months before the timetable, so stage and set
// times stay null until the festival publishes them.
export interface Show {
  id: number;
  artist: string;
  description: string;
  stageId: number | null;
  stageName: string | null;
  stageLocation: string | null;
  startTime: string | null; // ISO 8601 wall-clock festival time
  endTime: string | null;   // ISO 8601 wall-clock festival time
}

export interface ScheduleEntry {
  id: number;
  showId: number;
  artist: string;
  description: string;
  stageName: string | null;
  stageLocation: string | null;
  startTime: string | null;
  endTime: string | null;
}

// A lineup row as scraped, before it is inserted into the database.
export interface SeedShow {
  artist: string;
  startTime: string | null;
  endTime: string | null;
}

export interface ShareHistory {
  id: number;
  dayFilter: string | null;  // null = all days
  showCount: number;
  sharedAt: string;           // ISO 8601
}

// --- In-app update types ---

export type UpdateStatus = 'up_to_date' | 'update_available' | 'error';

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  content_type: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  assets: GitHubReleaseAsset[];
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
