import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';

type Category = {
  id: string;
  name: string;
  img_url: string;
};

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}>
        {categories.map((cat: Category) => {
          const initials = cat.name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCircle, selectedCategory === cat.id && styles.categoryCircleActive]}
              onPress={() => onSelect(selectedCategory === cat.id ? null : cat.id)}
            >
              {cat.img_url ? (
                <Image source={{ uri: cat.img_url }} style={styles.categoryImg} />
              ) : (
                <View style={[styles.categoryImg, { justifyContent: 'center', alignItems: 'center' }]}> 
                  <Text style={{ fontWeight: 'bold', color: '#008A44', fontSize: 20 }}>{initials}</Text>
                </View>
              )}
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCircle: { alignItems: 'center', marginBottom: 4 },
  categoryCircleActive: { borderWidth: 2, borderColor: '#008A44', borderRadius: 40 },
  categoryImg: { width: 56, height: 56, borderRadius: 28, marginBottom: 4, backgroundColor: '#E0E0E0' },
  categoryName: { fontSize: 13, color: '#1A1A1A', textAlign: 'center', maxWidth: 70 },
});
