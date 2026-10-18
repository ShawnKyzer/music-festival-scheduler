# Music Festival Scheduler

A React Native mobile app for planning your festival weekend. Browse the full lineup, build a personalized schedule, listen to artists on YouTube Music, and view the festival map — all fully offline using an embedded SQLite database.

Bundled festivals (the most recently added one opens by default):

| Festival | Dates | Venue | Data |
|---|---|---|---|
| Primavera Sound 2027 | June 2–6, 2027 | Parc del Fòrum, Barcelona | 152 announced artists; stages and set times TBA |
| Mad Cool 2026 | July 8–11, 2026 | Iberdrola Music, Madrid | 83 performances across 5 stages with set times |

## Features

- **Multiple Festivals** — Switch festivals from the header; each keeps its own lineup, schedule, and map.
- **Browse Lineup** — View every announced performance, organized by day once set times are published.
- **Build Your Schedule** — Tap to add or remove shows from your personal schedule.
- **Day-by-Day Navigation** — Filter the lineup by festival day with a quick day selector.
- **My Schedule View** — See all your selected shows grouped by day with stage/location info; shows without a published set time are listed under "Set Time TBA".
- **YouTube Music Integration** — Tap to listen to any artist on YouTube Music.
- **Festival Map** — Pinch-to-zoom official venue map, when the festival has published one.
- **Fully Offline** — All data is stored locally in SQLite. No internet connection or backend server needed.

## Tech Stack

- **React Native** via [Expo](https://expo.dev) (SDK 54)
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **expo-sqlite** for embedded SQLite database
- **Expo Vector Icons** (Ionicons) for UI icons

## Project Structure

```
music-festival-scheduler/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout (Stack navigator)
│   └── (tabs)/             # Tab navigator
│       ├── _layout.tsx     # Tab bar configuration
│       ├── index.tsx       # Lineup screen
│       ├── schedule.tsx    # My Schedule screen
│       └── map.tsx         # Festival map screen
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ShowCard.tsx
│   │   ├── DaySelector.tsx
│   │   └── FestivalSwitcher.tsx
│   ├── constants/
│   │   └── theme.ts        # Color palette
│   ├── context/
│   │   └── FestivalContext.tsx  # Selected festival (defaults to newest)
│   ├── db/
│   │   ├── database.ts     # SQLite setup, schema, migrations, and seed data
│   │   ├── queries.ts      # Data access functions (scoped by festival)
│   │   └── seeds/          # Scraped lineups inserted by migrations
│   └── types/
│       └── index.ts        # TypeScript interfaces
├── scripts/
│   └── scrape-primavera.mjs  # Regenerates a Primavera Sound seed module
├── app.json                # Expo configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- iOS Simulator (macOS) or Android Emulator, or the [Expo Go](https://expo.dev/go) app on a physical device

### Install & Run

```bash
# Clone the repository
git clone https://github.com/ShawnKyzer/music-festival-scheduler.git
cd music-festival-scheduler

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go (Android) or use the Camera app (iOS) to open on a physical device.

### Build APK (Android)

To build a standalone APK you can sideload onto an Android device:

```bash
# Prerequisites: JDK 17 and Android SDK (or Android Studio)

git clone https://github.com/ShawnKyzer/music-festival-scheduler.git
cd music-festival-scheduler
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`. Transfer it to your phone and install.

## Database

The app uses **expo-sqlite** with WAL mode for performance. On first launch, the database is created and seeded with every bundled festival. Existing installs are migrated in place (see `PRAGMA user_version` in `database.ts`) so adding a festival or updating a schedule never wipes a user's saved shows. The schema includes:

- **festivals** — Name, venue, city, and dates; the highest id is the default festival
- **stages** — Stage names and locations, per festival
- **shows** — Artist performances per festival; stage and set times are null until published
- **schedule** — User's selected shows (references the shows table)

Data sources:

- Mad Cool 2026 set times were extracted from the official schedule at [madcoolfestival.es/horarios](https://madcoolfestival.es/horarios).
- The Primavera Sound 2027 lineup was scraped from [primaverasound.com](https://www.primaverasound.com/es/barcelona/lineup) with `node scripts/scrape-primavera.mjs`, which writes `src/db/seeds/primavera2027.ts`. Seeds are inserted by a migration exactly once, so when the timetable is published, ship a new migration that updates rows by artist instead of editing an already-released seed.

### Adding a festival

1. Add a seed module under `src/db/seeds/`.
2. Add a migration in `database.ts` that inserts the festival row, its stages, and its shows, then bump `user_version`.
3. Optionally add its venue map to `MAPS_BY_FESTIVAL` in `app/(tabs)/map.tsx`.

The database tests in `src/db/__tests__/festivals.test.ts` run against a real SQLite engine via `node:sqlite`, which needs Node.js 22.5+.

## License

MIT
