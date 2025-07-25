import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuthUser } from '../hooks/useAuthUser';

export default function OrdersScreen() {
  const authUser = useAuthUser();
  const USER_ID = authUser?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<{ [orderId: number]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!USER_ID) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', USER_ID)
        .order('created_at', { ascending: false });
      console.log('[DEBUG] orders:', data);
      if (error) setError(error.message);
      else setOrders(data || []);
      setLoading(false);
      // Fetch order items for each order
      if (data && data.length > 0) {
        const orderIds = data.map((order: any) => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        console.log('[DEBUG] order_items:', itemsData);
        if (!itemsError && itemsData) {
          // Fetch products for all items
          const productIds = [...new Set(itemsData.map((item: any) => item.product_id))];
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, image_url')
            .in('id', productIds);
          console.log('[DEBUG] products:', productsData);
          // Group items by order_id and attach product info
          const grouped: { [orderId: number]: any[] } = {};
          itemsData.forEach((item: any) => {
            const product = productsData?.find((p: any) => p.id === item.product_id);
            if (!grouped[item.order_id]) grouped[item.order_id] = [];
            grouped[item.order_id].push({ ...item, product });
          });
          console.log('[DEBUG] grouped:', grouped);
          setOrderItems(grouped);
        }
      }
    })();
  }, [USER_ID]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Compras</Text>
      {loading ? (
        <Text>Carregando...</Text>
      ) : error ? (
        <Text style={styles.error}>Erro: {error}</Text>
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>Você ainda não fez nenhuma compra.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderId}>Pedido #{item.id}</Text>
              <Text>Status: {item.order_status}</Text>
              <Text>Total: MZN {item.total_amount}</Text>
              <Text>Data: {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</Text>
              <Text>Endereço: {item.endereco_entrega}, {item.cidade_entrega}</Text>
              <Text>Coordenadas: {item.latitude_entrega}, {item.longitude_entrega}</Text>
              {orderItems[item.id] && orderItems[item.id].length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Itens comprados:</Text>
                  {orderItems[item.id].map((orderItem: any) => (
                    <View key={orderItem.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 8 }}>
                      {orderItem.product?.image_url && (
                        <View style={{ marginRight: 8 }}>
                          <Image source={{ uri: orderItem.product.image_url }} style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#F3F3F3' }} />
                        </View>
                      )}
                      <Text>- {orderItem.product?.name || 'Produto'} x{orderItem.quantity} (MZN {orderItem.price_at_purchase})</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#008A44', marginBottom: 20, textAlign: 'center' },
  error: { color: 'red', textAlign: 'center', marginVertical: 10 },
  empty: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
  orderItem: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 1 },
  orderId: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#008A44' },
});
