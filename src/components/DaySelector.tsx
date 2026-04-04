import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => (
        <Pressable
          key={day}
          style={[styles.pill, selectedDay === day && styles.pillActive]}
          onPress={() => onSelect(day)}
        >
          <Text style={[styles.label, selectedDay === day && styles.labelActive]}>
            {formatDayLabel(day)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.text,
  },
});
