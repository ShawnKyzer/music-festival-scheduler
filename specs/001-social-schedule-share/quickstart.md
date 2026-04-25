# Quickstart: Social Schedule Share

**Date**: 2026-04-25
**Branch**: `001-social-schedule-share`

## Prerequisites

- Node.js v18+
- Expo CLI (`npx expo`)
- Android device or emulator (primary) / iOS Simulator (secondary)

## Setup

```bash
git checkout 001-social-schedule-share
npm install
```

This installs the two new dependencies:
- `expo-sharing` — native share sheet
- `react-native-view-shot` — view-to-image capture

## Run

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator.

## Test the Share Flow

1. Open the **Lineup** tab
2. Tap **+** on a few shows to add them to your schedule
3. Switch to the **My Schedule** tab
4. Tap the **Share** button (top-right)
5. A branded image is generated showing your selected shows
6. The device's share sheet appears — select any app to send

## Test Single Day Share (P2)

1. On the My Schedule screen, filter to a specific day
2. Tap the Share button
3. Verify the image contains only that day's shows

## Test Preview (P3)

1. On the My Schedule screen, tap Share
2. A full-screen preview modal should appear
3. Tap "Share" to proceed to the share sheet, or "Cancel" to dismiss

## Test Edge Cases

- **Empty schedule**: Share button should be hidden/disabled
- **Cancel share sheet**: App returns to previous state
- **Large schedule (20+ shows)**: Image should be tall but legible

## Run Data Layer Tests

```bash
npx jest src/db/__tests__/shareHistory.test.ts
```

Expected: All share history CRUD tests pass against in-memory SQLite.

## Rebuild APK (if testing on physical device)

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
```
