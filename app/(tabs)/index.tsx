import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShowCard } from '../../src/components/ShowCard';
import { DaySelector } from '../../src/components/DaySelector';
import { Colors } from '../../src/constants/theme';
import {
  getFestivalDays,
  getAllShows,
  getShowsByDay,
  getScheduledShowIds,
  addToSchedule,
  removeFromSchedule,
} from '../../src/db/queries';
import type { Show } from '../../src/types';

const ALL_DAYS = 'all';

export default function LineupScreen() {
  const [days, setDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(ALL_DAYS);
  const [shows, setShows] = useState<Show[]>([]);
  const [scheduledIds, setScheduledIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const festivalDays = await getFestivalDays();
      setDays(festivalDays);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const [loadedShows, ids] = await Promise.all([
        selectedDay === ALL_DAYS ? getAllShows() : getShowsByDay(selectedDay),
        getScheduledShowIds(),
      ]);
      setShows(loadedShows);
      setScheduledIds(ids);
    })();
  }, [selectedDay]);

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredShows = useMemo(() => {
    if (!normalizedQuery) return shows;
    return shows.filter((show) => show.artist.toLowerCase().includes(normalizedQuery));
  }, [shows, normalizedQuery]);

  const isSearching = normalizedQuery.length > 0;

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
      <DaySelector
        days={days}
        selectedDay={selectedDay}
        onSelect={setSelectedDay}
        showAll
      />

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
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
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredShows}
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
              <Ionicons
                name="search-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No matching artists</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term or clear the search.
              </Text>
              <Pressable
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="calendar-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No shows found</Text>
              <Text style={styles.emptySubtitle}>
                Select a different day or check back later.
              </Text>
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
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
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
