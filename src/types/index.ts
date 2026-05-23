export interface Stage {
  id: number;
  name: string;
  location: string;
}

export interface Show {
  id: number;
  artist: string;
  description: string;
  stageId: number;
  stageName: string;
  stageLocation: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

export interface ScheduleEntry {
  id: number;
  showId: number;
  artist: string;
  description: string;
  stageName: string;
  stageLocation: string;
  startTime: string;
  endTime: string;
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
