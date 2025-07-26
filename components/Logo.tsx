import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ImageStyle | ViewStyle;
}

export default function Logo({ size = 120, style }: LogoProps) {
  return (
    <View style={styles.header}>
        <View style={[styles.container, style]}>
        <Image
            source={require('../assets/images/logo.jpeg')}
            style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
            resizeMode="contain"
        />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
    // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
});
