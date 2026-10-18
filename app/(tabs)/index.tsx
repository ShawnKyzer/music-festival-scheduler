import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ShowCard } from '../../src/components/ShowCard';
import { DaySelector, ALL_DAYS } from '../../src/components/DaySelector';
import { Colors } from '../../src/constants/theme';
import { useFestival } from '../../src/context/FestivalContext';
import {
  getFestivalDays,
  getAllShows,
  getShowsByDay,
  getScheduledShowIds,
  addToSchedule,
  removeFromSchedule,
} from '../../src/db/queries';
import type { Show } from '../../src/types';

export default function LineupScreen() {
  const { festival } = useFestival();
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(ALL_DAYS);
  const [shows, setShows] = useState<Show[]>([]);
  const [scheduledIds, setScheduledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedDay(ALL_DAYS);
    (async () => {
      const festivalDays = await getFestivalDays(festival.id);
      if (cancelled) return;
      setDays(festivalDays);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [festival.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dayShows, ids] = await Promise.all([
        selectedDay === ALL_DAYS
          ? getAllShows(festival.id)
          : getShowsByDay(festival.id, selectedDay),
        getScheduledShowIds(festival.id),
      ]);
      if (cancelled) return;
      setShows(dayShows);
      setScheduledIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [festival.id, selectedDay]);

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
      {days.length > 0 ? (
        <DaySelector days={days} selectedDay={selectedDay} onSelect={setSelectedDay} showAll />
      ) : (
        <Text style={styles.tbaNote}>
          {shows.length} artists announced · stages and set times TBA
        </Text>
      )}
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
  tbaNote: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
