import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors } from '../../src/constants/theme';
import { useAppUpdate } from '../../src/hooks/useAppUpdate';

function ProgressBar({ fraction }: { fraction: number }) {
  const pct = Math.round(fraction * 100);
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressText}>{pct}%</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const {
    phase,
    latestVersion,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    downloadAndInstall,
    reset,
  } = useAppUpdate();

  const currentVersion = Constants.expoConfig?.version ?? '—';
  const isCheckBusy = phase === 'checking' || phase === 'downloading' || phase === 'installing';

  return (
    <View style={styles.container}>
      {/* About section */}
      <Text style={styles.sectionHeader}>About</Text>
      <View style={styles.card}>
        <Text style={styles.appName}>Music Festival Scheduler</Text>
        <Text style={styles.version}>Version {currentVersion}</Text>
      </View>

      {/* Updates section */}
      <Text style={styles.sectionHeader}>Updates</Text>
      <View style={styles.card}>
        <Pressable
          style={[styles.button, isCheckBusy && styles.buttonDisabled]}
          onPress={phase === 'idle' || phase === 'error' || phase === 'up_to_date' ? checkForUpdates : undefined}
          disabled={isCheckBusy}
        >
          {phase === 'checking' ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color={Colors.text} />
              <Text style={styles.buttonText}>Check for Updates</Text>
            </>
          )}
        </Pressable>

        {/* Status area */}
        {phase === 'up_to_date' && (
          <Text style={styles.successText}>
            You&apos;re up to date (v{latestVersion})
          </Text>
        )}

        {phase === 'update_available' && (
          <View style={styles.updateAvailableContainer}>
            <Text style={styles.updateAvailableText}>
              Update available: v{latestVersion}
            </Text>
            <Pressable style={styles.installButton} onPress={downloadAndInstall}>
              <Ionicons name="download-outline" size={18} color={Colors.text} />
              <Text style={styles.buttonText}>Download &amp; Install</Text>
            </Pressable>
          </View>
        )}

        {phase === 'downloading' && downloadProgress && (
          <View style={styles.progressWrapper}>
            <Text style={styles.statusText}>Downloading update…</Text>
            <ProgressBar fraction={downloadProgress.fraction} />
          </View>
        )}

        {phase === 'installing' && (
          <Text style={styles.statusText}>Preparing install…</Text>
        )}

        {phase === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={reset} hitSlop={8}>
              <Text style={styles.retryText}>Dismiss</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  appName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  updateAvailableContainer: {
    gap: 10,
  },
  updateAvailableText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressWrapper: {
    gap: 8,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  errorContainer: {
    gap: 6,
  },
  errorText: {
    color: Colors.accent,
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
