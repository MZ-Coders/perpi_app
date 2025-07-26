import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, DeviceEventEmitter } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthUser } from '../hooks/useAuthUser';

export default function CartScreen() {
  const router = useRouter();
  const authUser = useAuthUser();
  const user = authUser ? authUser : null;
  const USER_ID = user?.id;
  // TODO: Replace with real address selection
  const DELIVERY_ADDRESS_ID = 1;

  // Estado do carrinho
  const [cartItems, setCartItems] = useState<any[]>([]);

  async function handleRealPurchase() {
    if (!USER_ID) {
      return;
    }
    if (cartItems.length === 0) return;
    const { data: sessionData } = await supabase.auth.getUser();
    if (sessionData?.user?.id !== USER_ID) {
      return;
    }
    try {
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
          // delivery_address_id: DELIVERY_ADDRESS_ID, // removido pois não existe
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
      // Compra realizada com sucesso
    } catch (err) {
      // Erro ao realizar compra
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
    DeviceEventEmitter.emit('cartUpdated');
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
      <Text style={styles.title}>Meu Carrinho</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>Seu carrinho está vazio.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cartItemRow}>
              <Image
                source={item.image_url ? { uri: item.image_url } : require('../assets/images/placeholder-Products.jpg')}
                style={styles.cartItemImg}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.priceCart}>MZN {item.price}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQty(item.id, -1, item.quantity || 1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => handleChangeQty(item.id, 1, item.quantity || 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveItem(item.id)}>
                    <Icon name="trash-2" size={18} style={styles.removeBtnIcon} />
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
          style={styles.buyBtn}
          onPress={handleRealPurchase}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.buyBtnText}>Comprar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buyBtnText}>Fazer login para comprar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#008A44', marginBottom: 20, textAlign: 'center' },
  emptyText: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cartItemImg: { width: 48, height: 48, borderRadius: 8, marginRight: 14, backgroundColor: '#FDFDFB' },
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#1A1A1A' },
  priceCart: { color: '#008A44', fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
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
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});