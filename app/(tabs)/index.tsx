import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CategoryFilter from '../components/CategoryFilter';

let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}

// Favoritos
type Favorite = { id: number; product_id: number };

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProductCatalogScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [userId, setUserId] = useState<string | null>(null);


  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUserAndFavorites();
  }, []);

  async function fetchUserAndFavorites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      fetchFavorites(user.id);
    }
  }

  async function fetchFavorites(uid: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id, product_id')
      .eq('user_id', uid);
    if (!error && data) setFavorites(data);
  }

  async function handleToggleFavorite(productId: number) {
    if (!userId) return;
    const isFav = favorites.some(f => f.product_id === productId);
    if (isFav) {
      // Remove
      const fav = favorites.find(f => f.product_id === productId);
      if (fav) {
        await supabase.from('favorites').delete().eq('id', fav.id);
        setFavorites(favorites.filter(f => f.product_id !== productId));
      }
    } else {
      // Add
      const { data, error } = await supabase.from('favorites').insert({ product_id: productId, user_id: userId }).select().single();
      if (!error && data) setFavorites([...favorites, data]);
    }
  }

  useEffect(() => {
    let filteredProducts = products;
    if (selectedCategory) {
      filteredProducts = filteredProducts.filter((p: any) => p.category_id === selectedCategory);
    }
    if (search.length > 0) {
      filteredProducts = filteredProducts.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    setFiltered(filteredProducts);
  }, [search, products, selectedCategory]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('id, name, price, image_url, category_id');
    setLoading(false);
    if (!error && data) setProducts(data);
  }

  async function fetchCategories() {
    const { data, error } = await supabase.from('categories').select('id, name, img_url');
    if (!error && data) setCategories(data);
  }

  function handleAddToCart(product: any) {
    setCart(prev => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function handleRemoveFromCart(productId: any) {
    setCart(prev => prev.filter((p) => p.id !== productId));
  }

  function handleChangeQty(productId: any, delta: number) {
    setCart(prev => {
      return prev.map((p) => {
        if (p.id === productId) {
          const newQty = p.qty + delta;
          if (newQty <= 0) return null;
          return { ...p, qty: newQty };
        }
        return p;
      }).filter(Boolean);
    });
  }

  function renderProduct({ item }: { item: any }) {
    const inCart = cart.some((p) => p.id === item.id);
    const cartItem = cart.find((p) => p.id === item.id);
    const sharedId = `product-image-${item.id}`;
    const isFav = favorites.some(f => f.product_id === item.id);
    return (
      <TouchableOpacity
        style={viewType === 'grid' ? styles.card : styles.listItem}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/product-detail', params: { ...item, sharedId } })}
      >
        {Platform.OS === 'web' || !SharedElement ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <SharedElement id={sharedId} style={styles.image} onNode={() => {}}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
          </SharedElement>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={e => { e.stopPropagation(); handleToggleFavorite(item.id); }}>
              <Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.price}>MZN {item.price}</Text>
          <TouchableOpacity
            style={[styles.cartBtn, inCart && styles.cartBtnInCart]}
            onPress={e => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
          >
            <Text style={styles.cartBtnText}>
              {inCart ? `No carrinho${cartItem && cartItem.qty > 1 ? ` (${cartItem.qty})` : ''}` : 'Adicionar ao carrinho'}
            </Text>
            {inCart && <Text style={styles.inCartIcon}>✔️</Text>}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Calcula o total do carrinho
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <View style={styles.container}>
      {/* Topo com ícone do carrinho */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setCartVisible(true)} style={styles.cartIconBtn}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cart.length > 0 && (
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Catálogo de Produtos</Text>
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

      {/* Filtro de categorias - componente separado, destacado */}
      <View style={{ backgroundColor: '#F3F3F3', paddingVertical: 10, marginBottom: 8, borderRadius: 12 }}>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
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
      <FlatList
        data={filtered}
        key={viewType}
        keyExtractor={item => item.id.toString()}
        numColumns={viewType === 'grid' ? 2 : 1}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}
        refreshing={loading}
        onRefresh={fetchProducts}
      />

      {/* Modal do carrinho */}
      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.cartModalBg}>
          <View style={styles.cartModal}>
            <Text style={styles.cartModalTitle}>Carrinho</Text>
            {cart.length === 0 ? (
              <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
            ) : (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.cartItemRow}>
                      <Image source={{ uri: item.image_url }} style={styles.cartItemImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.priceCart}>MZN {item.price}</Text>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQty(item.id, -1)}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.qty}</Text>
                          <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQty(item.id, 1)}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFromCart(item.id)}>
                            <Text style={styles.removeBtnIcon}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                  style={{ maxHeight: 250 }}
                />
                <View style={styles.cartTotalRow}>
                  <Text style={styles.cartTotalLabel}>Total:</Text>
                  <Text style={styles.cartTotalValue}>MZN {cartTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => alert('Compra realizada!')}
                  disabled={cart.length === 0}
                >
                  <Text style={styles.buyBtnText}>Comprar</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.closeCartBtn} onPress={() => setCartVisible(false)}>
              <Text style={styles.closeCartBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFB', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cartIconBtn: { marginRight: 12, position: 'relative', backgroundColor: '#fff', borderRadius: 24, padding: 8, elevation: 2 },
  cartIcon: { fontSize: 28, color: '#008A44' },
  cartBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: '#FF7A00', borderRadius: 12, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#008A44', flex: 1, textAlign: 'center', fontFamily: 'DM Sans' },
  searchRow: { flexDirection: 'row', marginBottom: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 16, color: '#1A1A1A' },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  toggleIconBtn: { marginHorizontal: 8, padding: 10, borderRadius: 8, backgroundColor: '#E0E0E0' },
  toggleIconBtnActive: { backgroundColor: '#008A44' },
  toggleIcon: { fontSize: 22, color: '#008A44' },
  toggleIconActive: { color: '#fff' },
  card: { flex: 1, margin: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2 },
  listItem: { flexDirection: 'row', marginVertical: 10, backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2 },
  image: { width: 80, height: 80, borderRadius: 12, marginBottom: 12, backgroundColor: '#FDFDFB' },
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#1A1A1A', fontFamily: 'DM Sans' },
  price: { color: '#008A44', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  priceCart: { color: '#008A44', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  cartBtn: { marginTop: 8, backgroundColor: '#FF7A00', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', elevation: 1 },
  cartBtnInCart: { backgroundColor: '#008A44' },
  cartBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  inCartIcon: { marginLeft: 6, fontSize: 16 },
  cartModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.12)', justifyContent: 'center', alignItems: 'center' },
  cartModal: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '92%', maxWidth: 440, elevation: 3 },
  cartModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#008A44', marginBottom: 22, textAlign: 'center', fontFamily: 'DM Sans' },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cartItemImg: { width: 48, height: 48, borderRadius: 8, marginRight: 14, backgroundColor: '#FDFDFB' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 2 },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#008A44' },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: '#1A1A1A' },
  removeBtn: { marginLeft: 10, backgroundColor: '#FF7A00', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
  removeBtnIcon: { color: '#fff', fontSize: 18 },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderColor: '#E0E0E0' },
  cartTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#008A44' },
  cartTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF7A00' },
  buyBtn: { marginTop: 28, backgroundColor: '#FF7A00', borderRadius: 8, paddingVertical: 16, alignItems: 'center', elevation: 1 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  closeCartBtn: { marginTop: 18, backgroundColor: '#008A44', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  closeCartBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
  // ...estilos de categoria agora estão em components/CategoryFilter.tsx
});
