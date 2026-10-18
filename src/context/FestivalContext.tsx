import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import { getFestivals } from '../db/queries';
import type { Festival } from '../types';

interface FestivalContextValue {
  festivals: Festival[];   // most recently added first
  festival: Festival;      // currently selected
  selectFestival: (festivalId: number) => void;
}

const FestivalContext = createContext<FestivalContextValue | null>(null);

// Loads the festival list once and tracks the selection in memory. Every
// launch starts on the most recently added festival.
export function FestivalProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getFestivals();
      if (!cancelled) setFestivals(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const festival = festivals.find((f) => f.id === selectedId) ?? festivals[0];

  const value = useMemo<FestivalContextValue | null>(
    () => (festival ? { festivals, festival, selectFestival: setSelectedId } : null),
    [festivals, festival]
  );

  if (!value) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <FestivalContext.Provider value={value}>{children}</FestivalContext.Provider>;
}

export function useFestival(): FestivalContextValue {
  const value = useContext(FestivalContext);
  if (!value) throw new Error('useFestival must be used inside <FestivalProvider>');
  return value;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
