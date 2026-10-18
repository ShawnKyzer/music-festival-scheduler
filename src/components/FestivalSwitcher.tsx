import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useFestival } from '../context/FestivalContext';
import { formatDateRange } from '../utils/format';

// Header control showing the active festival; tap to pick another.
export function FestivalSwitcher(): React.JSX.Element {
  const { festivals, festival, selectFestival } = useFestival();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={styles.pill}
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Festival: ${festival.name}. Tap to change.`}
      >
        <Text style={styles.pillText} numberOfLines={1}>
          {festival.name}
        </Text>
        <Ionicons name="chevron-down" size={14} color={Colors.primaryLight} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Choose Festival</Text>
            {festivals.map((f) => {
              const active = f.id === festival.id;
              return (
                <Pressable
                  key={f.id}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    selectFestival(f.id);
                    setOpen(false);
                  }}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.name}>{f.name}</Text>
                    <Text style={styles.meta}>
                      {formatDateRange(f.startDate, f.endDate)} · {f.venue}, {f.city}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 220,
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    flexShrink: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowActive: {
    backgroundColor: Colors.surfaceLight,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
