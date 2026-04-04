# Music Festival Scheduler

A React Native mobile app for browsing music festival lineups, selecting shows, and building a personalized schedule with date, time, and venue details. The app runs fully offline using an embedded SQLite database — no server required.

## Features

- **Browse Lineup** — View all scheduled performances organized by day, with artist details, set times, and stage locations.
- **Build Your Schedule** — Tap to add or remove shows from your personal schedule.
- **Day-by-Day Navigation** — Filter the lineup by festival day with a quick day selector.
- **My Schedule View** — See all your selected shows grouped by day with stage/location info for easy navigation at the festival.
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
│       └── schedule.tsx    # My Schedule screen
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

## Database

The app uses **expo-sqlite** with WAL mode for performance. On first launch, the database is created and seeded with sample festival data (5 stages, 21 shows over 3 days). The schema includes:

- **stages** — Festival stage names and locations
- **shows** — Artist performances with times and stage references
- **schedule** — User's selected shows (references the shows table)

## License

MIT
