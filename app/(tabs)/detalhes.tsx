export const options = {
  title: 'Detalhes do Produto',
  headerTransparent: true,
  headerTintColor: '#fff',
  headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
  headerStyle: { backgroundColor: 'transparent' },
  headerShadowVisible: false
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}
// ...existing code...

// Espera receber os dados do produto via params
export default function ProductDetailScreen() {
  // Centraliza leitura do carrinho e atualização de estados
  async function syncCartState() {
    const data = await AsyncStorage.getItem('cart');
    const paramId = String(params.id);
    if (data) {
      try {
        const arr = JSON.parse(data);
        setCart(arr);
        setCartCount(Array.isArray(arr) ? arr.length : 0);
        const inCart = arr.some((item: any) => String(item.id) === paramId);
        setIsInCart(inCart);
      } catch (e) {
        setCart([]);
        setCartCount(0);
        setIsInCart(false);
      }
    } else {
      setCart([]);
      setCartCount(0);
      setIsInCart(false);
    }
  }
  const router = useRouter();
  const params = useLocalSearchParams();
  const [imageLoading, setImageLoading] = useState(true);
  // Local cart state
  const [cart, setCart] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  // Sincroniza carrinho ao focar a tela e escuta evento de atualização
  React.useEffect(() => {
    syncCartState();
    const handler = () => syncCartState();
    window.addEventListener('cartUpdated', handler);
    return () => {
      window.removeEventListener('cartUpdated', handler);
    };
  }, []);

  // Sincroniza carrinho ao focar a tela de detalhes
  useFocusEffect(
    React.useCallback(() => {
      syncCartState();
    }, [params.id])
  );
  const [added, setAdded] = useState(false);

  // Extrair e converter parâmetros para os tipos corretos
  const name = params.name ? String(params.name) : '';
  const price = params.price ? Number(params.price) : 0;
  const image_url = params.image_url ? String(params.image_url) : '';
  const sharedId = params.sharedId ? String(params.sharedId) : '';
  const description = params.description ? String(params.description) : '';
  const stock_quantity = params.stock_quantity ? Number(params.stock_quantity) : 0;
  let is_active = false;
  if (typeof params.is_active === 'string') {
    is_active = params.is_active === 'true';
  } else if (typeof params.is_active === 'boolean') {
    is_active = params.is_active;
  } else if (Array.isArray(params.is_active)) {
    is_active = params.is_active[0] === 'true';
  }
  const category_id = params.category_id ? String(params.category_id) : '';
  const category_name = params.category_name ? String(params.category_name) : '';

  // Estado para controlar se o botão está processando
  const [processing, setProcessing] = useState(false);

  // Adiciona ou remove do carrinho, sempre lendo do AsyncStorage
  function handleAddOrRemoveCart() {
    if (stock_quantity <= 0 || processing) {
      return;
    }
    setProcessing(true);
    const normalized = {
      id: String(params.id),
      name,
      price,
      image_url,
      quantity: 1
    };
    AsyncStorage.getItem('cart').then(stored => {
      let currentCart: typeof normalized[] = [];
      if (stored) {
        try {
          currentCart = JSON.parse(stored);
        } catch (e) {}
      }
      // Normaliza comparação: id, name e price
      const isSameProduct = (item: typeof normalized) => {
        return String(item.id) === normalized.id || (item.name === normalized.name && item.price === normalized.price);
      };
      const exists = currentCart.find(isSameProduct);
      let newCart: typeof normalized[];
      if (!exists) {
        // Adiciona apenas se não existe produto igual
        newCart = [...currentCart.filter(item => !isSameProduct(item)), normalized];
        AsyncStorage.setItem('cart', JSON.stringify(newCart)).then(() => {
          setAdded(true);
          setProcessing(false);
          syncCartState();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cartUpdated'));
          }
          setTimeout(() => setAdded(false), 1200);
        });
      } else {
        // Remove todos os produtos iguais
        newCart = currentCart.filter(item => !isSameProduct(item));
        AsyncStorage.setItem('cart', JSON.stringify(newCart)).then(() => {
          setAdded(false);
          setProcessing(false);
          syncCartState();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cartUpdated'));
          }
        });
      }
    });
  }
  // Estado para refletir se o item está no carrinho (sempre atualizado)
  const [isInCart, setIsInCart] = useState(false);

  // Atualiza isInCart sempre que cart ou params.id mudam
  React.useEffect(() => {
    AsyncStorage.getItem('cart').then(stored => {
      let currentCart: any[] = [];
      if (stored) {
        try {
          currentCart = JSON.parse(stored);
        } catch (e) {
          console.log('[useEffect cart] error parsing cart:', e);
        }
      }
      const paramId = String(params.id);
      const inCart = currentCart.some(item => String(item.id) === paramId);
      setIsInCart(inCart);
    });
  }, [cart, params.id]);
  // ...existing code...

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" translucent />
      {/* Top bar: back button + cart icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: Platform.OS === 'ios' ? 50 : 45, left: 20, right: 20, zIndex: 10 }}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/cart')}
          style={{ marginRight: 0, padding: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', position: 'relative' }}
          accessibilityLabel="Abrir carrinho"
        >
          <Icon name="shopping-cart" size={24} color={'#fff'} />
          {cartCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#FF7A00',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' }}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#008A44" />
            </View>
          )}
          {Platform.OS === 'web' || !SharedElement ? (
            <>
              <Image 
                source={{ uri: image_url }}
                style={styles.image} 
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
                style={styles.imageGradient}
              />
            </>
          ) : (
            <SharedElement id={sharedId} style={styles.image}>
              <Image 
                source={{ uri: image_url }}
                style={styles.image} 
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 'transparent']}
                style={styles.imageGradient}
              />
            </SharedElement>
          )}
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.headerInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>
                  {stock_quantity > 0 ? `${stock_quantity} em estoque` : 'Esgotado'}
                </Text>
              </View>
            </View>
            <Text style={styles.price}>MZN {price.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.descriptionContainer}>
    <View style={styles.sectionTitleContainer}>
      <Icon name="file-text" size={18} color="#008A44" />
      <Text style={styles.sectionTitle}>Descrição</Text>
    </View>
    <Text style={styles.description}>{description}</Text>
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <View style={styles.detailIconContainer}>
          <Icon name="archive" size={18} color="#008A44" />
        </View>
        <Text style={styles.detailLabel}>Estoque:</Text>
        <Text style={styles.detailValue}>{stock_quantity}</Text>
      </View>
      <View style={styles.detailRow}>
        <View style={styles.detailIconContainer}>
          <Icon name="check-circle" size={18} color="#008A44" />
        </View>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={[styles.detailValue, {color: is_active ? '#008A44' : '#FF3B30'}]}>
          {is_active ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
      {category_name && (
        <View style={styles.detailRow}>
          <View style={styles.detailIconContainer}>
            <Icon name="tag" size={18} color="#008A44" />
          </View>
          <Text style={styles.detailLabel}>Categoria:</Text>
          <Text style={styles.detailValue}>{category_name}</Text>
        </View>
      )}
    </View>
          </View>
          <TouchableOpacity 
            style={[styles.addToCartButton, (stock_quantity <= 0 || processing || (isInCart && !cart.some(item => item.id === params.id))) && styles.disabledButton]}
            disabled={stock_quantity <= 0 || processing}
            onPress={handleAddOrRemoveCart}
          >
            <LinearGradient
              colors={stock_quantity > 0 ? ['#FF7A00', '#FF9A40'] : ['#CCCCCC', '#AAAAAA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToCartGradient}
            >
              <Icon name="shopping-cart" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.addToCartText}>
                {stock_quantity <= 0
                  ? 'Produto Esgotado'
                  : isInCart
                    ? 'Remover do Carrinho'
                    : (added ? 'Adicionado!' : 'Adicionar ao Carrinho')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    // Sem sombra
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 45,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    padding: 0,
    backgroundColor: 'transparent',
    paddingBottom: 30,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -50, // Compensar o espaço do header transparente
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -50,
    paddingTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    flexShrink: 1,
  },
  stockBadge: {
    backgroundColor: 'rgba(0,138,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  stockText: {
    color: '#008A44',
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF7A00',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008A44',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#5C5C5C',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,138,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 8,
    width: 80,
  },
  detailValue: {
    fontSize: 15,
    color: '#5C5C5C',
    flex: 1,
    fontWeight: '500',
  },
  addToCartButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.8,
    shadowOpacity: 0.1,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
