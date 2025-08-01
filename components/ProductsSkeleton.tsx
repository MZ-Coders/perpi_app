import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

function SkeletonProductCard() {
  return (
    <View style={styles.card}>
      <Animated.View style={styles.image} />
      <View style={styles.info}>
        <Animated.View style={styles.name} />
        <Animated.View style={styles.price} />
        <Animated.View style={styles.button} />
      </View>
    </View>
  );
}

export default function ProductsSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map(i => (
        <SkeletonProductCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 18,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 14,
  },
  info: {
    alignItems: 'flex-start',
  },
  name: {
    width: '80%',
    height: 16,
    borderRadius: 6,
    backgroundColor: '#F3F3F3',
    marginBottom: 10,
  },
  price: {
    width: '50%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F3F3F3',
    marginBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F3F3',
    alignSelf: 'flex-end',
  },
});
