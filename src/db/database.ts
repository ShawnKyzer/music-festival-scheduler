import * as SQLite from 'expo-sqlite';

const DB_NAME = 'festival.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await initializeSchema(db);
  return db;
}

async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      stage_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES stages(id)
    );

    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      show_id INTEGER NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (show_id) REFERENCES shows(id)
    );

    CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time);
    CREATE INDEX IF NOT EXISTS idx_shows_stage_id ON shows(stage_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_show_id ON schedule(show_id);
  `);

  // Seed sample data if the database is empty
  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM stages'
  );

  if (count && count.count === 0) {
    await seedData(database);
  }
}

async function seedData(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    INSERT INTO stages (name, location) VALUES
      ('Main Stage', 'North Field - Gate A'),
      ('Sunset Stage', 'West Meadow - Gate B'),
      ('The Grove', 'East Woods - Gate C'),
      ('Electric Tent', 'South Plaza - Gate D'),
      ('Acoustic Garden', 'Central Park - Gate A');
  `);

  // Festival dates: a 3-day weekend
  await database.execAsync(`
    INSERT INTO shows (artist, description, stage_id, start_time, end_time) VALUES
      -- Day 1 (Friday)
      ('The Lumineers', 'Indie folk band known for their anthemic sound', 1, '2025-06-20T16:00:00', '2025-06-20T17:30:00'),
      ('Tame Impala', 'Psychedelic rock and synth-driven grooves', 2, '2025-06-20T15:00:00', '2025-06-20T16:30:00'),
      ('Khruangbin', 'Global funk and psychedelic vibes', 3, '2025-06-20T17:00:00', '2025-06-20T18:30:00'),
      ('Bonobo', 'Downtempo electronic and organic beats', 4, '2025-06-20T19:00:00', '2025-06-20T20:30:00'),
      ('Iron & Wine', 'Intimate folk and soft rock', 5, '2025-06-20T14:00:00', '2025-06-20T15:30:00'),
      ('Florence + The Machine', 'Powerful vocals and orchestral indie rock', 1, '2025-06-20T19:00:00', '2025-06-20T21:00:00'),
      ('RÜFÜS DU SOL', 'Live electronic and deep house anthems', 4, '2025-06-20T21:30:00', '2025-06-20T23:00:00'),

      -- Day 2 (Saturday)
      ('Radiohead', 'Legendary art rock and electronic experimentalism', 1, '2025-06-21T20:00:00', '2025-06-21T22:00:00'),
      ('LCD Soundsystem', 'Dance-punk and electronic rock', 2, '2025-06-21T18:00:00', '2025-06-21T19:30:00'),
      ('Phoebe Bridgers', 'Indie rock with hauntingly beautiful lyrics', 3, '2025-06-21T15:00:00', '2025-06-21T16:30:00'),
      ('Four Tet', 'Minimalist electronic and textured soundscapes', 4, '2025-06-21T22:00:00', '2025-06-21T23:30:00'),
      ('Bon Iver', 'Ethereal indie folk and experimental pop', 5, '2025-06-21T16:00:00', '2025-06-21T17:30:00'),
      ('Jamie xx', 'UK dance and bass-driven electronic', 2, '2025-06-21T21:00:00', '2025-06-21T22:30:00'),
      ('Big Thief', 'Raw indie rock and poetic storytelling', 3, '2025-06-21T18:00:00', '2025-06-21T19:30:00'),

      -- Day 3 (Sunday)
      ('Arcade Fire', 'Epic indie rock with stadium-filling energy', 1, '2025-06-22T19:00:00', '2025-06-22T21:00:00'),
      ('Caribou', 'Psychedelic electronic and indie dance', 2, '2025-06-22T16:00:00', '2025-06-22T17:30:00'),
      ('Warpaint', 'Dreamy post-punk and art rock', 3, '2025-06-22T14:00:00', '2025-06-22T15:30:00'),
      ('Tycho', 'Ambient electronic and chillwave', 4, '2025-06-22T17:00:00', '2025-06-22T18:30:00'),
      ('Fleet Foxes', 'Lush harmonies and baroque folk', 5, '2025-06-22T15:00:00', '2025-06-22T16:30:00'),
      ('Gorillaz', 'Genre-defying virtual band blending hip-hop, rock, and electronic', 1, '2025-06-22T16:00:00', '2025-06-22T17:30:00'),
      ('Moderat', 'Dark and powerful electronic live act', 4, '2025-06-22T20:00:00', '2025-06-22T21:30:00');
  `);
}
