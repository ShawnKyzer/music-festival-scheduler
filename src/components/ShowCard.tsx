import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { formatSetTime, formatVenue } from '../utils/format';
import type { Show } from '../types';

interface ShowCardProps {
  show: Show;
  isScheduled: boolean;
  onToggle: (showId: number) => void;
}

function openYouTubeMusic(artist: string) {
  const query = encodeURIComponent(artist);
  Linking.openURL(`https://music.youtube.com/search?q=${query}`);
}

export function ShowCard({ show, isScheduled, onToggle }: ShowCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.timeColumn}>
        {show.startTime ? (
          <>
            <Text style={styles.timeText}>{formatSetTime(show.startTime)}</Text>
            <Text style={styles.timeDivider}>to</Text>
            <Text style={styles.timeText}>{formatSetTime(show.endTime)}</Text>
          </>
        ) : (
          <Text style={styles.timeText}>TBA</Text>
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.artist}>{show.artist}</Text>
        {show.description !== '' && (
          <Text style={styles.description} numberOfLines={2}>
            {show.description}
          </Text>
        )}
        <View style={styles.venueRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.venue}>{formatVenue(show.stageName, show.stageLocation)}</Text>
        </View>
        <Pressable
          style={styles.ytMusicButton}
          onPress={() => openYouTubeMusic(show.artist)}
          hitSlop={4}
        >
          <Ionicons name="musical-note" size={14} color={Colors.accent} />
          <Text style={styles.ytMusicText}>Listen on YouTube Music</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.toggleButton, isScheduled && styles.toggleButtonActive]}
        onPress={() => onToggle(show.id)}
        hitSlop={8}
      >
        <Ionicons
          name={isScheduled ? 'checkmark-circle' : 'add-circle-outline'}
          size={28}
          color={isScheduled ? Colors.success : Colors.primaryLight}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeColumn: {
    alignItems: 'center',
    width: 64,
    marginRight: 12,
  },
  timeText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
  timeDivider: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginVertical: 1,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  artist: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venue: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  ytMusicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ytMusicText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 4,
  },
  toggleButtonActive: {
    opacity: 1,
  },
});
