# Music Festival Scheduler

A React Native mobile app for Mad Cool Festival 2026 (Madrid, July 8-11). Browse the full lineup, build a personalized schedule, listen to artists on YouTube Music, and view the festival map — all fully offline using an embedded SQLite database.

## Features

- **Browse Lineup** — View all 72 performances across 5 stages, organized by day.
- **Build Your Schedule** — Tap to add or remove shows from your personal schedule.
- **Day-by-Day Navigation** — Filter the lineup by festival day with a quick day selector.
- **My Schedule View** — See all your selected shows grouped by day with stage/location info.
- **YouTube Music Integration** — Tap to listen to any artist on YouTube Music.
- **Festival Map** — Pinch-to-zoom official venue map for navigating the festival grounds.
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
│   │   └── DaySelector.tsx
│   ├── constants/
│   │   └── theme.ts        # Color palette
│   ├── db/
│   │   ├── database.ts     # SQLite setup, schema, and seed data
│   │   └── queries.ts      # Data access functions
│   └── types/
│       └── index.ts        # TypeScript interfaces
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

The app uses **expo-sqlite** with WAL mode for performance. On first launch, the database is created and seeded with the official Mad Cool 2026 schedule (5 stages, 72 shows over 4 days). Set times were extracted from the official schedule at [madcoolfestival.es/horarios](https://madcoolfestival.es/horarios). The schema includes:

- **stages** — Festival stage names and locations
- **shows** — Artist performances with times and stage references
- **schedule** — User's selected shows (references the shows table)

## License

MIT
