// Favoritos
type Favorite = { id: number; product_id: number };
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthUser } from '../../hooks/useAuthUser';
import CategoryFilter from '../components/CategoryFilter';

let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}
export default function ProductCatalogScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  // Adiciona ou remove produto do carrinho, com logging detalhado
  function handleToggleCart(product: any) {
    console.log('[handleToggleCart] product:', product);
    setCart(prev => {
      const productId = String(product.id);
      const exists = prev.find(p => String(p.id) === productId);
      console.log('[handleToggleCart] exists:', exists);
      if (exists) {
        const filtered = prev.filter(p => String(p.id) !== productId);
        console.log('[handleToggleCart] Removendo do carrinho:', filtered);
        return filtered;
      } else {
        // Normaliza os campos do item para evitar duplicidade
        const normalized = {
          id: productId,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          quantity: 1
        };
        const newCart = [...prev, normalized];
        console.log('[handleToggleCart] Adicionando ao carrinho:', newCart);
        return newCart;
      }
    });
  }

  // Persiste o carrinho no AsyncStorage sempre que mudar, com logging
  React.useEffect(() => {
    console.log('[useEffect cart] Persistindo carrinho:', cart);
    AsyncStorage.setItem('cart', JSON.stringify(cart)).then(() => {
      console.log('[useEffect cart] Carrinho salvo no AsyncStorage');
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
      console.log('[useEffect cart] Evento cartUpdated disparado');
    }
  }, [cart]);

  // Atualiza o carrinho sempre que a tela recebe foco, com logging
  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('cart').then(data => {
        console.log('[useFocusEffect] AsyncStorage.getItem cart:', data);
        if (data) {
          try {
            const arr = JSON.parse(data);
            console.log('[useFocusEffect] Carrinho lido do AsyncStorage:', arr);
            setCart(arr);
          } catch (e) {
            console.log('[useFocusEffect] Erro ao parsear carrinho:', e);
            setCart([]);
          }
        } else {
          console.log('[useFocusEffect] Carrinho vazio');
          setCart([]);
        }
      });
    }, [])
  );

  // Adiciona ou remove favorito
  function handleToggleFavorite(productId: number) {
    setFavorites(prev => {
      const exists = prev.find(f => f.product_id === productId);
      if (exists) {
        return prev.filter(f => f.product_id !== productId);
      } else {
        return [...prev, { id: Date.now(), product_id: productId }];
      }
    });
  }
  const user = useAuthUser();

  // Busca produtos e categorias do Supabase
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Importa o cliente do Supabase
        const { supabase } = await import('../../lib/supabaseClient');
        // Busca categorias
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        if (catError) throw catError;
        setCategories(catData || []);

        // Busca produtos
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        if (prodError) throw prodError;
        setProducts(prodData || []);
      } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtra produtos por categoria e busca
  React.useEffect(() => {
    let filteredList = products;
    if (selectedCategory) {
      filteredList = filteredList.filter(p => p.category_id === selectedCategory);
    }
    if (search) {
      filteredList = filteredList.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    setFiltered(filteredList);
  }, [products, selectedCategory, search]);

  function renderProduct({ item }: { item: any }) {
    const sharedId = `product-image-${item.id}`;
    const isFav = Array.isArray(favorites) ? favorites.some((f: Favorite) => String(f.product_id) === String(item.id)) : false;
    const inCart = Array.isArray(cart) ? cart.some((p: any) => String(p.id) === String(item.id)) : false;
    const categoryObj = Array.isArray(categories) ? categories.find((c: any) => c.id === item.category_id) : null;
    const category_name = categoryObj ? categoryObj.name : '';
    if (viewType === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridCard}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/detalhes', params: { ...item, sharedId, description: item.description, stock_quantity: item.stock_quantity, is_active: item.is_active, category_name } })}
        >
          <View style={styles.imageContainer}>
            {Platform.OS === 'web' || !SharedElement ? (
              <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            ) : (
              <SharedElement id={sharedId} style={styles.gridImage} onNode={() => {}}>
                <Image source={{ uri: item.image_url }} style={styles.gridImage} />
              </SharedElement>
            )}
            {user && (
              <TouchableOpacity 
                style={styles.favoriteBtn}
                onPress={e => { e.stopPropagation(); handleToggleFavorite(item.id); }}
              >
                {isFav ? (
                  <MCIcon name="heart" size={20} color="#FF7A00" />
                ) : (
                  <Icon name="heart" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.gridCardContent}>
            <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.gridPrice}>MZN {item.price}</Text>
            {user && (
              <TouchableOpacity
                style={[styles.gridCartBtn, inCart && styles.gridCartBtnInCart]}
                onPress={() => handleToggleCart(item)}
              >
                <Icon name={inCart ? 'check' : 'shopping-cart'} size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    }
    // List view rendering
    return (
      <TouchableOpacity
        style={styles.listItem}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/detalhes', params: { ...item, sharedId, description: item.description, stock_quantity: item.stock_quantity, is_active: item.is_active, category_name } })}
      >
        <View style={styles.listImageContainer}>
          {Platform.OS === 'web' || !SharedElement ? (
            <Image source={{ uri: item.image_url }} style={styles.listImage} />
          ) : (
            <SharedElement id={sharedId} style={styles.listImage} onNode={() => {}}>
              <Image source={{ uri: item.image_url }} style={styles.listImage} />
            </SharedElement>
          )}
        </View>
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listName} numberOfLines={2}>{item.name}</Text>
            {user && (
              <TouchableOpacity 
                style={styles.listFavoriteBtn}
                onPress={e => { e.stopPropagation(); handleToggleFavorite(item.id); }}
              >
                {isFav ? (
                  <MCIcon name="heart" size={22} color="#FF7A00" />
                ) : (
                  <Icon name="heart" size={22} color="#E0E0E0" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.listPrice}>MZN {item.price}</Text>
          {user && (
            <TouchableOpacity
              style={[styles.listCartBtn, inCart && styles.listCartBtnInCart]}
              onPress={() => handleToggleCart(item)}
            >
              <Icon name={inCart ? 'check' : 'shopping-cart'} size={16} color="#fff" />
              <Text style={styles.listCartBtnText}>{inCart ? 'No carrinho' : 'Adicionar ao carrinho'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com gradiente - fora do ScrollView para ficar fixo */}
      <LinearGradient
        colors={['#008A44', '#00B359']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Perpi Shop</Text>
            {/* Cart icon removed from catalog header. Cart icon is now only in layout header. */}
          </View>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </LinearGradient>

      {/* Conteúdo scrollável */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Filtro de categorias */}
        <View style={styles.categoryContainer}>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        <View style={styles.controlsRow}>
          <Text style={styles.resultsText}>
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
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
        
        {/* Lista de produtos */}
        <FlatList
          data={filtered}
          key={viewType}
          keyExtractor={item => item.id.toString()}
          numColumns={viewType === 'grid' ? 2 : 1}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto encontrado.</Text>}
          refreshing={loading}
          onRefresh={() => {}}
          nestedScrollEnabled={true}
          scrollEnabled={false} // Desabilita o scroll do FlatList para usar apenas o ScrollView principal
          scrollToOverflowEnabled={true}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  scrollableContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  cartIconBtn: { 
    position: 'relative', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 20, 
    padding: 10,
  },
  cartBadge: { 
    position: 'absolute', 
    top: -2, 
    right: -2, 
    backgroundColor: '#FF7A00', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 4 
  },
  cartBadgeText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12, 
    textAlign: 'center' 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: '#1A1A1A' 
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
    boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
    boxShadow: '0px 1px 2px rgba(0,0,0,0.05)',
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
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F8F9FA',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 6,
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
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  gridCartBtnInCart: {
    backgroundColor: '#008A44',
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
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
  listCartBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  listCartBtnInCart: {
    backgroundColor: '#008A44',
  },
  listCartBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Legacy styles (mantidos para compatibilidade)
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#1A1A1A' },
  price: { color: '#008A44', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  priceCart: { color: '#008A44', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  cartBtn: { marginTop: 8, backgroundColor: '#FF7A00', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', elevation: 1 },
  cartBtnInCart: { backgroundColor: '#008A44' },
  cartBtnInactive: {
    backgroundColor: '#F3F3F3',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
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
  // favoriteIconAbsInactive: removed, not needed for favorite button anymore
  // ...estilos de categoria agora estão em components/CategoryFilter.tsx
});
