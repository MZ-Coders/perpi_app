
import { createClient } from '@supabase/supabase-js';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthUser } from '../../hooks/useAuthUser';
import CategoryFilter from '../components/CategoryFilter';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}

type Favorite = { id: number; product_id: number; products: any };

export default function FavoritesScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<Favorite[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('id, name, img_url');
    if (!error && data) setCategories(data);
  }

  async function fetchFavorites() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('favorites')
      .select('id, product_id, products(id, name, price, image_url, category_id, description, stock_quantity, is_active)')
      .eq('user_id', user.id);
    setLoading(false);
    if (!error && data) setFavorites(data);
  }

  async function handleRemoveFavorite(favoriteId: number) {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    fetchFavorites();
  }

  useEffect(() => {
    let filteredFavs = favorites;
    if (selectedCategory) {
      filteredFavs = filteredFavs.filter(f => f.products?.category_id === selectedCategory);
    }
    if (search.length > 0) {
      filteredFavs = filteredFavs.filter(f => f.products?.name?.toLowerCase().includes(search.toLowerCase()));
    }
    setFiltered(filteredFavs);
  }, [search, favorites, selectedCategory]);

  function renderProduct({ item }: { item: Favorite }) {
    const sharedId = `favorite-image-${item.products?.id}`;
    // Busca o nome da categoria pelo id
    const categoryObj = categories.find((c: any) => c.id === item.products?.category_id);
    const category_name = categoryObj ? categoryObj.name : '';

    if (viewType === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridCard}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/product-detail', params: { ...item.products, sharedId, category_name } })}
        >
          <View style={styles.imageContainer}>
            {Platform.OS === 'web' || !SharedElement ? (
              <Image source={{ uri: item.products?.image_url }} style={styles.gridImage} />
            ) : (
              <SharedElement id={sharedId} style={styles.gridImage} onNode={() => {}}>
                <Image source={{ uri: item.products?.image_url }} style={styles.gridImage} />
              </SharedElement>
            )}
          </View>
          <View style={styles.gridCardContent}>
            <Text style={styles.gridName} numberOfLines={2}>{item.products?.name}</Text>
            <Text style={styles.gridPrice}>MZN {item.products?.price}</Text>
            <TouchableOpacity style={styles.gridCartBtn} onPress={() => handleRemoveFavorite(item.id)}>
              <Icon name="trash-2" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.listItem}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/product-detail', params: { ...item.products, sharedId, category_name } })}
      >
        <View style={styles.listImageContainer}>
          {Platform.OS === 'web' || !SharedElement ? (
            <Image source={{ uri: item.products?.image_url }} style={styles.listImage} />
          ) : (
            <SharedElement id={sharedId} style={styles.listImage} onNode={() => {}}>
              <Image source={{ uri: item.products?.image_url }} style={styles.listImage} />
            </SharedElement>
          )}
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listName} numberOfLines={2}>{item.products?.name}</Text>
            <TouchableOpacity style={styles.listFavoriteBtn} onPress={() => handleRemoveFavorite(item.id)}>
              <Icon name="trash-2" size={20} color="#FF7A00" />
            </TouchableOpacity>
          </View>
          <Text style={styles.listPrice}>MZN {item.products?.price}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Meus Favoritos</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar favoritos..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </View>

      <View style={styles.controlsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} favorito{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleIconBtn, viewType === 'list' && styles.toggleIconBtnActive]}
            onPress={() => setViewType('list')}
          >
            <Icon name="list" size={18} color={viewType === 'list' ? '#fff' : '#008A44'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleIconBtn, viewType === 'grid' && styles.toggleIconBtnActive]}
            onPress={() => setViewType('grid')}
          >
            <Icon name="grid" size={18} color={viewType === 'grid' ? '#fff' : '#008A44'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        key={viewType}
        keyExtractor={item => item.id.toString()}
        numColumns={viewType === 'grid' ? 2 : 1}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Icon name="heart" size={48} color="#E0E0E0" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Nenhum favorito encontrado.</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={fetchFavorites}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  toggleIconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleIconBtnActive: {
    backgroundColor: '#008A44',
    elevation: 1,
  },
  // Grid styles
  gridCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F9FA',
  },
  gridCardContent: {
    padding: 12,
  },
  gridName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridPrice: {
    color: '#008A44',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  gridCartBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    elevation: 2,
  },
  // List styles
  listItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  listImageContainer: {
    marginRight: 16,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  listFavoriteBtn: {
    padding: 4,
  },
  listPrice: {
    color: '#008A44',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
});
