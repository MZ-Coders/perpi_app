// Removendo as opções locais para usar as definidas no _layout.tsx
// export const options = {
//   title: 'Detalhes do Produto',
//   headerTransparent: true,
//   headerTintColor: '#fff',
//   headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
//   headerStyle: { backgroundColor: 'transparent' },
//   headerShadowVisible: false,
//   headerLeft: () => null // Remove o botão padrão do drawer
// };
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { DeviceEventEmitter, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ParallaxScrollView from '../../components/ParallaxScrollView';
import AppHeaderTransparent from '@/components/AppHeaderTransparent';
import { emitCartUpdated, listenToCartUpdates } from '../../utils/cartEvents';

const { width } = Dimensions.get('window');
let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}

// Espera receber os dados do produto via params
export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [imageLoading, setImageLoading] = useState(true);
  // Local cart state
  const [cart, setCart] = useState<any[]>([]);
  // Quantidade selecionada (default 1, mas se já existe no carrinho, usa a do carrinho)
  const [qty, setQty] = useState(1);
  // Função para recarregar o carrinho do AsyncStorage
  const reloadCart = React.useCallback(() => {
    AsyncStorage.getItem('cart').then(data => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          // Normaliza todos os ids para número
          const normalized = Array.isArray(parsed) ? parsed.map((item: any) => ({ ...item, id: Number(item.id) })) : [];
          console.log('[detalhes] reloadCart: cart from storage', normalized);
          setCart(normalized);
          // Se o produto já está no carrinho, setar a quantidade inicial igual à do carrinho
          const exists = normalized.find((item: any) => Number(item.id) === Number(params.id));
          if (exists) {
            setQty(exists.quantity);
            console.log('[detalhes] reloadCart: item encontrado no carrinho', exists);
          } else {
            setQty(1);
            console.log('[detalhes] reloadCart: item NÃO encontrado no carrinho');
          }
        } catch (e) {
          setCart([]);
          setQty(1);
          console.log('[detalhes] reloadCart: erro ao parsear cart', e);
        }
      } else {
        setCart([]);
        setQty(1);
        console.log('[detalhes] reloadCart: cart vazio');
      }
    });
  }, [params.id]);

  // Atualiza status do item ao entrar na tela
  useFocusEffect(reloadCart);

  // Escuta eventos de atualização global do carrinho
  React.useEffect(() => {
    return listenToCartUpdates(reloadCart);
  }, [reloadCart]);
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

  // Adiciona ao carrinho (apenas se não existe)
  async function handleAddToCart() {
    await reloadCart(); // Garante estado mais recente
    const exists = cart.find(item => Number(item.id) === Number(params.id));
    console.log('[detalhes] handleAddToCart: cart antes', cart);
    if (stock_quantity <= 0 || exists) {
      console.log('[detalhes] handleAddToCart: não adicionou, já existe ou sem estoque');
      return;
    }
    const newCart = [...cart, { id: Number(params.id), name, price, image_url, quantity: qty }];
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
    console.log('[detalhes] handleAddToCart: cart depois', newCart);
    
    // Dispara evento para atualização instantânea em todos os headers
    emitCartUpdated();
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  // Remove do carrinho
  async function handleRemoveFromCart() {
    await reloadCart();
    console.log('[detalhes] handleRemoveFromCart: cart antes', cart);
    const newCart = cart.filter(item => Number(item.id) !== Number(params.id));
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
    console.log('[detalhes] handleRemoveFromCart: cart depois', newCart);
    
    // Dispara evento para atualização instantânea em todos os headers
    emitCartUpdated();
  }

  // Atualiza quantidade do produto no carrinho
  async function handleUpdateQty(newQty: number) {
    await reloadCart();
    if (newQty < 1 || newQty > stock_quantity) {
      console.log('[detalhes] handleUpdateQty: quantidade inválida', newQty);
      return;
    }
    setQty(newQty);
    const exists = cart.find(item => Number(item.id) === Number(params.id));
    if (exists) {
      const newCart = cart.map(item => Number(item.id) === Number(params.id) ? { ...item, quantity: newQty } : item);
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
      console.log('[detalhes] handleUpdateQty: cart depois', newCart);
      
      // Dispara evento para atualização instantânea em todos os headers
      emitCartUpdated();
    } else {
      console.log('[detalhes] handleUpdateQty: item não existe no carrinho');
    }
  }

  // Verifica se o produto já está no carrinho (sempre baseado no estado mais recente)
  const productInCart = React.useMemo(() => cart.find(item => Number(item.id) === Number(params.id)), [cart, params.id]);

  return (
    <View style={styles.mainContainer}>
      <AppHeaderTransparent />
      <ParallaxScrollView
        headerImage={
          Platform.OS === 'web' || !SharedElement ? (
            <Image
              source={image_url ? { uri: image_url } : require('../../assets/images/placeholder-Products.jpg')}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          ) : (
            <SharedElement id={sharedId} style={styles.image}>
              <Image
                source={image_url ? { uri: image_url } : require('../../assets/images/placeholder-Products.jpg')}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </SharedElement>
          )
        }
        headerBackgroundColor={{ light: '#F8F9FA', dark: '#1A1A1A' }}
      >

      </ParallaxScrollView>
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
            <Text style={styles.description}>
              {description.trim() ? description : 'Sem descrição disponível para este produto.'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailsContainer}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="info" size={18} color="#008A44" />
              <Text style={styles.sectionTitle}>Informações do Produto</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="tag" size={18} color="#008A44" />
              </View>
              <Text style={styles.detailLabel}>Categoria:</Text>
              <Text style={styles.detailValue}>{category_name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Icon name="package" size={18} color="#008A44" />
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
          </View>
          {/* Linha com quantidade e controles de carrinho */}
          <View style={styles.qtyCartRow}>
            <View style={styles.qtyControlsRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (productInCart) {
                    handleUpdateQty(qty - 1);
                  } else {
                    setQty(q => Math.max(1, q - 1));
                  }
                }}
                disabled={qty <= 1}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (productInCart) {
                    handleUpdateQty(qty + 1);
                  } else {
                    setQty(q => Math.min(stock_quantity, q + 1));
                  }
                }}
                disabled={qty >= stock_quantity}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            {/* Se não está no carrinho, mostra botão Adicionar. Se já está, mostra botão Remover */}
            {!productInCart ? (
              <TouchableOpacity 
                style={[styles.addToCartButtonInline, stock_quantity <= 0 && styles.disabledButton]}
                disabled={stock_quantity <= 0}
                onPress={handleAddToCart}
              >
                <LinearGradient
                  colors={stock_quantity > 0 ? ['#FF7A00', '#FF9A40'] : ['#CCCCCC', '#AAAAAA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addToCartGradientInline}
                >
                  <Text style={styles.addToCartText}>
                    {stock_quantity > 0 ? (added ? 'Adicionado!' : 'Adicionar ao Carrinho') : 'Produto Esgotado'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.addToCartButtonInline, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF3B30' }]}
                onPress={handleRemoveFromCart}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF7A00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addToCartGradientInline}
                >
                  <Text style={[styles.addToCartText, { color: '#fff' }]}>Remover do Carrinho</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
    </View>
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative',
    paddingTop: 0, // Garantir que não haja padding no topo
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
    top: Platform.OS === 'ios' ? 60 : 45, // Ajustado para ficar abaixo do header
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
    paddingTop: 0, // Garantir que não haja padding no topo
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
    marginTop: Platform.OS === 'ios' ? -50 : -30, // Ajustado para compensar o header
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
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -70, // Ajustado para sobrepor ligeiramente a imagem
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0,
    zIndex: 99999,
    padding: 20,
    // width: '100%',
    // alignSelf: 'stretch',
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
  qtyCartRow: {
    flexDirection: 'row',
    alignItems: 'center', // já estava, mas mantido para clareza
    justifyContent: 'center', // centraliza horizontalmente
    gap: 12,
    backgroundColor: '#111',
    borderRadius: 18,
    padding: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  qtyControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Removido marginBottom/marginTop para melhor alinhamento vertical
  },
  qtyBtn: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: '#fff',
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartButtonInline: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 120,
    marginLeft: 12,
    height: 40,
    justifyContent: 'center',
  },
  addToCartGradientInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 12,
    height: 40,
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
