import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
// import { useAuthUser } from '../hooks/useAuthUser';

export default function CartScreen() {
  const params = useLocalSearchParams();
  const [cartItems, setCartItems] = useState<any[]>([]);

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }

  function handleRemoveItem(itemId: number) {
    const newCart = cartItems.filter(item => item.id !== itemId);
    updateCart(newCart);
  }

  function handleChangeQty(itemId: number, delta: number, currentQty: number) {
    const newCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newQty = currentQty + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(item => item && item.quantity > 0);
    updateCart(newCart);
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

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
              <Image source={{ uri: item.image_url }} style={styles.cartItemImg} />
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
      <TouchableOpacity
        style={styles.buyBtn}
        onPress={() => alert('Compra realizada!')}
        disabled={cartItems.length === 0}
      >
        <Text style={styles.buyBtnText}>Comprar</Text>
      </TouchableOpacity>
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
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
