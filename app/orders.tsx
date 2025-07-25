import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { useAuthUser } from '../hooks/useAuthUser';

export default function OrdersScreen() {
  const authUser = useAuthUser();
  const USER_ID = authUser?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!USER_ID) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', USER_ID)
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setOrders(data || []);
      setLoading(false);
    }
    fetchOrders();
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
