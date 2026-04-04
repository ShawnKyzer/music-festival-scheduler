import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/theme';

interface DaySelectorProps {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const dayName = date.toLocaleDateString([], { weekday: 'short' });
  const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dayName}\n${monthDay}`;
}

export function DaySelector({ days, selectedDay, onSelect }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      {days.map((day) => (
        <Pressable
          key={day}
          style={[styles.pill, selectedDay === day && styles.pillActive]}
          onPress={() => onSelect(day)}
        >
          <Text style={[styles.dayName, selectedDay === day && styles.labelActive]}>
            {formatDayLabel(day).split('\n')[0]}
          </Text>
          <Text style={[styles.dayDate, selectedDay === day && styles.labelActive]}>
            {formatDayLabel(day).split('\n')[1]}
          </Text>
        </Pressable>
      ))}
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
