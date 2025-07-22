import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthUser } from '../hooks/useAuthUser';
import { supabase } from '../lib/supabaseClient';
import CategoryFilter from './components/CategoryFilter';

let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}

type Product = {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category_id?: number | string | null;
};

type Favorite = { id: number; product_id: number };

export default function ProductCatalogScreen() {
  const router = useRouter();
  const user = useAuthUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<any[]>([]);
  const [cartVisible, setCartVisible] = useState(false);

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  /** Fetch products & categories */
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, category_id');
    setLoading(false);
    if (!error && data) {
      const norm = data.map((p: any) => ({
        ...p,
        category_id: p.category_id ? Number(p.category_id) : null,
      }));
      setProducts(norm);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, img_url');
    if (!error && data) {
      setCategories(data.map((c: any) => ({ ...c, id: Number(c.id) })));
    }
  };

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('favorites')
      .select('id, product_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setFavorites(data.map((f: any) => ({ ...f, product_id: Number(f.product_id) })));
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  /** Filtered products */
  const filtered = useMemo(() => {
    let list = products;
    if (selectedCategory != null) {
      list = list.filter((p) => Number(p.category_id) === selectedCategory);
    }
    if (search.trim().length > 0) {
      const s = search.trim().toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(s));
    }
    return list;
  }, [products, search, selectedCategory]);

  /** Favorites toggle */
  const isFavorite = (productId: number) =>
    favorites.some((f) => f.product_id === productId);

  const handleToggleFavorite = async (productId: number) => {
    if (!user) return;
    const existing = favorites.find((f) => f.product_id === productId);
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
    } else {
      await supabase.from('favorites').insert({
        product_id: productId,
        user_id: user.id,
      });
    }
    fetchFavorites();
  };

  /** Cart */
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  /** Header (tudo que estava fixo antes) */
  const renderHeader = () => (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setCartVisible(true)}
          style={styles.cartIconBtn}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Perpi Shop</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#5C5C5C"
        />
      </View>

      <View style={styles.categoryContainer}>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory != null ? String(selectedCategory) : null}
          onSelect={(val: string | null) =>
            setSelectedCategory(val == null ? null : Number(val))
          }
        />
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleIconBtn, viewType === 'list' && styles.toggleIconBtnActive]}
          onPress={() => setViewType('list')}
        >
          <Text style={[styles.toggleIcon, viewType === 'list' && styles.toggleIconActive]}>📃</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleIconBtn, viewType === 'grid' && styles.toggleIconBtnActive]}
          onPress={() => setViewType('grid')}
        >
          <Text style={[styles.toggleIcon, viewType === 'grid' && styles.toggleIconActive]}>🔲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /** Render product item */
  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const inCart = cart.some((p) => p.id === item.id);
    const fav = isFavorite(item.id);

    return (
      <View style={viewType === 'grid' ? styles.gridItem : styles.listItemOuter}>
        <TouchableOpacity
          style={viewType === 'grid' ? styles.card : styles.listItem}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/product-detail',
              params: { ...item, sharedId: `product-image-${item.id}` },
            })
          }
        >
          {Platform.OS === 'web' || !SharedElement ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <SharedElement id={`product-image-${item.id}`} style={styles.image}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
            </SharedElement>
          )}

          <View>
            <View style={styles.productTop}>
              <Text style={styles.name}>{item.name}</Text>
              {user && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    handleToggleFavorite(item.id);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  {fav ? (
                    <MCIcon name="heart" size={22} color="#FF7A00" />
                  ) : (
                    <Icon name="heart" size={22} color="#E0E0E0" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.price}>MZN {item.price}</Text>
            <TouchableOpacity
              style={[styles.cartBtn, inCart && styles.cartBtnInCart]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleAddToCart(item);
              }}
            >
              <Text style={styles.cartBtnText}>
                {inCart ? 'No carrinho' : 'Adicionar ao carrinho'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        key={viewType}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewType === 'grid' ? 2 : 1}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={<View style={{ height: 40 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchProducts} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFDFB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerWrap: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cartIconBtn: {
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    elevation: 2,
  },
  cartIcon: { fontSize: 28, color: '#008A44' },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#008A44',
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },
  searchRow: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1A1A1A',
  },
  categoryContainer: { backgroundColor: '#fff', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  toggleIconBtn: {
    marginHorizontal: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  toggleIconBtnActive: { backgroundColor: '#008A44' },
  toggleIcon: { fontSize: 22, color: '#008A44' },
  toggleIconActive: { color: '#fff' },
  gridItem: { flexBasis: '48%', maxWidth: '48%', marginBottom: 16 },
  listItemOuter: { width: '100%', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  productTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FDFDFB',
  },
  name: { fontWeight: 'bold', fontSize: 15, color: '#1A1A1A', fontFamily: 'DM Sans' },
  price: { color: '#008A44', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  cartBtn: {
    marginTop: 8,
    backgroundColor: '#FF7A00',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  cartBtnInCart: { backgroundColor: '#008A44' },
  cartBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
