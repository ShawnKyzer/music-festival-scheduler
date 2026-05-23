# Feature Specification: In-App APK Update Button

**Feature Branch**: `002-apk-update-button`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "create a update button to pull latest apk release from github and install"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check for and Install Latest Update (Priority: P1)

A user opens the app and wants to know if a newer version is available. They tap an "Update" button, the app fetches the latest APK release from GitHub, downloads it, and prompts the device to install it.

**Why this priority**: This is the core value of the feature — without it, the entire update flow doesn't exist. It is the single most critical slice.

**Independent Test**: Can be fully tested by tapping the update button, observing a download progress indicator, and seeing the system install prompt appear. Delivers the complete end-to-end update experience.

**Acceptance Scenarios**:

1. **Given** the user is on the app's settings or home screen, **When** they tap the "Check for Updates" / "Update" button, **Then** the app fetches the latest release metadata from GitHub and compares it to the currently installed version.
2. **Given** a newer version exists, **When** the comparison completes, **Then** the app displays the new version number and a confirmation prompt to download and install.
3. **Given** the user confirms the update, **When** the download completes, **Then** the device OS install prompt appears and the user can install the new APK.
4. **Given** the user is already on the latest version, **When** they tap the update button, **Then** the app displays a message confirming they are up to date.

---

### User Story 2 - Update Progress and Error Feedback (Priority: P2)

While a download is in progress, the user can see real-time progress and receive clear feedback if anything goes wrong (no internet, GitHub unavailable, download failure).

**Why this priority**: Silent failures or indefinite spinners erode trust. Meaningful feedback is important but not a blocker for the core flow.

**Independent Test**: Can be tested by triggering a download under degraded network conditions and confirming that progress is visible and error messages are human-readable.

**Acceptance Scenarios**:

1. **Given** a download is in progress, **When** the user views the update UI, **Then** a progress indicator shows download percentage or activity.
2. **Given** the device has no internet connection, **When** the user taps the update button, **Then** a clear error message is shown (e.g., "No internet connection. Please try again.").
3. **Given** the GitHub API or download URL is unreachable, **When** the fetch fails, **Then** a descriptive error message is shown and the user can dismiss or retry.

---

### Edge Cases

- What happens when the GitHub rate limit is hit for unauthenticated API requests?
- What happens if the downloaded file is incomplete or corrupted?
- What if the user taps the update button multiple times rapidly (duplicate downloads)?
- What if the device denies the install prompt (e.g., "Install from unknown sources" is disabled)?
- What if the app is running on a platform that does not support side-loading (e.g., iOS or web)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a visible "Check for Updates" button accessible from within the app (e.g., settings screen or about section).
- **FR-002**: The app MUST query the GitHub Releases API to retrieve the latest published release for this repository.
- **FR-003**: The app MUST compare the fetched release version against the currently installed app version.
- **FR-004**: The app MUST display the latest version number and a download/install prompt when a newer version is available.
- **FR-005**: The app MUST display a "You are up to date" message when no newer version is available.
- **FR-006**: The app MUST download the APK asset from the GitHub release when the user confirms the update.
- **FR-007**: The app MUST display a progress indicator during the download.
- **FR-008**: The app MUST trigger the device's native OS install flow once the APK download is complete.
- **FR-009**: The app MUST show a human-readable error message if the update check or download fails.
- **FR-010**: The app MUST prevent duplicate simultaneous download attempts (debounce rapid taps).

### Key Entities

- **Release**: A GitHub release record — version tag, published date, APK asset download URL, release notes.
- **Installed Version**: The current version of the app as reported by the device/runtime.
- **APK Asset**: The binary `.apk` file attached to the GitHub release, used for installation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate an update check and receive a result (up-to-date or new version available) within 5 seconds under normal network conditions.
- **SC-002**: Users can complete a full update flow (check → download → install prompt) without leaving the app until the OS install dialog appears.
- **SC-003**: 100% of failed update attempts (network error, API failure, corrupt download) surface a user-facing error message rather than silently failing.
- **SC-004**: The update button is discoverable within 2 taps from the main screen.

## Assumptions

- The app is distributed as an Android APK; iOS and web platforms are out of scope for this feature.
- The GitHub repository is public, so the Releases API can be queried without authentication (subject to rate limits).
- The APK asset on each GitHub release is named consistently enough to be identified programmatically (e.g., by file extension `.apk` or a naming convention).
- The device has "Install from unknown sources" enabled or the user is prompted to enable it by the OS — this is outside the app's control.
- Version comparison uses semantic versioning (e.g., `v1.2.3`); the currently installed version is available at runtime via the app's build metadata.
- The release notes / changelog display is out of scope for this spec (display of version number only is sufficient).
