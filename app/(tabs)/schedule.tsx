import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  SectionList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { getSchedule, removeFromSchedule } from '../../src/db/queries';
import { ShareableSchedule } from '../../src/components/ShareableSchedule';
import { SharePreviewModal } from '../../src/components/SharePreviewModal';
import { useShareSchedule } from '../../src/hooks/useShareSchedule';
import type { ScheduleEntry } from '../../src/types';

interface Section {
  title: string;
  data: ScheduleEntry[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function openYouTubeMusic(artist: string) {
  const query = encodeURIComponent(artist);
  Linking.openURL(`https://music.youtube.com/search?q=${query}`);
}

function formatSectionTitle(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function groupByDay(entries: ScheduleEntry[]): Section[] {
  const map = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const day = entry.startTime.split('T')[0];
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(entry);
  }
  return Array.from(map.entries()).map(([day, data]) => ({
    title: formatSectionTitle(day),
    data,
  }));
}

const ALL_DAYS = 'all';

function formatDayPill(dateStr: string): { short: string; date: string } {
  const date = new Date(dateStr + 'T12:00:00');
  return {
    short: date.toLocaleDateString([], { weekday: 'short' }),
    date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
  };
}

export default function ScheduleScreen() {
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(ALL_DAYS);
  const {
    viewRef,
    isCapturing,
    isSending,
    previewUri,
    previewVisible,
    capturePreview,
    confirmShare,
    cancelPreview,
  } = useShareSchedule();

  // Extract unique days from schedule
  const scheduleDays = useMemo(() => {
    const daySet = new Set<string>();
    for (const section of allSections) {
      for (const entry of section.data) {
        daySet.add(entry.startTime.split('T')[0]);
      }
    }
    return Array.from(daySet).sort();
  }, [allSections]);

  // Filter sections by selected day
  const displaySections = useMemo(() => {
    if (selectedDay === ALL_DAYS) return allSections;
    return allSections.filter((s) =>
      s.data.some((entry) => entry.startTime.split('T')[0] === selectedDay)
    );
  }, [allSections, selectedDay]);

  const displayShowCount = displaySections.reduce((sum, s) => sum + s.data.length, 0);
  const totalShowCount = allSections.reduce((sum, s) => sum + s.data.length, 0);
  const hasShows = totalShowCount > 0;
  const hasFilteredShows = displayShowCount > 0;

  const loadSchedule = useCallback(async () => {
    const entries = await getSchedule();
    setAllSections(groupByDay(entries));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
  );

  const handleRemove = useCallback(
    async (showId: number) => {
      await removeFromSchedule(showId);
      await loadSchedule();
    },
    [loadSchedule]
  );

  const dayFilter = selectedDay === ALL_DAYS ? null : selectedDay;

  const handleShare = useCallback(async () => {
    await capturePreview(dayFilter, displayShowCount);
  }, [capturePreview, dayFilter, displayShowCount]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Day selector — visible only when schedule has shows across multiple days */}
      {hasShows && scheduleDays.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          <Pressable
            style={[styles.dayPill, selectedDay === ALL_DAYS && styles.dayPillActive]}
            onPress={() => setSelectedDay(ALL_DAYS)}
          >
            <Text style={[styles.dayPillText, selectedDay === ALL_DAYS && styles.dayPillTextActive]}>
              All
            </Text>
          </Pressable>
          {scheduleDays.map((day) => {
            const label = formatDayPill(day);
            const isActive = selectedDay === day;
            return (
              <Pressable
                key={day}
                style={[styles.dayPill, isActive && styles.dayPillActive]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                  {label.short}
                </Text>
                <Text style={[styles.dayPillDate, isActive && styles.dayPillTextActive]}>
                  {label.date}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Share button — visible only when filtered schedule has shows */}
      {hasFilteredShows && (
        <Pressable
          style={[styles.shareButton, isCapturing && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={isCapturing}
          hitSlop={8}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color={Colors.text} />
              <Text style={styles.shareButtonText}>Share</Text>
            </>
          )}
        </Pressable>
      )}

      <SectionList
        sections={displaySections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
              <Text style={styles.timeDivider}>-</Text>
              <Text style={styles.timeText}>{formatTime(item.endTime)}</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.artist}>{item.artist}</Text>
              <View style={styles.venueRow}>
                <Ionicons name="location" size={13} color={Colors.accent} />
                <Text style={styles.venue}>
                  {item.stageName} - {item.stageLocation}
                </Text>
              </View>
              <Pressable
                style={styles.ytMusicButton}
                onPress={() => openYouTubeMusic(item.artist)}
                hitSlop={4}
              >
                <Ionicons name="musical-note" size={14} color={Colors.accent} />
                <Text style={styles.ytMusicText}>Listen on YouTube Music</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemove(item.showId)}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={24} color={Colors.accent} />
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          hasShows ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No shows on this day</Text>
              <Text style={styles.emptySubtitle}>
                Select a different day or tap "All" to see your full schedule.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No shows scheduled yet</Text>
              <Text style={styles.emptySubtitle}>
                Browse the lineup and tap + to add shows to your schedule.
              </Text>
            </View>
          )
        }
      />

      {/* Off-screen shareable view for image capture */}
      {hasFilteredShows && (
        <View style={styles.offScreen} pointerEvents="none">
          <ShareableSchedule ref={viewRef} sections={displaySections} dayFilter={dayFilter} />
        </View>
      )}

      {/* Preview modal */}
      <SharePreviewModal
        visible={previewVisible}
        imageUri={previewUri}
        isSharing={isSending}
        onShare={confirmShare}
        onCancel={cancelPreview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    color: Colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 12,
    paddingTop: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeBadge: {
    alignItems: 'center',
    width: 64,
    marginRight: 12,
  },
  timeText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  timeDivider: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  artist: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venue: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  ytMusicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ytMusicText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  offScreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dayPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 60,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayPillDate: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  dayPillTextActive: {
    color: Colors.text,
  },
});
