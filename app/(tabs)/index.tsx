// Favoritos
type Favorite = { id: number; product_id: number };
import { Feather as Icon, MaterialCommunityIcons as MCIcon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthUser } from '../../hooks/useAuthUser';
import CategoryFilter from '../components/CategoryFilter';
import ProductsSkeleton from '../../components/ProductsSkeleton';
const FAVORITES_ID = '__favoritos__';


let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}
// import AppHeader from '../../components/AppHeader';
export default function ProductCatalogScreen() {
  const authUser = useAuthUser();
  // Detecta usuário logado apenas pelo hook useAuthUser
  const user = authUser ? authUser : null;
  // Debug: mostrar o objeto user no console
  React.useEffect(() => {
    // console.log('user:', user);
  }, [user]);

  // Estado para dados do perfil na tabela users_
  const [profile, setProfile] = useState<any>(null);

  // Busca o perfil do usuário na tabela users_ após login
  useEffect(() => {
    async function fetchProfile() {
      if (user && user.email) {
        try {
          const { supabase } = await import('../../lib/supabaseClient');
          const { data, error } = await supabase
            .from('users_')
            .select('*')
            .eq('email', user.email)
            .single();
          if (!error && data) {
            setProfile(data);
          } else {
            setProfile(null);
          }
        } catch (err) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
    fetchProfile();
  }, [user]);
  // Debug: mostrar o objeto user no console
  React.useEffect(() => {
    // console.log('user:', user);
  }, [user]);
  // ...existing code...

  // Se usar React Navigation, loga ao focar
  // import { useFocusEffect } from '@react-navigation/native';
  // useFocusEffect(
  //   React.useCallback(() => {
  //     const authUser = useAuthUser();
  //     console.log('[DEBUG] useFocusEffect - useAuthUser:', authUser);
  //   }, [])
  // );
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
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [cart, setCart] = useState<any[]>([]);

  // Animated value para mostrar/esconder o header de busca fixo
  const searchAnim = useRef(new Animated.Value(0)).current; // 0: visível, -80: escondido
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);
  const [showSearch, setShowSearch] = useState(true);

  // Sincroniza estado showSearch com valor animado
  useEffect(() => {
    const id = searchAnim.addListener(({ value }) => {
      setShowSearch(value > -79);
    });
    return () => searchAnim.removeListener(id);
  }, [searchAnim]);

  // Handler para animar header conforme scroll
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    // Se desce, esconde; se sobe, mostra
    if (delta > 4 && !isHidden.current && y > 10) {
      // Esconde
      Animated.timing(searchAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }).start();
      isHidden.current = true;
    } else if (delta < -4 && isHidden.current) {
      // Mostra
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      isHidden.current = false;
    }
  };
  // Adiciona ou remove produto do carrinho e persiste no AsyncStorage
  function handleToggleCart(product: any) {
    setCart(prev => {
      console.log('[Cart] handleToggleCart called. Previous cart:', prev);
      // Always compare and store id as number
      const exists = prev.find(p => Number(p.id) === Number(product.id));
      let newCart;
      if (exists) {
        newCart = prev.filter(p => Number(p.id) !== Number(product.id));
        console.log(`[Cart] Removing product from cart:`, product.id);
      } else {
        // Always store id as number
        newCart = [...prev, { ...product, id: Number(product.id), quantity: 1 }];
        console.log(`[Cart] Adding product to cart:`, product.id);
      }
      AsyncStorage.setItem('cart', JSON.stringify(newCart)).then(() => {
        console.log('[Cart] Cart persisted to AsyncStorage:', newCart);
      });
      console.log('[Cart] New cart state after toggle:', newCart);
      return newCart;
    });
  }
  // Carrega o carrinho do AsyncStorage ao montar e atualiza automaticamente
  useEffect(() => {
    function syncCart() {
      AsyncStorage.getItem('cart').then(stored => {
        console.log('[Cart] syncCart called. Raw value from AsyncStorage:', stored);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCart(Array.isArray(parsed) ? parsed : []);
            console.log('[Cart] Cart restored from AsyncStorage:', parsed);
          } catch (e) {
            setCart([]);
            console.log('[Cart] Error parsing cart from AsyncStorage, setting to []', e);
          }
        } else {
          setCart([]);
          console.log('[Cart] No cart found in AsyncStorage, setting to []');
        }
      });
    }
    syncCart();
    // Só adiciona o event listener no web
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('cartUpdated', syncCart);
      return () => window.removeEventListener('cartUpdated', syncCart);
    }
    // No mobile, não faz nada
    return undefined;
  }, []);

  // Adiciona ou remove favorito
  function handleToggleFavorite(productId: number) {
    setFavorites(prev => {
      const pid = Number(productId);
      const exists = prev.find(f => Number(f.product_id) === pid);
      let updated;
      if (exists) {
        updated = prev.filter(f => Number(f.product_id) !== pid);
        console.log('[Favoritos] Removendo produto', pid);
      } else {
        updated = [...prev, { id: Date.now(), product_id: pid }];
        console.log('[Favoritos] Adicionando produto', pid);
      }
      // Salva no AsyncStorage, mas não faz setFavorites novamente
      AsyncStorage.setItem('favorites', JSON.stringify(updated)).then(() => {
        console.log('[Favoritos] Persistido no AsyncStorage:', updated);
      });
      return updated;
    });
  }

  // Carrega favoritos do AsyncStorage/localStorage ao montar (com controle de carregamento)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('favorites');
      console.log('[Favoritos][WEB] Valor bruto localStorage:', stored);
      try {
        const parsed = stored ? JSON.parse(stored) : [];
        const normalized = Array.isArray(parsed)
          ? parsed.map(f => ({ ...f, product_id: Number(f.product_id) }))
          : [];
        setFavorites(normalized);
        setFavoritesLoaded(true);
        console.log('[Favoritos][WEB] Restaurado do localStorage:', normalized);
      } catch {
        setFavorites([]);
        setFavoritesLoaded(true);
        console.log('[Favoritos][WEB] Erro ao restaurar do localStorage, setando []');
      }
    } else {
      AsyncStorage.getItem('favorites').then(stored => {
        console.log('[Favoritos] Valor bruto AsyncStorage:', stored);
        try {
          const parsed = stored ? JSON.parse(stored) : [];
          // Garante que todos os product_id sejam number
          const normalized = Array.isArray(parsed)
            ? parsed.map(f => ({ ...f, product_id: Number(f.product_id) }))
            : [];
          setFavorites(normalized);
          setFavoritesLoaded(true);
          console.log('[Favoritos] Restaurado do AsyncStorage:', normalized);
        } catch {
          setFavorites([]);
          setFavoritesLoaded(true);
          console.log('[Favoritos] Erro ao restaurar do AsyncStorage, setando []');
        }
      });
    }
  }, []);

  // Salva favoritos no AsyncStorage/localStorage sempre que mudar, mas só após restaurar
  useEffect(() => {
    if (!favoritesLoaded) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('favorites', JSON.stringify(favorites));
      console.log('[Favoritos][WEB] Estado atualizado e persistido no localStorage:', favorites);
    } else {
      AsyncStorage.setItem('favorites', JSON.stringify(favorites)).then(() => {
        console.log('[Favoritos] Estado atualizado e persistido:', favorites);
      });
    }
  }, [favorites, favoritesLoaded]);



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

  // Filtra produtos por categoria, favoritos e busca
  React.useEffect(() => {
    let filteredList = products;
    if (selectedCategory === FAVORITES_ID) {
      // Filtra apenas favoritos
      const favIds = favorites.map(f => Number(f.product_id));
      filteredList = filteredList.filter(p => favIds.includes(Number(p.id)));
    } else if (selectedCategory) {
      filteredList = filteredList.filter(p => p.category_id === selectedCategory);
    }
    if (search) {
      filteredList = filteredList.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    setFiltered(filteredList);
  }, [products, selectedCategory, search, favorites]);

  function renderProduct({ item }: { item: any }) {
    const sharedId = `product-image-${item.id}`;
    const isFav = Array.isArray(favorites) ? favorites.some((f: Favorite) => Number(f.product_id) === Number(item.id)) : false;
    const inCart = Array.isArray(cart) ? cart.some((p: any) => p.id === item.id) : false;
    const categoryObj = Array.isArray(categories) ? categories.find((c: any) => c.id === item.category_id) : null;
    const category_name = categoryObj ? categoryObj.name : '';
    // Card visual unificado para grid e lista
    const isGrid = viewType === 'grid';
    if (isGrid) {
      // grid visual padrão
      return (
        <TouchableOpacity
          style={styles.gridCard}
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/detalhes', params: { ...item, sharedId, description: item.description, stock_quantity: item.stock_quantity, is_active: item.is_active, category_name } })}
        >
          <View style={styles.imageContainer}>
            {Platform.OS === 'web' || !SharedElement ? (
              item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.gridImage} />
              ) : (
                <Image source={require('../../assets/images/placeholder-Products.jpg')} style={styles.gridImage} />
              )
            ) : (
              <SharedElement id={sharedId} style={styles.gridImage} onNode={() => {}}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.gridImage} />
                ) : (
                  <Image source={require('../../assets/images/placeholder-Products.jpg')} style={styles.gridImage} />
                )}
              </SharedElement>
            )}
            {user && (
              <TouchableOpacity
                style={styles.favoriteBtn}
                onPressIn={() => {
                  console.log('Favorito clicado', item.id);
                  handleToggleFavorite(item.id);
                }}
              >
                {isFav ? (
                  <MCIcon name="heart" size={20} color="#FF7A00" />
                ) : (
                  <MCIcon name="heart-outline" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.gridCardContent}>
            <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.gridPrice}>MZN {item.price}</Text>
            <TouchableOpacity
              style={[styles.gridCartBtn, inCart && styles.cartBtnInCart]}
              onPress={() => handleToggleCart(item)}
            >
              <Icon name={inCart ? 'check' : 'shopping-cart'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
    // LISTA: favorito no topo à direita, carrinho embaixo à direita
    return (
      <TouchableOpacity
        style={[styles.gridCard, { flexDirection: 'row', alignItems: 'center', padding: 12, height: 140 }]}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/detalhes', params: { ...item, sharedId, description: item.description, stock_quantity: item.stock_quantity, is_active: item.is_active, category_name } })}
      >
        <View style={{ width: 100, height: 100, marginRight: 16, position: 'relative' }}>
          {Platform.OS === 'web' || !SharedElement ? (
            item.image_url ? (
              <Image source={{ uri: item.image_url }} style={[styles.gridImage, { width: 100, height: 100, borderRadius: 12 }]} />
            ) : (
              <Image source={require('../../assets/images/placeholder-Products.jpg')} style={[styles.gridImage, { width: 100, height: 100, borderRadius: 12 }]} />
            )
          ) : (
            <SharedElement id={sharedId} style={[styles.gridImage, { width: 100, height: 100, borderRadius: 12 }]} onNode={() => {}}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={[styles.gridImage, { width: 100, height: 100, borderRadius: 12 }]} />
              ) : (
                <Image source={require('../../assets/images/placeholder-Products.jpg')} style={[styles.gridImage, { width: 100, height: 100, borderRadius: 12 }]} />
              )}
            </SharedElement>
          )}
        </View>
        <View style={{ flex: 1, height: 100, justifyContent: 'space-between', position: 'relative' }}>
          {/* Favorito no topo à direita */}
          {user && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: 6 }}
              onPressIn={() => {
                console.log('Favorito clicado', item.id);
                handleToggleFavorite(item.id);
              }}
            >
              {isFav ? (
                <MCIcon name="heart" size={20} color="#FF7A00" />
              ) : (
                <MCIcon name="heart-outline" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
          {/* Nome e preço à esquerda */}
          <View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', marginTop: 0 }}>
            <Text style={[styles.gridName, { fontSize: 16, marginBottom: 6 }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.gridPrice, { fontSize: 18, marginBottom: 0 }]}>MZN {item.price}</Text>
          </View>
          {/* Carrinho embaixo à direita */}
          <TouchableOpacity
            style={[
              styles.gridCartBtn,
              inCart && styles.cartBtnInCart,
              { width: 40, height: 40, borderRadius: 20, position: 'absolute', bottom: 0, right: 0 }
            ]}
            onPress={() => handleToggleCart(item)}
          >
            <Icon name={inCart ? 'check' : 'shopping-cart'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header e busca em modo relativo para web/mobile */}
      <View style={{ position: 'relative', zIndex: 2 }}>
        <LinearGradient colors={["#008A44", "#00C851"]} style={[styles.header, { zIndex: 2, position: 'relative', top: 0, left: 0, right: 0, elevation: 10 }] /* header sempre acima */}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => {
                if (navigation && navigation.dispatch) {
                  navigation.dispatch(DrawerActions.openDrawer());
                } else if (router && router.canGoBack()) {
                  router.back();
                }
              }}
              style={styles.cartIconBtn}
            >
              <Icon name="menu" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Perpi</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.cartIconBtn}
                onPress={() => router.push('/cart')}
              >
                <Icon name="shopping-cart" size={24} color="#fff" />
                {cart.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cartIconBtn, { marginLeft: 8, padding: 0, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => {
                  if (user) {
                    router.push('/profile');
                  } else {
                    router.push('/login');
                  }
                }}
              >
                {profile && profile.profile_picture_url ? (
                  <Image
                    source={{ uri: profile.profile_picture_url }}
                    style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#fff', backgroundColor: '#eee' }}
                    resizeMode="cover"
                  />
                ) : profile && (profile.nome || profile.email) ? (
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' }}>
                    <Text style={{ fontWeight: 'bold', color: '#008A44', fontSize: 16 }}>
                      {((profile.nome || profile.email || '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2))}
                    </Text>
                  </View>
                ) : (
                  <MCIcon name="account-circle" size={28} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        <Animated.View
          style={[
            styles.searchContainer,
            {
              position: 'relative',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              transform: [{ translateY: searchAnim }],
              elevation: 2,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={styles.searchInnerBox}>
            <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar produtos..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Conteúdo scrollável com marginTop para compensar header e busca */}
        <ScrollView
          style={[styles.scrollableContent, { marginTop: -210 }]} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={handleScroll}
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
          
          {/* Lista de produtos ou skeleton */}
          {loading ? (
            <ProductsSkeleton />
          ) : (
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
              scrollEnabled={false}
              scrollToOverflowEnabled={true}
            />
          )}
        </ScrollView>
      </View>
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
    backgroundColor: '#00C851',
    borderRadius: 0,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 10,
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    justifyContent: 'center',
    minHeight: 72,
    paddingVertical: 14,
    width: '100%',
    paddingHorizontal: 16,
  },
  searchInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    flex: 1,
    height: 44,
    maxWidth: 480,
    minWidth: 0,
  },
  searchIcon: {
    marginRight: 8,
    color: '#888',
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 0, 
    fontSize: 16, 
    color: '#1A1A1A',
    backgroundColor: 'transparent',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
    marginTop: 180,
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
    borderRadius: 16, // igual ao favoriteBtn
    width: 32, // igual ao favoriteBtn
    height: 32, // igual ao favoriteBtn
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    // elevation: 2, // removido para tirar sombra
    // shadowColor: '#000', // removido para tirar sombra
    // shadowOffset: { width: 0, height: 2 }, // removido para tirar sombra
    // shadowOpacity: 0.1, // removido para tirar sombra
    // shadowRadius: 4, // removido para tirar sombra
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
  listCartBtn: {
    backgroundColor: '#FF7A00',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    // elevation: 2, // removido para tirar sombra
    // shadowColor: '#000', // removido para tirar sombra
    // shadowOffset: { width: 0, height: 2 }, // removido para tirar sombra
    // shadowOpacity: 0.1, // removido para tirar sombra
    // shadowRadius: 4, // removido para tirar sombra
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
