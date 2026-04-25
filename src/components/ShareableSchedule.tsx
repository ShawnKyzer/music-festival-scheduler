import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import type { ScheduleEntry } from '../types';

interface Section {
  title: string;
  data: ScheduleEntry[];
}

interface ShareableScheduleProps {
  sections: Section[];
  dayFilter?: string | null;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const ShareableSchedule = forwardRef<View, ShareableScheduleProps>(
  function ShareableSchedule({ sections, dayFilter }, ref) {
    const filtered = dayFilter
      ? sections.filter((s) => s.title.includes(dayFilter))
      : sections;

    return (
      <View
        ref={ref}
        style={styles.container}
        collapsable={false}
      >
        {/* Branded Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MAD COOL 2026</Text>
          <Text style={styles.headerSubtitle}>July 8–11 · Madrid</Text>
          {dayFilter && (
            <Text style={styles.headerDay}>{dayFilter}</Text>
          )}
          <View style={styles.headerDivider} />
          <Text style={styles.headerLabel}>MY SCHEDULE</Text>
        </View>

        {/* Schedule Content */}
        {filtered.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((item) => (
              <View key={item.id} style={styles.showRow}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeText}>
                    {formatTime(item.startTime)}
                  </Text>
                  <Text style={styles.timeDivider}>–</Text>
                  <Text style={styles.timeText}>
                    {formatTime(item.endTime)}
                  </Text>
                </View>
                <View style={styles.showDetails}>
                  <Text style={styles.artistName}>{item.artist}</Text>
                  <Text style={styles.stageName}>{item.stageName}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            Shared from Mad Cool 2026 App
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 1080,
    backgroundColor: Colors.background,
    padding: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 4,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 28,
    fontWeight: '500',
    marginTop: 8,
  },
  headerDay: {
    color: Colors.primaryLight,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
  },
  headerDivider: {
    width: 120,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 24,
  },
  headerLabel: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.primaryLight,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.surfaceLight,
  },
  showRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeColumn: {
    alignItems: 'center',
    width: 120,
    marginRight: 20,
  },
  timeText: {
    color: Colors.primaryLight,
    fontSize: 22,
    fontWeight: '600',
  },
  timeDivider: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginVertical: 2,
  },
  showDetails: {
    flex: 1,
  },
  artistName: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  stageName: {
    color: Colors.textSecondary,
    fontSize: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
  },
  footerDivider: {
    width: 80,
    height: 3,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    marginBottom: 16,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '500',
  },
});
