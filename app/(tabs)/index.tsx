import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../../src/components/ShowCard';
import { DaySelector } from '../../src/components/DaySelector';
import { Colors } from '../../src/constants/theme';
import {
  getFestivalDays,
  getShowsByDay,
  searchShows,
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  useEffect(() => {
    if (!selectedDay && !isSearching) return;
    (async () => {
      const [loadedShows, ids] = await Promise.all([
        isSearching ? searchShows(normalizedQuery) : getShowsByDay(selectedDay),
        getScheduledShowIds(),
      ]);
      setShows(loadedShows);
      setScheduledIds(ids);
    })();
  }, [selectedDay, normalizedQuery, isSearching]);

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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search artists"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </Pressable>
        )}
      </View>
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
          isSearching ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No matching artists</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term or clear the search.
              </Text>
              <Pressable style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.emptyText}>No shows on this day.</Text>
          )
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
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
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearSearchButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
