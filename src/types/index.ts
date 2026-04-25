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
