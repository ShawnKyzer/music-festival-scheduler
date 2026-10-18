/**
 * Multi-festival database tests against a real SQLite engine (node:sqlite,
 * Node 22.5+) behind a minimal expo-sqlite-shaped adapter.
 *
 * Covers the fresh-install path and, most importantly, upgrading an existing
 * single-festival (V1) install without losing the user's saved schedule.
 */
import { DatabaseSync } from 'node:sqlite';
import PRIMAVERA_2027_SHOWS from '../seeds/primavera2027';
import type * as QueriesModule from '../queries';

type Params = Array<string | number | null>;

function adapt(db: DatabaseSync) {
  return {
    execAsync: async (sql: string): Promise<void> => {
      db.exec(sql);
    },
    runAsync: async (sql: string, params: Params = []) => {
      const r = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    getFirstAsync: async <T>(sql: string, params: Params = []): Promise<T | null> =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(sql: string, params: Params = []): Promise<T[]> =>
      db.prepare(sql).all(...params) as T[],
    withTransactionAsync: async (task: () => Promise<void>): Promise<void> => {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

let mockDb: DatabaseSync;
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => adapt(mockDb)),
}));

type Queries = typeof QueriesModule;

// Fresh module registry = fresh app launch (database.ts caches its handle).
function launchApp(): Queries {
  let queries!: Queries;
  jest.isolateModules(() => {
    queries = require('../queries');
  });
  return queries;
}

// Schema and a slice of data exactly as shipped before multi-festival support.
function createV1Install(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    );
    CREATE TABLE shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      stage_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES stages(id)
    );
    CREATE TABLE schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (show_id) REFERENCES shows(id)
    );
    CREATE TABLE share_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_filter TEXT,
      show_count INTEGER NOT NULL,
      shared_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO stages (name, location) VALUES
      ('Stage 1 - Region of Madrid', 'Iberdrola Music - Main Area'),
      ('Stage 2 - Orange', 'Iberdrola Music - North Area');
    INSERT INTO shows (artist, description, stage_id, start_time, end_time) VALUES
      ('FOO FIGHTERS', 'Rock', 1, '2026-07-08T22:00:00', '2026-07-09T00:30:00'),
      ('MOBY', 'Electronic', 2, '2026-07-08T22:40:00', '2026-07-09T00:30:00'),
      ('PULP', 'Britpop', 1, '2026-07-12T00:40:00', '2026-07-12T02:00:00');
    INSERT INTO schedule (show_id) VALUES (1), (3);
    INSERT INTO share_history (day_filter, show_count) VALUES (NULL, 2);
    PRAGMA user_version = 1;
  `);
}

afterEach(() => {
  mockDb.close();
});

describe('fresh install', () => {
  beforeEach(() => {
    mockDb = new DatabaseSync(':memory:');
  });

  it('lists festivals newest-added first, with Primavera as the default', async () => {
    const { getFestivals } = launchApp();
    const festivals = await getFestivals();
    expect(festivals.map((f) => f.slug)).toEqual(['primavera-sound-2027', 'mad-cool-2026']);
    expect(festivals[0]).toMatchObject({
      name: 'Primavera Sound 2027',
      venue: 'Parc del Fòrum',
      city: 'Barcelona',
      startDate: '2027-06-02',
      endDate: '2027-06-06',
    });
  });

  it('keeps the full Mad Cool timetable and loads the TBA Primavera lineup', async () => {
    const { getFestivals, getAllShows, getFestivalDays } = launchApp();
    const [primavera, madCool] = await getFestivals();

    const madCoolShows = await getAllShows(madCool.id);
    expect(madCoolShows).toHaveLength(83);
    expect(madCoolShows.every((s) => s.startTime && s.stageName)).toBe(true);
    expect(await getFestivalDays(madCool.id)).toEqual([
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
    ]);

    const primaveraShows = await getAllShows(primavera.id);
    expect(primaveraShows).toHaveLength(PRIMAVERA_2027_SHOWS.length);
    expect(primaveraShows.every((s) => s.startTime === null && s.stageId === null)).toBe(true);
    expect(primaveraShows.map((s) => s.artist)).toContain('Massive Attack');
    expect(await getFestivalDays(primavera.id)).toEqual([]);
  });

  it('scopes the saved schedule to the selected festival', async () => {
    const { getFestivals, getAllShows, addToSchedule, getSchedule, getScheduledShowIds } =
      launchApp();
    const [primavera, madCool] = await getFestivals();
    const [doechii] = (await getAllShows(primavera.id)).filter((s) => s.artist === 'Doechii');
    const [pulp] = (await getAllShows(madCool.id)).filter((s) => s.artist === 'PULP');

    await addToSchedule(doechii.id);
    await addToSchedule(pulp.id);

    const primaveraSchedule = await getSchedule(primavera.id);
    expect(primaveraSchedule).toHaveLength(1);
    expect(primaveraSchedule[0]).toMatchObject({
      showId: doechii.id,
      artist: 'Doechii',
      stageName: null,
      startTime: null,
    });
    expect([...(await getScheduledShowIds(madCool.id))]).toEqual([pulp.id]);
  });

  it('does not re-seed or re-migrate on the next launch', async () => {
    await launchApp().getFestivals();
    const { getFestivals, getAllShows } = launchApp();
    const festivals = await getFestivals();
    expect(festivals).toHaveLength(2);
    expect(await getAllShows(festivals[0].id)).toHaveLength(PRIMAVERA_2027_SHOWS.length);
  });
});

describe('upgrading a V1 (Mad Cool only) install', () => {
  beforeEach(() => {
    mockDb = new DatabaseSync(':memory:');
    createV1Install(mockDb);
  });

  it('keeps saved shows, their ids and share history', async () => {
    const { getFestivals, getSchedule, getShareCount } = launchApp();
    const [primavera, madCool] = await getFestivals();

    const saved = await getSchedule(madCool.id);
    expect(saved.map((e) => [e.showId, e.artist, e.stageName])).toEqual([
      [1, 'FOO FIGHTERS', 'Stage 1 - Region of Madrid'],
      [3, 'PULP', 'Stage 1 - Region of Madrid'],
    ]);
    expect(await getSchedule(primavera.id)).toEqual([]);
    expect(await getShareCount()).toBe(1);
  });

  it('assigns existing stages and shows to Mad Cool and adds Primavera', async () => {
    const { getFestivals, getAllShows, getAllStages } = launchApp();
    const [primavera, madCool] = await getFestivals();

    expect((await getAllShows(madCool.id)).map((s) => s.artist)).toEqual([
      'FOO FIGHTERS',
      'MOBY',
      'PULP',
    ]);
    expect((await getAllStages(madCool.id)).map((s) => s.id)).toEqual([1, 2]);
    expect(await getAllStages(primavera.id)).toEqual([]);
    expect(await getAllShows(primavera.id)).toHaveLength(PRIMAVERA_2027_SHOWS.length);
  });

  it('leaves foreign keys enforced and intact', async () => {
    const { getFestivals, addToSchedule } = launchApp();
    await getFestivals();

    expect(mockDb.prepare('PRAGMA user_version').get()).toEqual({ user_version: 2 });
    expect(mockDb.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(mockDb.prepare('PRAGMA foreign_keys').get()).toEqual({ foreign_keys: 1 });
    await expect(addToSchedule(999_999)).rejects.toThrow(/FOREIGN KEY/);
  });
});
