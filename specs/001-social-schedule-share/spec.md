# Feature Specification: Social Schedule Share

**Feature Branch**: `001-social-schedule-share`
**Created**: 2026-04-25
**Status**: Draft
**Input**: User description: "Add social sharing to the Music Festival Scheduler so users can share their personal schedule with friends. Users should be able to generate a shareable image of their schedule (showing all selected shows grouped by day with artist names, times, and stages) and share it via the device's native share sheet (WhatsApp, Instagram Stories, iMessage, etc.). The shared image should be branded with the Mad Cool Festival 2026 look and feel."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share Full Schedule as Image (Priority: P1)

A user has built their personal Mad Cool schedule over several sessions. They want to share it with a friend so they can compare lineups and meet up at shows. The user opens the My Schedule screen, taps a "Share" button, and the app generates a branded image showing all their selected shows grouped by day. The device's native share sheet appears, allowing the user to send the image via WhatsApp, iMessage, Instagram Stories, or any other installed app that accepts images.

**Why this priority**: This is the core value proposition — without image generation and the share sheet, there is no social sharing feature at all. This single story delivers the complete end-to-end sharing flow.

**Independent Test**: Can be fully tested by adding at least one show to the schedule, tapping the Share button on the My Schedule screen, and verifying that a branded image is generated and the native share sheet opens with the image ready to send.

**Acceptance Scenarios**:

1. **Given** a user has 3+ shows in their schedule across multiple days, **When** they tap the Share button on the My Schedule screen, **Then** the app generates an image showing all selected shows grouped by day with artist name, time, and stage for each show.
2. **Given** the image has been generated, **When** the share sheet appears, **Then** the user can select any installed sharing app (WhatsApp, iMessage, Instagram Stories, etc.) and the image is sent successfully.
3. **Given** a user has shows in their schedule, **When** the image is generated, **Then** it displays the Mad Cool Festival 2026 branding (dark background, purple accents, festival name/logo, and event dates).

---

### User Story 2 - Share Single Day Schedule (Priority: P2)

A user only wants to share their schedule for a specific day rather than the entire festival. While viewing the My Schedule screen filtered to a particular day (e.g., "Friday July 10"), they tap a Share button and receive a branded image containing only that day's shows.

**Why this priority**: Sharing a single day is more practical for coordinating meetups on a specific date and produces a more focused, readable image. However, it depends on the same image-generation and share-sheet infrastructure as P1, so it builds incrementally on the MVP.

**Independent Test**: Can be tested by selecting shows across multiple days, navigating to a single day view on the schedule screen, tapping Share, and verifying the generated image contains only that day's shows.

**Acceptance Scenarios**:

1. **Given** a user is viewing their schedule filtered to a single day, **When** they tap the Share button, **Then** the generated image contains only shows from that specific day.
2. **Given** a user has no shows for the currently selected day, **When** they tap the Share button, **Then** the app displays a message indicating there are no shows to share for that day and does not generate an image.

---

### User Story 3 - Preview Image Before Sharing (Priority: P3)

Before sending, the user wants to see what the shared image will look like. After tapping Share, a full-screen preview of the generated image appears with options to confirm and open the share sheet, or cancel and go back.

**Why this priority**: While not essential for the sharing flow to function, a preview step reduces user anxiety about what they are sending and prevents accidental shares of incomplete or unexpected content.

**Independent Test**: Can be tested by tapping the Share button and verifying a preview modal appears showing the rendered image with Confirm and Cancel actions, without the share sheet opening immediately.

**Acceptance Scenarios**:

1. **Given** the user taps the Share button, **When** the image is generated, **Then** a full-screen preview modal displays the image before the share sheet opens.
2. **Given** the preview modal is visible, **When** the user taps "Share", **Then** the native share sheet opens with the previewed image.
3. **Given** the preview modal is visible, **When** the user taps "Cancel" or swipes back, **Then** the modal closes and no share sheet is presented.

---

### Edge Cases

- What happens when the user has zero shows in their schedule and taps Share? The app MUST display a message (e.g., "Add some shows first!") and not attempt to generate an image.
- What happens when image generation fails (e.g., out of memory on a device with many shows)? The app MUST display an error message and not crash.
- What happens when the user cancels the share sheet without selecting an app? The app MUST return to its previous state gracefully.
- What happens when a user has a very large schedule (30+ shows)? The image MUST remain legible, potentially spanning a tall vertical layout rather than truncating content.
- What happens on a device that does not support the share sheet (e.g., an emulator without share targets)? The app MUST handle the failure gracefully and inform the user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The My Schedule screen MUST display a "Share" button that is visible whenever the user has at least one show in their schedule.
- **FR-002**: Tapping the Share button MUST generate a raster image (PNG) of the user's schedule content.
- **FR-003**: The generated image MUST display all scheduled shows grouped by festival day, with each show showing artist name, start time, end time, and stage name.
- **FR-004**: The generated image MUST be styled with Mad Cool Festival 2026 branding: dark background (`#121212`), purple accent colors (`#6C3CE1`, `#A78BFA`), white text, and the festival name "Mad Cool 2026" with dates "July 8–11, Madrid".
- **FR-005**: After image generation, the app MUST invoke the device's native share sheet with the image attached.
- **FR-006**: The Share button MUST be hidden or disabled when the user's schedule is empty.
- **FR-007**: The share image MUST be generated entirely on-device without requiring a network connection (consistent with the offline-first constitution principle).
- **FR-008**: When sharing a single day's schedule (P2), the image MUST include only shows from the selected day and display the day/date as a heading.
- **FR-009**: The image MUST be sized appropriately for mobile sharing — [NEEDS CLARIFICATION: target a portrait aspect ratio optimized for Instagram Stories (1080×1920) or a more compact square/standard format? A portrait layout is assumed as the default.]

### Key Entities *(include if feature involves data)*

- **ShareableScheduleImage**: A rendered raster image (PNG) representing the user's selected shows. Attributes: image data, dimensions, day filter (all days or specific day), generation timestamp.
- **ScheduleEntry** (existing): The persisted user selections from the `schedule` table, joined with show and stage details. This entity is read-only for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from tapping the Share button to having the native share sheet open with the branded image in under 3 seconds on a mid-range device.
- **SC-002**: The generated image is visually legible and correctly displays all scheduled shows for 100% of valid schedule states (1 to 72 shows).
- **SC-003**: The sharing flow works fully offline — no network requests are made during image generation or share-sheet invocation.
- **SC-004**: 95% of testers can complete the share flow (tap Share → select app → send) on their first attempt without guidance.
- **SC-005**: The generated image correctly reflects the Mad Cool 2026 brand (dark theme, purple accents, festival title and dates) as judged by visual review.

## Assumptions

- The user has at least one show in their schedule before attempting to share. Empty-state handling is a guard, not a primary flow.
- The generated image is a static PNG raster — animated or interactive formats are out of scope.
- The native share sheet is provided by the OS; the app does not need to implement direct integrations with WhatsApp, Instagram, etc.
- The image is generated entirely on-device; no server-side rendering is involved.
- The festival branding uses the existing color palette from `src/constants/theme.ts` and the text "Mad Cool 2026" — no official logo asset is available, so text-based branding is sufficient.
- Instagram Stories formatting (1080×1920 portrait) is assumed as the default image size unless clarified otherwise.
