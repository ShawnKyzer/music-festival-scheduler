import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { Colors } from '../../src/constants/theme';

const mapImage = require('../../assets/festival-map.jpg');

const MAP_ASPECT_RATIO = 1800 / 2670;

export default function MapScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = screenWidth;
  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

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
          source={mapImage}
          style={{ width: mapWidth, height: mapHeight }}
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
  zoomView: {
    flex: 1,
  },
});
