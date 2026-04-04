import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ShowCard } from '../../src/components/ShowCard';
import { DaySelector } from '../../src/components/DaySelector';
import { Colors } from '../../src/constants/theme';
import {
  getFestivalDays,
  getShowsByDay,
  getScheduledShowIds,
  addToSchedule,
  removeFromSchedule,
} from '../../src/db/queries';
import type { Show } from '../../src/types';

export default function LineupScreen() {
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [shows, setShows] = useState<Show[]>([]);
  const [scheduledIds, setScheduledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const festivalDays = await getFestivalDays();
      setDays(festivalDays);
      if (festivalDays.length > 0) {
        setSelectedDay(festivalDays[0]);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedDay) return;
    (async () => {
      const [dayShows, ids] = await Promise.all([
        getShowsByDay(selectedDay),
        getScheduledShowIds(),
      ]);
      setShows(dayShows);
      setScheduledIds(ids);
    })();
  }, [selectedDay]);

  const handleToggle = useCallback(
    async (showId: number) => {
      if (scheduledIds.has(showId)) {
        await removeFromSchedule(showId);
        setScheduledIds((prev) => {
          const next = new Set(prev);
          next.delete(showId);
          return next;
        });
      } else {
        await addToSchedule(showId);
        setScheduledIds((prev) => new Set(prev).add(showId));
      }
    },
    [scheduledIds]
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
      <DaySelector days={days} selectedDay={selectedDay} onSelect={setSelectedDay} />
      <FlatList
        data={shows}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ShowCard
            show={item}
            isScheduled={scheduledIds.has(item.id)}
            onToggle={handleToggle}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No shows on this day.</Text>
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
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
