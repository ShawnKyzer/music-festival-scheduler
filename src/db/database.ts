import * as SQLite from 'expo-sqlite';

const DB_NAME = 'madcool2026v2.db';

// Bump this whenever the seed schedule changes. Existing installs run the
// matching migration(s) in runMigrations() so users keep their saved schedule.
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Cache the in-flight promise, not just the resolved handle, so concurrent
  // callers at startup share a single open + schema init. Otherwise each would
  // see a null handle and race to openDatabaseAsync/CREATE TABLE, which crashes
  // native prepareAsync with a NullPointerException.
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await initializeSchema(db);
      return db;
    })();
  }
  return dbPromise;
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

    CREATE TABLE IF NOT EXISTS share_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_filter TEXT,
      show_count INTEGER NOT NULL,
      shared_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time);
    CREATE INDEX IF NOT EXISTS idx_shows_stage_id ON shows(stage_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_show_id ON schedule(show_id);
    CREATE INDEX IF NOT EXISTS idx_share_history_shared_at ON share_history(shared_at);
  `);

  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM stages'
  );

  if (count && count.count === 0) {
    // Fresh install: seed the current schedule and mark it up to date so the
    // migrations below are skipped.
    await seedData(database);
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  } else {
    // Existing install: apply any pending schedule corrections in place,
    // preserving the user's saved shows (the schedule table references
    // shows.id, which the migrations never change).
    await runMigrations(database);
  }
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  let version = row?.user_version ?? 0;

  if (version < 1) {
    await migrateToV1(database);
    version = 1;
  }

  await database.execAsync(`PRAGMA user_version = ${version};`);
}

// Migration 1: align set times and lineup with the official schedule published
// at madcoolfestival.es/horarios. Corrects 18 revised set times, moves THE
// VACCINES from Saturday (Stage 2) to Wednesday (Stage 3), and adds 11 newly
// announced opener/closer acts. Rows are matched by artist so existing shows
// keep their id, which means anything the user already saved stays saved.
async function migrateToV1(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- ===== Revised set times =====

    -- Wednesday
    UPDATE shows SET end_time='2026-07-08T22:40:00' WHERE artist='THE WAR ON DRUGS';
    UPDATE shows SET start_time='2026-07-08T22:40:00' WHERE artist='MOBY';
    UPDATE shows SET end_time='2026-07-08T23:10:00' WHERE artist='DOGSTAR';
    UPDATE shows SET end_time='2026-07-08T23:30:00' WHERE artist='MADMADMAD';

    -- Thursday
    UPDATE shows SET start_time='2026-07-09T18:50:00' WHERE artist='RENEÉ RAPP';
    UPDATE shows SET end_time='2026-07-09T22:45:00' WHERE artist='LORDE';
    UPDATE shows SET start_time='2026-07-09T22:45:00' WHERE artist='JENNIE';
    UPDATE shows SET start_time='2026-07-09T18:40:00', end_time='2026-07-09T19:55:00' WHERE artist='CMAT';
    UPDATE shows SET start_time='2026-07-09T19:55:00', end_time='2026-07-09T21:35:00' WHERE artist='CHARLIE PUTH';
    UPDATE shows SET start_time='2026-07-09T21:35:00', end_time='2026-07-09T23:10:00' WHERE artist='ZARA LARSSON';
    UPDATE shows SET start_time='2026-07-09T23:10:00', end_time='2026-07-10T00:50:00' WHERE artist='TEDDY SWIMS';
    UPDATE shows SET start_time='2026-07-10T00:50:00' WHERE artist='THE BLAZE dj set';
    UPDATE shows SET end_time='2026-07-10T01:15:00' WHERE artist='FLORENTENES';

    -- Friday
    UPDATE shows SET start_time='2026-07-10T18:55:00', end_time='2026-07-10T20:20:00' WHERE artist='HALSEY';
    UPDATE shows SET start_time='2026-07-10T20:20:00', end_time='2026-07-10T22:05:00' WHERE artist='PIXIES';
    UPDATE shows SET start_time='2026-07-10T22:05:00' WHERE artist='KINGS OF LEON';
    UPDATE shows SET start_time='2026-07-10T19:55:00', end_time='2026-07-10T21:25:00' WHERE artist='HOLLY HUMBERSTONE';
    UPDATE shows SET start_time='2026-07-10T21:25:00', end_time='2026-07-10T23:05:00' WHERE artist='SIGRID';
    UPDATE shows SET start_time='2026-07-10T23:05:00', end_time='2026-07-11T00:45:00' WHERE artist='A PERFECT CIRCLE';
    UPDATE shows SET start_time='2026-07-11T00:45:00' WHERE artist='INTERPOL';
    UPDATE shows SET end_time='2026-07-11T01:05:00' WHERE artist='MY FIRST TIME';

    -- Saturday
    UPDATE shows SET start_time='2026-07-11T18:30:00', end_time='2026-07-11T19:50:00' WHERE artist='JALEN NGONDA';
    UPDATE shows SET start_time='2026-07-11T19:50:00' WHERE artist='THE BLACK CROWES';
    UPDATE shows SET start_time='2026-07-11T20:55:00', end_time='2026-07-11T22:30:00' WHERE artist='MATT BERNINGER';
    UPDATE shows SET end_time='2026-07-12T00:25:00' WHERE artist='OVERPASS';

    -- ===== Relocated act =====
    -- THE VACCINES moved from Saturday / Stage 2 to Wednesday / Stage 3.
    UPDATE shows
      SET stage_id=3, start_time='2026-07-08T23:10:00', end_time='2026-07-09T00:30:00'
      WHERE artist='THE VACCINES';

    -- ===== Newly announced acts =====
    INSERT INTO shows (artist, description, stage_id, start_time, end_time) VALUES
      ('LIENS TRES DANGEREUX', 'Performing live at Mad Cool 2026', 4, '2026-07-08T23:30:00', '2026-07-09T01:00:00'),
      ('CANDELA GOMEZ',        'Performing live at Mad Cool 2026', 4, '2026-07-09T18:35:00', '2026-07-09T20:10:00'),
      ('COLOR',                'Performing live at Mad Cool 2026', 4, '2026-07-10T01:15:00', '2026-07-10T02:00:00'),
      ('LINKA MOJA',           'Performing live at Mad Cool 2026', 2, '2026-07-10T18:40:00', '2026-07-10T19:55:00'),
      ('TAPE VISITORS',        'Performing live at Mad Cool 2026', 4, '2026-07-10T18:35:00', '2026-07-10T20:05:00'),
      ('BABYLON',              'Performing live at Mad Cool 2026', 4, '2026-07-11T01:05:00', '2026-07-11T02:00:00'),
      ('LOS BLODY',            'Performing live at Mad Cool 2026', 5, '2026-07-10T19:20:00', '2026-07-10T20:55:00'),
      ('BAD TOMATO',           'Performing live at Mad Cool 2026', 4, '2026-07-11T18:45:00', '2026-07-11T20:15:00'),
      ('BREAK THE SENSES',     'Performing live at Mad Cool 2026', 5, '2026-07-11T19:30:00', '2026-07-11T21:05:00'),
      ('YULIE',                'Performing live at Mad Cool 2026', 5, '2026-07-12T00:25:00', '2026-07-12T01:15:00'),
      ('KSAL',                 'Performing live at Mad Cool 2026', 5, '2026-07-12T01:15:00', '2026-07-12T02:00:00');
  `);
}

async function seedData(database: SQLite.SQLiteDatabase): Promise<void> {
  // Mad Cool Festival 2026 - Iberdrola Music, Madrid
  // July 8-11, 2026
  // Stages and times extracted from official schedule images at madcoolfestival.es/horarios
  await database.execAsync(`
    INSERT INTO stages (name, location) VALUES
      ('Stage 1 - Region of Madrid', 'Iberdrola Music - Main Area'),
      ('Stage 2 - Orange', 'Iberdrola Music - North Area'),
      ('Stage 3 - The Loop Iberdrola', 'Iberdrola Music - East Area'),
      ('Stage 4 - Mahou Cinco Estrellas', 'Iberdrola Music - South Area'),
      ('Stage 5 - Mahou Reserva', 'Iberdrola Music - West Area');
  `);

  await database.execAsync(`
    INSERT INTO shows (artist, description, stage_id, start_time, end_time) VALUES

      -- ===== WEDNESDAY JULY 8 =====

      -- Stage 1 - Region of Madrid
      ('THE WARNING', 'Mexican rock trio of sisters delivering powerful alt-rock', 1, '2026-07-08T18:55:00', '2026-07-08T20:20:00'),
      ('WOLF ALICE', 'British rock band blending shoegaze, grunge, and pop', 1, '2026-07-08T20:20:00', '2026-07-08T22:00:00'),
      ('FOO FIGHTERS', 'Legendary rock band led by Dave Grohl, known for arena-shaking anthems', 1, '2026-07-08T22:00:00', '2026-07-09T00:30:00'),

      -- Stage 2 - Orange
      ('PALAYE ROYALE', 'Glam-rock trio with raw energy and cinematic style', 2, '2026-07-08T18:35:00', '2026-07-08T19:35:00'),
      ('THE LAST DINNER PARTY', 'Baroque pop quintet with theatrical flair and soaring vocals', 2, '2026-07-08T19:35:00', '2026-07-08T21:00:00'),
      ('THE WAR ON DRUGS', 'Expansive heartland rock with shimmering synths and guitars', 2, '2026-07-08T21:00:00', '2026-07-08T22:40:00'),
      ('MOBY', 'Iconic electronic artist and producer behind Play and 18', 2, '2026-07-08T22:40:00', '2026-07-09T00:30:00'),

      -- Stage 3 - The Loop Iberdrola
      ('JEHNNY BETH', 'Savages frontwoman with fierce solo post-punk performances', 3, '2026-07-08T18:55:00', '2026-07-08T20:10:00'),
      ('THE WAR AND TREATY', 'Husband-wife duo with explosive soul, gospel, and roots music', 3, '2026-07-08T20:10:00', '2026-07-08T21:35:00'),
      ('DOGSTAR', 'Rock band featuring Keanu Reeves on bass', 3, '2026-07-08T21:35:00', '2026-07-08T23:10:00'),
      ('THE VACCINES', 'British indie-rock with punchy guitar-pop hooks', 3, '2026-07-08T23:10:00', '2026-07-09T00:30:00'),

      -- Stage 4 - Mahou Cinco Estrellas
      ('HOTWAX', 'Fierce punk-rock trio from Brighton', 4, '2026-07-08T18:35:00', '2026-07-08T20:10:00'),
      ('VILLANELLE', 'Atmospheric indie rock with lush soundscapes', 4, '2026-07-08T20:10:00', '2026-07-08T21:50:00'),
      ('MADMADMAD', 'Dutch electronic post-punk group with driving beats', 4, '2026-07-08T21:50:00', '2026-07-08T23:30:00'),
      ('LIENS TRES DANGEREUX', 'Performing live at Mad Cool 2026', 4, '2026-07-08T23:30:00', '2026-07-09T01:00:00'),

      -- Stage 5 - Mahou Reserva
      ('HOT MILK', 'High-energy pop-punk and alt-rock from Manchester', 5, '2026-07-08T19:20:00', '2026-07-08T21:00:00'),
      ('BIGGER SPLASH', 'Up-and-coming indie act', 5, '2026-07-08T21:00:00', '2026-07-08T22:45:00'),
      ('HOONINE', 'Emerging artist with genre-blending sound', 5, '2026-07-08T22:45:00', '2026-07-09T00:15:00'),

      -- ===== THURSDAY JULY 9 =====

      -- Stage 1 - Region of Madrid
      ('RENEÉ RAPP', 'Broadway and pop breakout star with bold, confessional anthems', 1, '2026-07-09T18:50:00', '2026-07-09T20:30:00'),
      ('LORDE', 'New Zealand singer-songwriter known for Royals and Melodrama', 1, '2026-07-09T20:30:00', '2026-07-09T22:45:00'),
      ('JENNIE', 'BLACKPINK member and global K-pop solo star', 1, '2026-07-09T22:45:00', '2026-07-10T00:30:00'),
      ('FLORENCE + THE MACHINE', 'Florence Welch delivers powerful vocals and orchestral indie rock', 1, '2026-07-10T00:30:00', '2026-07-10T02:00:00'),

      -- Stage 2 - Orange
      ('CMAT', 'Irish country-pop artist with witty, heartfelt songwriting', 2, '2026-07-09T18:40:00', '2026-07-09T19:55:00'),
      ('CHARLIE PUTH', 'Grammy-nominated pop artist and producer with perfect pitch', 2, '2026-07-09T19:55:00', '2026-07-09T21:35:00'),
      ('ZARA LARSSON', 'Swedish pop powerhouse with global chart-topping hits', 2, '2026-07-09T21:35:00', '2026-07-09T23:10:00'),
      ('TEDDY SWIMS', 'Powerhouse vocalist blending R&B, soul, and pop', 2, '2026-07-09T23:10:00', '2026-07-10T00:50:00'),
      ('THE BLAZE dj set', 'French electronic duo known for emotional visuals and deep house', 2, '2026-07-10T00:50:00', '2026-07-10T02:00:00'),

      -- Stage 3 - The Loop Iberdrola
      ('AMRITA', 'Electronic artist with hypnotic rhythms', 3, '2026-07-09T19:30:00', '2026-07-09T20:25:00'),
      ('YUNG PRADO', 'Spanish electronic producer and DJ', 3, '2026-07-09T20:25:00', '2026-07-09T21:40:00'),
      ('PALMS TRAX', 'Berlin-based DJ blending house, disco, and Italo influences', 3, '2026-07-09T21:40:00', '2026-07-09T23:15:00'),
      ('BOYS NOIZE', 'German DJ and producer known for aggressive electro and techno', 3, '2026-07-09T23:15:00', '2026-07-10T01:00:00'),

      -- Stage 4 - Mahou Cinco Estrellas
      ('CANDELA GOMEZ', 'Performing live at Mad Cool 2026', 4, '2026-07-09T18:35:00', '2026-07-09T20:10:00'),
      ('CHLOE SLATER', 'Indie pop artist with dreamy vocals', 4, '2026-07-09T20:10:00', '2026-07-09T21:50:00'),
      ('SADIE JEAN', 'Rising pop singer-songwriter with viral TikTok hits', 4, '2026-07-09T21:50:00', '2026-07-09T23:35:00'),
      ('FLORENTENES', 'Emerging indie rock band', 4, '2026-07-09T23:35:00', '2026-07-10T01:15:00'),
      ('COLOR', 'Performing live at Mad Cool 2026', 4, '2026-07-10T01:15:00', '2026-07-10T02:00:00'),

      -- Stage 5 - Mahou Reserva
      ('ZIMMER90', 'Electronic producer with retro-futuristic soundscapes', 5, '2026-07-09T19:20:00', '2026-07-09T21:00:00'),
      ('SON MIEUX', 'Dutch indie-pop act with soulful grooves', 5, '2026-07-09T21:00:00', '2026-07-09T22:40:00'),
      ('LA PALOMA', 'Spanish alternative artist', 5, '2026-07-09T22:40:00', '2026-07-10T00:30:00'),
      ('FROST CHILDREN', 'Experimental hyperpop duo pushing genre boundaries', 5, '2026-07-10T00:30:00', '2026-07-10T02:00:00'),

      -- ===== FRIDAY JULY 10 =====

      -- Stage 1 - Region of Madrid
      ('HALSEY', 'Multi-platinum pop-rock artist with a bold artistic vision', 1, '2026-07-10T18:55:00', '2026-07-10T20:20:00'),
      ('PIXIES', 'Legendary alt-rock pioneers behind Where Is My Mind?', 1, '2026-07-10T20:20:00', '2026-07-10T22:05:00'),
      ('KINGS OF LEON', 'Southern rock royalty known for Use Somebody and Sex on Fire', 1, '2026-07-10T22:05:00', '2026-07-11T00:25:00'),
      ('TWENTY ONE PILOTS', 'Genre-bending duo blending rock, hip-hop, and electropop', 1, '2026-07-11T00:25:00', '2026-07-11T02:00:00'),

      -- Stage 2 - Orange
      ('LINKA MOJA', 'Performing live at Mad Cool 2026', 2, '2026-07-10T18:40:00', '2026-07-10T19:55:00'),
      ('HOLLY HUMBERSTONE', 'British indie-pop artist with emotionally raw songwriting', 2, '2026-07-10T19:55:00', '2026-07-10T21:25:00'),
      ('SIGRID', 'Norwegian pop singer with soaring vocals and anthemic tracks', 2, '2026-07-10T21:25:00', '2026-07-10T23:05:00'),
      ('A PERFECT CIRCLE', 'Alt-metal supergroup led by Maynard James Keenan', 2, '2026-07-10T23:05:00', '2026-07-11T00:45:00'),
      ('INTERPOL', 'NYC post-punk revivalists with dark, atmospheric rock', 2, '2026-07-11T00:45:00', '2026-07-11T02:00:00'),

      -- Stage 3 - The Loop Iberdrola
      ('MAESIC', 'Electronic producer with lush, cinematic soundscapes', 3, '2026-07-10T19:00:00', '2026-07-10T19:55:00'),
      ('WEVAL', 'Dutch electronic duo crafting atmospheric, melodic techno', 3, '2026-07-10T19:55:00', '2026-07-10T21:10:00'),
      ('SWIMMING PAUL', 'Electronic artist with dreamy, synth-driven sound', 3, '2026-07-10T21:10:00', '2026-07-10T22:45:00'),
      ('BUNT.', 'Folk-electronic producer blending banjo with dance beats', 3, '2026-07-10T22:45:00', '2026-07-11T00:20:00'),
      ('POLO & PAN dj set', 'French electronic duo serving tropical house and disco', 3, '2026-07-11T00:20:00', '2026-07-11T02:00:00'),

      -- Stage 4 - Mahou Cinco Estrellas
      ('TAPE VISITORS', 'Performing live at Mad Cool 2026', 4, '2026-07-10T18:35:00', '2026-07-10T20:05:00'),
      ('MIDNIGHT GENERATION', 'High-energy rock act', 4, '2026-07-10T20:05:00', '2026-07-10T21:45:00'),
      ('CLIFFORDS', 'Indie rock band with catchy hooks', 4, '2026-07-10T21:45:00', '2026-07-10T23:25:00'),
      ('MY FIRST TIME', 'Up-and-coming indie act', 4, '2026-07-10T23:25:00', '2026-07-11T01:05:00'),
      ('BABYLON', 'Performing live at Mad Cool 2026', 4, '2026-07-11T01:05:00', '2026-07-11T02:00:00'),

      -- Stage 5 - Mahou Reserva
      ('LOS BLODY', 'Performing live at Mad Cool 2026', 5, '2026-07-10T19:20:00', '2026-07-10T20:55:00'),
      ('KAREN DIÓ', 'Spanish alternative pop artist', 5, '2026-07-10T20:55:00', '2026-07-10T22:35:00'),
      ('RIO KOSTA', 'Emerging artist with genre-blending sound', 5, '2026-07-10T22:35:00', '2026-07-11T00:15:00'),
      ('USTED SEÑALEMELO', 'Argentine indie-pop duo with infectious rhythms', 5, '2026-07-11T00:15:00', '2026-07-11T02:00:00'),

      -- ===== SATURDAY JULY 11 =====

      -- Stage 1 - Region of Madrid
      ('JALEN NGONDA', 'Retro soul and Motown-inspired singer-songwriter', 1, '2026-07-11T18:30:00', '2026-07-11T19:50:00'),
      ('THE BLACK CROWES', 'Southern rock and blues revival with swagger and soul', 1, '2026-07-11T19:50:00', '2026-07-11T22:00:00'),
      ('NICK CAVE & THE BAD SEEDS', 'Dark, poetic rock from one of music''s greatest storytellers', 1, '2026-07-11T22:00:00', '2026-07-12T00:40:00'),
      ('PULP', 'Britpop legends led by Jarvis Cocker, known for Common People', 1, '2026-07-12T00:40:00', '2026-07-12T02:00:00'),

      -- Stage 2 - Orange
      ('MATT BERNINGER', 'The National frontman with brooding baritone solo work', 2, '2026-07-11T20:55:00', '2026-07-11T22:30:00'),
      ('KASABIAN', 'British indie rock with massive festival energy', 2, '2026-07-11T22:30:00', '2026-07-12T00:05:00'),
      ('DAVID BYRNE', 'Talking Heads icon and avant-garde performance visionary', 2, '2026-07-12T00:05:00', '2026-07-12T02:00:00'),

      -- Stage 3 - The Loop Iberdrola
      ('LUXI VILLAR', 'Spanish electronic DJ and producer', 3, '2026-07-11T18:50:00', '2026-07-11T20:05:00'),
      ('aerea', 'Electronic artist with immersive soundscapes', 3, '2026-07-11T20:05:00', '2026-07-11T21:40:00'),
      ('NINA KRAVIZ', 'Russian DJ and producer known for hypnotic acid techno', 3, '2026-07-11T21:40:00', '2026-07-11T23:15:00'),
      ('RICHIE HAWTIN', 'Techno pioneer and minimal electronic master', 3, '2026-07-11T23:15:00', '2026-07-12T01:30:00'),

      -- Stage 4 - Mahou Cinco Estrellas
      ('BAD TOMATO', 'Performing live at Mad Cool 2026', 4, '2026-07-11T18:45:00', '2026-07-11T20:15:00'),
      ('PERSIA HOLDER', 'Soulful vocalist with R&B and neo-soul vibes', 4, '2026-07-11T20:15:00', '2026-07-11T21:55:00'),
      ('THE REYTONS', 'Sheffield indie rock with working-class anthems', 4, '2026-07-11T21:55:00', '2026-07-11T23:35:00'),
      ('SUPERMODEL', 'Alt-pop act with glamorous, genre-bending style', 4, '2026-07-11T23:35:00', '2026-07-12T01:00:00'),

      -- Stage 5 - Mahou Reserva
      ('BREAK THE SENSES', 'Performing live at Mad Cool 2026', 5, '2026-07-11T19:30:00', '2026-07-11T21:05:00'),
      ('TTSSFU', 'High-energy punk and alternative act', 5, '2026-07-11T21:05:00', '2026-07-11T22:45:00'),
      ('OVERPASS', 'Indie rock band with atmospheric sound', 5, '2026-07-11T22:45:00', '2026-07-12T00:25:00'),
      ('YULIE', 'Performing live at Mad Cool 2026', 5, '2026-07-12T00:25:00', '2026-07-12T01:15:00'),
      ('KSAL', 'Performing live at Mad Cool 2026', 5, '2026-07-12T01:15:00', '2026-07-12T02:00:00');
  `);
}
