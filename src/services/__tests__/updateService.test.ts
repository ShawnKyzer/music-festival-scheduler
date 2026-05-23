import { normalizeVersion, findApkAsset, checkForUpdate } from '../updateService';
import type { GitHubRelease } from '../../types';

const APK_ASSET = {
  name: 'app-release.apk',
  browser_download_url: 'https://github.com/example/releases/download/v1.1.0/app-release.apk',
  size: 10_000_000,
  content_type: 'application/vnd.android.package-archive',
};

const ZIP_ASSET = {
  name: 'source.zip',
  browser_download_url: 'https://github.com/example/releases/download/v1.1.0/source.zip',
  size: 5_000_000,
  content_type: 'application/zip',
};

function makeRelease(tag: string, assets = [APK_ASSET]): GitHubRelease {
  return { tag_name: tag, name: `Release ${tag}`, published_at: '2026-05-22T00:00:00Z', assets };
}

describe('normalizeVersion', () => {
  it('strips leading v prefix', () => {
    expect(normalizeVersion('v1.2.3')).toBe('1.2.3');
  });

  it('returns version unchanged when no v prefix', () => {
    expect(normalizeVersion('1.2.3')).toBe('1.2.3');
  });
});

describe('findApkAsset', () => {
  it('returns the first .apk asset', () => {
    const release = makeRelease('v1.1.0', [ZIP_ASSET, APK_ASSET]);
    expect(findApkAsset(release)).toEqual(APK_ASSET);
  });

  it('returns null when no .apk asset exists', () => {
    const release = makeRelease('v1.1.0', [ZIP_ASSET]);
    expect(findApkAsset(release)).toBeNull();
  });
});

describe('checkForUpdate', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns up_to_date when versions match', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRelease('v1.0.0'),
    } as Response);

    const result = await checkForUpdate('1.0.0');
    expect(result.status).toBe('up_to_date');
    expect(result.latestVersion).toBe('1.0.0');
    expect(result.downloadUrl).toBeNull();
  });

  it('returns update_available with download URL when newer version exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRelease('v1.1.0'),
    } as Response);

    const result = await checkForUpdate('1.0.0');
    expect(result.status).toBe('update_available');
    expect(result.latestVersion).toBe('1.1.0');
    expect(result.downloadUrl).toBe(APK_ASSET.browser_download_url);
  });

  it('returns error on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const result = await checkForUpdate('1.0.0');
    expect(result.status).toBe('error');
    expect(result.error).toBe('No internet connection. Please try again.');
  });

  it('returns error on non-200 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
    } as Response);

    const result = await checkForUpdate('1.0.0');
    expect(result.status).toBe('error');
    expect(result.error).toBe('Could not check for updates. Please try again later.');
  });

  it('returns error when release has no APK asset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => makeRelease('v1.1.0', [ZIP_ASSET]),
    } as Response);

    const result = await checkForUpdate('1.0.0');
    expect(result.status).toBe('error');
    expect(result.error).toBe('Update available but APK not found in release assets.');
  });
});
