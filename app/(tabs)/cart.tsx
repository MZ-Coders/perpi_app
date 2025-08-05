import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppHeaderTransparent from '../../components/AppHeaderTransparent';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';
import { emitCartUpdated } from '../../utils/cartEvents';

export default function CartScreen() {
  const router = useRouter();
  const authUser = useAuthUser();
  const user = authUser ? authUser : null;
  const USER_ID = user?.id;

  // Estado de loading
  const [loading, setLoading] = useState(false);

  // Estado do carrinho
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Estado de sucesso
  const [success, setSuccess] = useState(false);

  // Animação de sucesso
  const successAnimation = React.useRef(new Animated.Value(0)).current;
  const successScaleAnimation = React.useRef(new Animated.Value(0.8)).current;

  // Estado do modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Animação do modal
  const modalAnimation = React.useRef(new Animated.Value(0)).current;
  const scaleAnimation = React.useRef(new Animated.Value(0.7)).current;

  // Função para abrir modal de confirmação
  function showPurchaseConfirmation() {
    setShowConfirmModal(true);
    // Animar entrada do modal
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // Função para fechar modal de confirmação
  function hideConfirmModal() {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowConfirmModal(false);
    });
  }

  async function handleRealPurchase() {
    // Fechar modal de confirmação primeiro
    hideConfirmModal();
    
    if (!USER_ID) return;
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      if (sessionData?.user?.id !== USER_ID) {
        setLoading(false);
        return;
      }
      // Buscar endereço e coordenadas do usuário
      const { data: userData, error: userError } = await supabase
        .from('users_')
        .select('endereco, cidade, provincia, pais, latitude, longitude')
        .eq('id', USER_ID)
        .single();
      if (userError || !userData) throw userError || new Error('Endereço do usuário não encontrado');

      // 1. Criar pedido com endereço completo
      const totalAmount = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          total_amount: totalAmount,
          order_status: 'pending',
          payment_method: 'mpesa',
          payment_status: 'pending',
          customer_id: USER_ID,
          endereco_entrega: userData.endereco,
          cidade_entrega: userData.cidade,
          provincia_entrega: userData.provincia,
          pais_entrega: userData.pais,
          latitude_entrega: userData.latitude,
          longitude_entrega: userData.longitude
        })
        .select()
        .single();
      if (orderError || !order) throw orderError || new Error('Order creation failed');

      // 2. Adicionar itens do pedido
      const orderItemsPayload = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity || 1,
        price_at_purchase: item.price
      }));
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      // 3. Criar transação (opcional)
      await supabase
        .from('transactions')
        .insert({
          order_id: order.id,
          amount: totalAmount,
          transaction_type: 'purchase',
          payment_method: 'mpesa',
          transaction_status: 'pending',
          user_id: USER_ID
        });

      // 4. Limpar carrinho
      updateCart([]);
    setLoading(false);
    setSuccess(true);
    
    // Animar entrada da mensagem de sucesso
    Animated.parallel([
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(successScaleAnimation, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Sinaliza sucesso para a tela de pedidos (cross-plataforma)
    await AsyncStorage.setItem('showOrderSuccess', '1');
    setTimeout(() => {
      // Animar saída
      Animated.parallel([
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successScaleAnimation, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSuccess(false);
        router.back();
      });
    }, 2500);
    } catch (err) {
      setLoading(false);
      // Exibe erro simples na tela
      setSuccess(false);
    }
  }

  // Sempre que a tela ganhar foco, recarrega o carrinho do AsyncStorage
  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem('cart').then(stored => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCartItems(Array.isArray(parsed) ? parsed : []);
          } catch {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      });
    }, [])
  );

  function updateCart(newCart: any[]) {
    setCartItems(newCart);
    AsyncStorage.setItem('cart', JSON.stringify(newCart));
    // Dispara evento para atualização global do carrinho
    emitCartUpdated();
  }

  function handleRemoveItem(itemId: number) {
    const newCart = cartItems.filter(item => item && item.id !== itemId);
    updateCart(newCart);
  }

  function handleChangeQty(itemId: number, delta: number, currentQty: number) {
    const newCart = cartItems.map(item => {
      if (item && item.id === itemId) {
        let qty = typeof item.quantity === 'number' ? item.quantity : 1;
        const newQty = qty + delta;
        if (newQty > 0) {
          return { ...item, quantity: newQty };
        } else {
          return null;
        }
      }
      return item;
    }).filter(item => item && item.quantity > 0);
    updateCart(newCart);
  }

  // Corrigir cálculo do total do carrinho
  const cartTotal = cartItems.reduce((sum: number, item: any) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <AppHeaderTransparent onBack={() => router.back()} showCart={false} />
      </View>
      <View style={{ height: 80 }} />
      <Text style={styles.title}>Meu Carrinho</Text>
      {success && (
        <Animated.View 
          style={[
            styles.successContainer,
            {
              opacity: successAnimation,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.successCard,
              {
                transform: [{ scale: successScaleAnimation }],
                opacity: successAnimation,
              }
            ]}
          >
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Compra Realizada!</Text>
            <Text style={styles.successMessage}>
              Seu pedido foi confirmado com sucesso e já está sendo preparado.
            </Text>
            <View style={styles.successDivider} />
            <Text style={styles.successSubtext}>
              Você pode acompanhar o status do seu pedido na aba "Pedidos"
            </Text>
          </Animated.View>
        </Animated.View>
      )}
      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cartItemRow}>
              <Image
                source={item.image_url ? { uri: item.image_url } : require('../../assets/images/placeholder-Products.jpg')}
                style={styles.cartItemImgLarge}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.priceCart}>MZN {item.price}</Text>
                <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtnLarge} onPressOut={() => handleChangeQty(item.id, -1, item.quantity || 1)}>
                  <Text style={styles.qtyBtnTextLarge}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyTextLarge}>{item.quantity || 1}</Text>
                <TouchableOpacity style={styles.qtyBtnLarge} onPressOut={() => handleChangeQty(item.id, 1, item.quantity || 1)}>
                  <Text style={styles.qtyBtnTextLarge}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtnLarge} onPressOut={() => handleRemoveItem(item.id)}>
                  <Icon name="trash-2" size={28} style={styles.removeBtnIconLarge} />
                </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          style={{ maxHeight: 350 }}
        />
      )}
      <View style={styles.cartTotalRow}>
        <Text style={styles.cartTotalLabel}>Total:</Text>
        <Text style={styles.cartTotalValue}>
          MZN {cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
        </Text>
      </View>
      {user ? (
        <TouchableOpacity
          style={[styles.buyBtn, cartItems.length === 0 && { opacity: 0.6 }]}
          onPressOut={showPurchaseConfirmation}
          disabled={cartItems.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buyBtnText}>Comprar</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.buyBtn}
          onPressOut={() => router.push('/login')}
        >
          <Text style={styles.buyBtnText}>Fazer login para comprar</Text>
        </TouchableOpacity>
      )}

      {/* Modal de Confirmação de Compra */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="none"
        onRequestClose={hideConfirmModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={hideConfirmModal}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnimation }],
                opacity: modalAnimation,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Icon name="shopping-bag" size={48} color="#008A44" />
              <Text style={styles.modalTitle}>Confirmar Compra</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Você está prestes a finalizar sua compra com {cartItems.length} item(s) no valor total de:
              </Text>
              <Text style={styles.modalTotal}>
                MZN {cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
              </Text>
              <Text style={styles.modalSubtext}>
                Deseja continuar com o pagamento via M-Pesa?
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={hideConfirmModal}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleRealPurchase}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalConfirmText}>Confirmar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#008A44', marginBottom: 20, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cartItemImg: { width: 48, height: 48, borderRadius: 8, marginRight: 14, backgroundColor: '#FDFDFB' },
  cartItemImgLarge: { width: 64, height: 64, borderRadius: 12, marginRight: 18, backgroundColor: '#FDFDFB' },
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#1A1A1A' },
  priceCart: { color: '#008A44', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 2 },
  qtyBtnLarge: { backgroundColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8, marginHorizontal: 4, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#008A44' },
  qtyBtnTextLarge: { fontSize: 26, fontWeight: 'bold', color: '#008A44' },
  qtyText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: '#1A1A1A' },
  qtyTextLarge: { fontSize: 22, fontWeight: 'bold', marginHorizontal: 12, color: '#1A1A1A' },
  removeBtn: { marginLeft: 10, backgroundColor: '#FF7A00', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
  removeBtnLarge: { marginLeft: 14, backgroundColor: '#FF7A00', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 8, justifyContent: 'center', alignItems: 'center', minWidth: 48, minHeight: 48 },
  removeBtnIcon: { color: '#fff', fontSize: 18 },
  removeBtnIconLarge: { color: '#fff', fontSize: 28 },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderColor: '#E0E0E0' },
  cartTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#008A44' },
  cartTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF7A00' },
  buyBtn: { marginTop: 28, backgroundColor: '#FF7A00', borderRadius: 8, paddingVertical: 16, alignItems: 'center', elevation: 1 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  
  // Estilos da mensagem de sucesso
  successContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 138, 68, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 48,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#008A44',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#008A44',
    borderRadius: 2,
    marginBottom: 20,
  },
  successSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Estilos do Modal de Confirmação
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalTotal: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF7A00',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    color: '#5C5C5C',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#008A44',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#008A44',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});