# Research: Social Schedule Share

**Date**: 2026-04-25
**Branch**: `001-social-schedule-share`

## R1: Image Capture Library

**Decision**: Use `react-native-view-shot` v4.x with `captureRef()`

**Rationale**: The only mature, maintained library for capturing React
Native view hierarchies as raster images. Works on both Android and
iOS. Captures any RN `<View>` ref as PNG/JPG to a temp file or
base64 string. No canvas, no WebView, pure native rendering.

**Key API**:
```ts
import { captureRef } from 'react-native-view-shot';

const uri = await captureRef(viewRef, {
  format: 'png',
  quality: 1.0,
  result: 'tmpfile',  // returns file:// URI
});
```

- The target view MUST have `collapsable={false}` on Android.
- `width`/`height` options can be used to set output resolution.
- For tall content (many shows), the captured view can exceed the
  screen height — `captureRef` captures the full view, not just the
  visible viewport.

**Alternatives considered**:
- `expo-media-library` screenshot: Only captures visible screen, not
  off-screen content. Rejected.
- `html-to-image` / WebView: Requires embedding a WebView, violates
  the user's "no canvas or web views" constraint. Rejected.
- `react-native-canvas`: Unmaintained, requires manual drawing API.
  Rejected.

## R2: Sharing Library

**Decision**: Use `expo-sharing` (~13.0, Expo SDK-aligned)

**Rationale**: First-party Expo module that invokes the OS share
sheet. Accepts a local file URI and opens the native action sheet.
No network required. Supports Android and iOS out of the box.

**Key API**:
```ts
import * as Sharing from 'expo-sharing';

if (await Sharing.isAvailableAsync()) {
  await Sharing.shareAsync(fileUri, {
    mimeType: 'image/png',
    dialogTitle: 'Share your Mad Cool schedule',
  });
}
```

- `isAvailableAsync()` MUST be checked before calling `shareAsync()`
  to gracefully handle emulators or restricted environments.
- The file URI from `captureRef` (tmpfile result) is directly
  compatible with `shareAsync`.

**Alternatives considered**:
- `react-native-share`: More features but adds a third-party native
  dependency. `expo-sharing` is already part of the Expo SDK, aligning
  with Principle III (Minimal Dependencies). Rejected.

## R3: Image Aspect Ratio (FR-009 Resolution)

**Decision**: Portrait layout, 1080px wide, dynamic height

**Rationale**: Instagram Stories uses 1080×1920, but a fixed 1920
height would waste space for small schedules or clip large ones. A
1080px-wide portrait with dynamic height accommodates 1–72 shows
without truncation. Most mobile sharing apps handle variable-height
images well. WhatsApp, iMessage, and Instagram all accept standard
PNG images regardless of exact aspect ratio.

**Implementation**: Set `width: 1080` in `captureRef` options. Let
height be determined by the React Native layout engine based on
content. The `ShareableSchedule` component renders all shows, and
`captureRef` captures the full height.

## R4: Share History Storage

**Decision**: Add a `share_history` table to the existing SQLite
database (`madcool2026v2.db`)

**Rationale**: The user requested share history in SQLite. This
follows the existing pattern of schema creation in
`src/db/database.ts` and query functions in `src/db/queries.ts`.
The table records each share event with a timestamp and filter used
(all days vs specific day) for potential future analytics or
"last shared" display.

**Alternatives considered**:
- AsyncStorage: Simpler but violates the project's SQLite-only
  storage pattern. Rejected.
- No history at all: User explicitly requested it. Rejected.

## R5: Off-Screen Rendering Strategy

**Decision**: Render `ShareableSchedule` as an absolute-positioned,
off-screen React Native view (positioned off-viewport), then
capture with `captureRef`.

**Rationale**: `react-native-view-shot` requires the view to be
mounted in the component tree (it must exist in the native view
hierarchy). Positioning it off-screen (`position: 'absolute',
left: -9999`) means it's rendered by the native layout engine but
invisible to the user. This avoids flash-of-content and lets us
use standard RN `<View>`, `<Text>`, and `<StyleSheet>` for layout.

**Alternatives considered**:
- Render inline then capture: User would see the capture layout
  flash on screen. Bad UX. Rejected.
- Render in a Modal: Adds complexity and flicker. Rejected.
