import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  SectionList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { getSchedule, removeFromSchedule } from '../../src/db/queries';
import type { ScheduleEntry } from '../../src/types';

interface Section {
  title: string;
  data: ScheduleEntry[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

export default function ScheduleScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = useCallback(async () => {
    const entries = await getSchedule();
    setSections(groupByDay(entries));
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
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
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No shows scheduled yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse the lineup and tap + to add shows to your schedule.
            </Text>
          </View>
        }
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
});
