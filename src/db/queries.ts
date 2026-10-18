import { getDatabase } from './database';
import type { Festival, Show, ScheduleEntry, Stage, ShareHistory } from '../types';
import { FESTIVAL_DAY_OFFSET_HOURS } from '../utils/festivalDay';

// Shows without published set times sort after timed ones, alphabetically.
const SHOW_ORDER = 's.start_time IS NULL, s.start_time, s.artist COLLATE NOCASE';

const SHOW_COLUMNS = `
  s.id,
  s.artist,
  s.description,
  s.stage_id as stageId,
  st.name as stageName,
  st.location as stageLocation,
  s.start_time as startTime,
  s.end_time as endTime`;

// Most recently added first, so the newest festival is the default.
export async function getFestivals(): Promise<Festival[]> {
  const db = await getDatabase();
  return db.getAllAsync<Festival>(`
    SELECT
      id,
      slug,
      name,
      venue,
      city,
      start_date as startDate,
      end_date as endDate
    FROM festivals
    ORDER BY id DESC
  `);
}

export async function getAllStages(festivalId: number): Promise<Stage[]> {
  const db = await getDatabase();
  return db.getAllAsync<Stage>(
    `SELECT id, festival_id as festivalId, name, location
    FROM stages
    WHERE festival_id = ?
    ORDER BY name`,
    [festivalId]
  );
}

export async function getAllShows(festivalId: number): Promise<Show[]> {
  const db = await getDatabase();
  return db.getAllAsync<Show>(
    `SELECT ${SHOW_COLUMNS}
    FROM shows s
    LEFT JOIN stages st ON s.stage_id = st.id
    WHERE s.festival_id = ?
    ORDER BY ${SHOW_ORDER}`,
    [festivalId]
  );
}

export async function getShowsByDay(festivalId: number, dateStr: string): Promise<Show[]> {
  const db = await getDatabase();
  return db.getAllAsync<Show>(
    `SELECT ${SHOW_COLUMNS}
    FROM shows s
    LEFT JOIN stages st ON s.stage_id = st.id
    WHERE s.festival_id = ?
      AND date(s.start_time, '-${FESTIVAL_DAY_OFFSET_HOURS} hours') = ?
    ORDER BY ${SHOW_ORDER}`,
    [festivalId, dateStr]
  );
}

export async function getSchedule(festivalId: number): Promise<ScheduleEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleEntry>(
    `SELECT
      sc.id,
      sc.show_id as showId,
      s.artist,
      s.description,
      st.name as stageName,
      st.location as stageLocation,
      s.start_time as startTime,
      s.end_time as endTime
    FROM schedule sc
    JOIN shows s ON sc.show_id = s.id
    LEFT JOIN stages st ON s.stage_id = st.id
    WHERE s.festival_id = ?
    ORDER BY ${SHOW_ORDER}`,
    [festivalId]
  );
}

export async function isShowInSchedule(showId: number): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM schedule WHERE show_id = ?',
    [showId]
  );
  return (result?.count ?? 0) > 0;
}

export async function addToSchedule(showId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO schedule (show_id) VALUES (?)',
    [showId]
  );
}

export async function removeFromSchedule(showId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM schedule WHERE show_id = ?', [showId]);
}

// Only days with published set times; empty while the timetable is TBA.
export async function getFestivalDays(festivalId: number): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(start_time, '-${FESTIVAL_DAY_OFFSET_HOURS} hours') as day
    FROM shows
    WHERE festival_id = ? AND start_time IS NOT NULL
    ORDER BY day`,
    [festivalId]
  );
  return rows.map((r) => r.day);
}

export async function getScheduledShowIds(festivalId: number): Promise<Set<number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ show_id: number }>(
    `SELECT sc.show_id
    FROM schedule sc
    JOIN shows s ON sc.show_id = s.id
    WHERE s.festival_id = ?`,
    [festivalId]
  );
  return new Set(rows.map((r) => r.show_id));
}

export async function addShareHistory(
  dayFilter: string | null,
  showCount: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO share_history (day_filter, show_count) VALUES (?, ?)',
    [dayFilter, showCount]
  );
}

export async function getShareHistory(): Promise<ShareHistory[]> {
  const db = await getDatabase();
  return db.getAllAsync<ShareHistory>(`
    SELECT
      id,
      day_filter as dayFilter,
      show_count as showCount,
      shared_at as sharedAt
    FROM share_history
    ORDER BY shared_at DESC
  `);
}

export async function getShareCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM share_history'
  );
  return result?.count ?? 0;
}
