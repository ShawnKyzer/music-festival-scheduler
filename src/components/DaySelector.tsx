import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/theme';

export const ALL_DAYS = 'all';

interface DaySelectorProps {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
  showAll?: boolean;
}

function formatDayLabel(dateStr: string): { name: string; date: string } {
  const date = new Date(dateStr + 'T12:00:00');
  return {
    name: date.toLocaleDateString([], { weekday: 'short' }),
    date: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
  };
}

export function DaySelector({ days, selectedDay, onSelect, showAll = false }: DaySelectorProps) {
  const allActive = showAll && selectedDay === ALL_DAYS;
  return (
    <View style={styles.container}>
      {showAll && (
        <Pressable
          style={[styles.pill, allActive && styles.pillActive]}
          onPress={() => onSelect(ALL_DAYS)}
        >
          <Text style={[styles.dayName, allActive && styles.labelActive]}>All</Text>
          <Text style={[styles.dayDate, allActive && styles.labelActive]}>
            {days.length} days
          </Text>
        </Pressable>
      )}
      {days.map((day) => {
        const label = formatDayLabel(day);
        const isActive = selectedDay === day;
        return (
          <Pressable
            key={day}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(day)}
          >
            <Text style={[styles.dayName, isActive && styles.labelActive]}>{label.name}</Text>
            <Text style={[styles.dayDate, isActive && styles.labelActive]}>{label.date}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayDate: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  labelActive: {
    color: Colors.text,
  },
});
