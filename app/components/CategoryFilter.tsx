import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>CATEGORIAS</Text>
        <Text style={styles.sectionSubtitle}>Toque para filtrar produtos</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Botão "Todos" */}
        <TouchableOpacity
          style={[
            styles.categoryItem,
            selectedCategory === null && styles.categoryItemActive
          ]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIcon,
            selectedCategory === null && styles.categoryIconActive
          ]}>
            <Text style={[
              styles.allCategoriesText,
              selectedCategory === null && styles.allCategoriesTextActive
            ]}>
              TODOS
            </Text>
          </View>
          <Text style={[
            styles.categoryName,
            selectedCategory === null && styles.categoryNameActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>

        {/* Categorias */}
        {categories.map((category: Category) => {
          const isSelected = selectedCategory === category.id;
          const initials = getInitials(category.name);
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                isSelected && styles.categoryItemActive
              ]}
              onPress={() => onSelect(isSelected ? null : category.id)}
              activeOpacity={0.7}
            >
              {category.img_url ? (
                <Image 
                  source={{ uri: category.img_url }} 
                  style={[
                    styles.categoryImage,
                    isSelected && styles.categoryImageActive
                  ]} 
                />
              ) : (
                <View style={[
                  styles.categoryIcon,
                  isSelected && styles.categoryIconActive
                ]}>
                  <Text style={[
                    styles.initialsText,
                    isSelected && styles.initialsTextActive
                  ]}>
                    {initials}
                  </Text>
                </View>
              )}
              <Text style={[
                styles.categoryName,
                isSelected && styles.categoryNameActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.08,
    // shadowRadius: 2,
    // elevation: 0,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C5C5C',
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 16,
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  categoryItemActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
  },
  categoryImageActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  categoryIconActive: {
    backgroundColor: '#008A44',
    borderColor: '#FFFFFF',
  },
  allCategoriesText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  allCategoriesTextActive: {
    color: '#FFFFFF',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: 0.5,
  },
  initialsTextActive: {
    color: '#FFFFFF',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    maxWidth: 80,
    lineHeight: 16,
  },
  categoryNameActive: {
    color: '#FF7A00',
    fontWeight: '700',
  },

});