import { getDatabase } from './database';
import type { Show, ScheduleEntry, Stage, ShareHistory } from '../types';
import { FESTIVAL_DAY_OFFSET_HOURS } from '../utils/festivalDay';

export async function getAllStages(): Promise<Stage[]> {
  const db = await getDatabase();
  return db.getAllAsync<Stage>('SELECT * FROM stages ORDER BY name');
}

export async function getAllShows(): Promise<Show[]> {
  const db = await getDatabase();
  return db.getAllAsync<Show>(`
    SELECT
      s.id,
      s.artist,
      s.description,
      s.stage_id as stageId,
      st.name as stageName,
      st.location as stageLocation,
      s.start_time as startTime,
      s.end_time as endTime
    FROM shows s
    JOIN stages st ON s.stage_id = st.id
    ORDER BY s.start_time ASC
  `);
}

export async function getShowsByDay(dateStr: string): Promise<Show[]> {
  const db = await getDatabase();
  return db.getAllAsync<Show>(
    `SELECT
      s.id,
      s.artist,
      s.description,
      s.stage_id as stageId,
      st.name as stageName,
      st.location as stageLocation,
      s.start_time as startTime,
      s.end_time as endTime
    FROM shows s
    JOIN stages st ON s.stage_id = st.id
    WHERE date(s.start_time, '-${FESTIVAL_DAY_OFFSET_HOURS} hours') = ?
    ORDER BY s.start_time ASC`,
    [dateStr]
  );
}

export async function getSchedule(): Promise<ScheduleEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<ScheduleEntry>(`
    SELECT
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
    JOIN stages st ON s.stage_id = st.id
    ORDER BY s.start_time ASC
  `);
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

export async function getFestivalDays(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(start_time, '-${FESTIVAL_DAY_OFFSET_HOURS} hours') as day FROM shows ORDER BY day`
  );
  return rows.map((r) => r.day);
}

export async function getScheduledShowIds(): Promise<Set<number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ show_id: number }>(
    'SELECT show_id FROM schedule'
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
