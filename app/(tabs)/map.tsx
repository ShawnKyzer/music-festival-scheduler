import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Colors } from '../../src/constants/theme';

const mapImage = require('../../assets/festival-map.jpg');

const MAP_ASPECT_RATIO = 1800 / 2670;

export default function MapScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const mapWidth = screenWidth * 2.5;
  const mapHeight = mapWidth / MAP_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.outer}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.inner}
        >
          <Image
            source={mapImage}
            style={{ width: mapWidth, height: mapHeight }}
            resizeMode="contain"
          />
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  outer: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
  },
});
