import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import AppHeader from '../../components/AppHeader';

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  estimatedTime: string;
  coordinates: { lat: number; lng: number };
}

export default function EntregadorScreen() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Simulando dados de pedidos para entrega
      const mockOrders: DeliveryOrder[] = [
        {
          id: '001',
          customerName: 'Maria Silva',
          customerPhone: '+258 84 123 4567',
          address: 'Rua da Paz, 123, Bairro Central, Beira',
          items: [
            { name: 'Pizza Margherita', quantity: 2, price: 450 },
            { name: 'Refrigerante 2L', quantity: 1, price: 120 },
          ],
          totalAmount: 1020,
          status: 'assigned',
          estimatedTime: '25 min',
          coordinates: { lat: -19.8347, lng: 34.8516 },
        },
        {
          id: '002',
          customerName: 'João Santos',
          customerPhone: '+258 82 987 6543',
          address: 'Av. Eduardo Mondlane, 456, Manga, Beira',
          items: [
            { name: 'Hambúrguer Especial', quantity: 1, price: 380 },
            { name: 'Batata Frita', quantity: 1, price: 150 },
          ],
          totalAmount: 530,
          status: 'picked_up',
          estimatedTime: '15 min',
          coordinates: { lat: -19.8294, lng: 34.8442 },
        },
        {
          id: '003',
          customerName: 'Ana Costa',
          customerPhone: '+258 86 555 7890',
          address: 'Rua dos Trabalhadores, 789, Munhava, Beira',
          items: [
            { name: 'Frango Grelhado', quantity: 1, price: 320 },
            { name: 'Arroz Branco', quantity: 1, price: 80 },
            { name: 'Salada Mista', quantity: 1, price: 100 },
          ],
          totalAmount: 500,
          status: 'in_transit',
          estimatedTime: '8 min',
          coordinates: { lat: -19.8403, lng: 34.8573 },
        },
      ];
      
      setTimeout(() => {
        setOrders(mockOrders);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = (orderId: string, newStatus: DeliveryOrder['status']) => {
    Alert.alert(
      'Confirmar Status',
      `Deseja marcar o pedido #${orderId} como "${getStatusLabel(newStatus)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setOrders(prev =>
              prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
              )
            );
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return 'Atribuído';
      case 'picked_up': return 'Coletado';
      case 'in_transit': return 'Em Trânsito';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return '#FFA500';
      case 'picked_up': return '#2196F3';
      case 'in_transit': return '#FF9800';
      case 'delivered': return '#4CAF50';
      default: return '#666';
    }
  };

  const getNextStatus = (currentStatus: DeliveryOrder['status']): DeliveryOrder['status'] | null => {
    switch (currentStatus) {
      case 'assigned': return 'picked_up';
      case 'picked_up': return 'in_transit';
      case 'in_transit': return 'delivered';
      case 'delivered': return null;
      default: return null;
    }
  };

  const openMap = (order: DeliveryOrder) => {
    router.push({
      pathname: '/order-tracking',
      params: { orderId: order.id }
    });
  };

  const renderOrder = ({ item: order }: { item: DeliveryOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Pedido #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>👤 {order.customerName}</Text>
        <Text style={styles.customerPhone}>📞 {order.customerPhone}</Text>
        <Text style={styles.address}>📍 {order.address}</Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>Itens:</Text>
        {order.items.map((item, index) => (
          <Text key={index} style={styles.itemText}>
            • {item.quantity}x {item.name} - {item.price} MZN
          </Text>
        ))}
        <Text style={styles.totalAmount}>
          Total: {order.totalAmount} MZN
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={styles.mapButton}
          onPress={() => openMap(order)}
        >
          <Text style={styles.mapButtonText}>🗺️ Ver no Mapa</Text>
        </Pressable>

        {getNextStatus(order.status) && (
          <Pressable
            style={[styles.statusButton, { backgroundColor: getStatusColor(getNextStatus(order.status)!) }]}
            onPress={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
          >
            <Text style={styles.statusButtonText}>
              Marcar como {getStatusLabel(getNextStatus(order.status)!)}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.timeEstimate}>
        <Text style={styles.timeText}>⏱️ Tempo estimado: {order.estimatedTime}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Painel do Entregador" />
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'assigned').length}</Text>
          <Text style={styles.statLabel}>Novos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'in_transit').length}</Text>
          <Text style={styles.statLabel}>Em Trânsito</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{orders.filter(o => o.status === 'delivered').length}</Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  orderItems: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  timeEstimate: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
