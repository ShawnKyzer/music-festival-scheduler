import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Colors } from '../../src/constants/theme';

const mapImage = require('../../assets/festival-map.jpg');

const MAP_ASPECT_RATIO = 1800 / 2670; // width / height of the source image

export default function MapScreen() {
  const { width: screenWidth } = useWindowDimensions();
  // Start with the map filling the screen width, allow zooming up to 3x
  const mapWidth = screenWidth * 2;
  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <ScrollView
        maximumZoomScale={4}
        minimumZoomScale={0.5}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bouncesZoom
      >
        <Image
          source={mapImage}
          style={{ width: mapWidth, height: mapHeight }}
          resizeMode="contain"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
