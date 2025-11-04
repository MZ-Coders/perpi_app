import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

function SkeletonCategoryItem() {
  return (
    <View style={styles.categoryItem}>
      <Animated.View style={styles.categoryIcon} />
      <Animated.View style={styles.categoryName} />
    </View>
  );
}

export default function CategorySkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map(i => (
        <SkeletonCategoryItem key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  categoryItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  categoryName: {
    width: 60,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F3F3F3',
  },
});
