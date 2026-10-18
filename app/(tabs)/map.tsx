import React from 'react';
import { View, Image, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { Colors } from '../../src/constants/theme';
import { useFestival } from '../../src/context/FestivalContext';

interface FestivalMap {
  source: ImageSourcePropType;
  aspectRatio: number; // width / height
}

// Bundled venue maps keyed by festival slug. Festivals publish their map close
// to the event; until one is added here the tab shows a placeholder.
const MAPS_BY_FESTIVAL: Record<string, FestivalMap> = {
  'mad-cool-2026': {
    source: require('../../assets/maps/mad-cool-2026.jpg'),
    aspectRatio: 2000 / 2500,
  },
};

export default function MapScreen() {
  const { festival } = useFestival();
  const { width: screenWidth } = useWindowDimensions();
  const map = MAPS_BY_FESTIVAL[festival.slug];

  if (!map) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="map-outline" size={64} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>Map not published yet</Text>
        <Text style={styles.emptySubtitle}>
          {festival.name} hasn&apos;t released its {festival.venue} site map.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReactNativeZoomableView
        maxZoom={5}
        minZoom={1}
        initialZoom={1}
        bindToBorders
        style={styles.zoomView}
      >
        <Image
          source={map.source}
          style={{ width: screenWidth, height: screenWidth / map.aspectRatio }}
          resizeMode="contain"
        />
      </ReactNativeZoomableView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  zoomView: {
    flex: 1,
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
});
