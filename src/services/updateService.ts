import type {
  GitHubRelease,
  GitHubReleaseAsset,
  UpdateCheckResult,
} from '../types';

const RELEASES_URL =
  'https://api.github.com/repos/shawnkyzer/music-festival-scheduler/releases/latest';

export function normalizeVersion(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

export function findApkAsset(release: GitHubRelease): GitHubReleaseAsset | null {
  return release.assets.find((a) => a.name.endsWith('.apk')) ?? null;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult> {
  let response: Response;
  try {
    response = await fetch(RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    return {
      status: 'error',
      latestVersion: null,
      downloadUrl: null,
      error: 'No internet connection. Please try again.',
    };
  }

  if (!response.ok) {
    return {
      status: 'error',
      latestVersion: null,
      downloadUrl: null,
      error: 'Could not check for updates. Please try again later.',
    };
  }

  let release: GitHubRelease;
  try {
    release = (await response.json()) as GitHubRelease;
  } catch {
    return {
      status: 'error',
      latestVersion: null,
      downloadUrl: null,
      error: 'Could not check for updates. Please try again later.',
    };
  }

  const latestVersion = normalizeVersion(release.tag_name);

  if (latestVersion === currentVersion) {
    return { status: 'up_to_date', latestVersion, downloadUrl: null, error: null };
  }

  const asset = findApkAsset(release);
  if (!asset) {
    return {
      status: 'error',
      latestVersion,
      downloadUrl: null,
      error: 'Update available but APK not found in release assets.',
    };
  }

  return {
    status: 'update_available',
    latestVersion,
    downloadUrl: asset.browser_download_url,
    error: null,
  };
}
