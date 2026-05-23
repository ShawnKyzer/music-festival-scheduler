import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { checkForUpdate } from '../services/updateService';
import type { DownloadProgress } from '../types';

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'update_available'
  | 'up_to_date'
  | 'downloading'
  | 'installing'
  | 'error';

export interface UseAppUpdateReturn {
  phase: UpdatePhase;
  latestVersion: string | null;
  downloadProgress: DownloadProgress | null;
  errorMessage: string | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  reset: () => void;
}

export function useAppUpdate(): UseAppUpdateReturn {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const isInFlight = useRef(false);

  const reset = useCallback(() => {
    setPhase('idle');
    setLatestVersion(null);
    setDownloadProgress(null);
    setErrorMessage(null);
    downloadUrlRef.current = null;
    isInFlight.current = false;
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (isInFlight.current) return;
    isInFlight.current = true;
    setPhase('checking');
    setErrorMessage(null);

    const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
    const result = await checkForUpdate(currentVersion);

    if (result.status === 'error') {
      setErrorMessage(result.error);
      setPhase('error');
      isInFlight.current = false;
      return;
    }

    setLatestVersion(result.latestVersion);

    if (result.status === 'up_to_date') {
      setPhase('up_to_date');
      isInFlight.current = false;
      return;
    }

    downloadUrlRef.current = result.downloadUrl;
    setPhase('update_available');
    isInFlight.current = false;
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (isInFlight.current || !downloadUrlRef.current) return;

    if (Platform.OS !== 'android') {
      setErrorMessage('Automatic install is only supported on Android.');
      setPhase('error');
      return;
    }

    isInFlight.current = true;
    setPhase('downloading');
    setDownloadProgress({ totalBytes: 0, downloadedBytes: 0, fraction: 0 });

    const localUri = `${FileSystem.cacheDirectory}update.apk`;

    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrlRef.current,
        localUri,
        {},
        (progress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = progress;
          const fraction =
            totalBytesExpectedToWrite > 0
              ? totalBytesWritten / totalBytesExpectedToWrite
              : 0;
          setDownloadProgress({
            totalBytes: totalBytesExpectedToWrite,
            downloadedBytes: totalBytesWritten,
            fraction,
          });
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download returned no result');

      setPhase('installing');
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
        data: contentUri,
        flags: 1,
      });

      reset();
    } catch {
      setErrorMessage('Download failed. Please try again.');
      setPhase('error');
      isInFlight.current = false;
    }
  }, [reset]);

  return {
    phase,
    latestVersion,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    downloadAndInstall,
    reset,
  };
}
