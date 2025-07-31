import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';

// Types
interface Order {
  id: number;
  customer_id: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  endereco_entrega: string;
  cidade_entrega: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: {
    id: number;
    name: string;
    image_url: string;
  };
}

interface OrderItemsMap {
  [orderId: number]: OrderItem[];
}

interface ExpandedOrdersMap {
  [orderId: number]: boolean;
}

// Constants
const STATUS_COLORS = {
  delivered: '#34C759',
  preparing: '#FFCC00',
  cancelled: '#FF3B30',
  sent: '#008A44',
  pending: '#008A44',
} as const;

const STATUS_LABELS = {
  delivered: 'Entregue',
  preparing: 'Em preparação',
  cancelled: 'Cancelado',
  pending: 'Pendente',
  sent: 'Enviado',
} as const;

export default function OrdersScreen() {
  // Hooks
  const authUser = useAuthUser();
  const router = require('expo-router').useRouter();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<ExpandedOrdersMap>({});

  // Effects
  useEffect(() => {
    if (authUser?.id) {
      fetchOrdersWithItems();
    }
  }, [authUser?.id]);

  // Data fetching
  const fetchOrdersWithItems = async () => {
    if (!authUser?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authUser.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      setOrders(ordersData || []);

      // Fetch order items and products
      if (ordersData && ordersData.length > 0) {
        await fetchOrderItems(ordersData.map(order => order.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderIds: number[]) => {
    try {
      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;
      if (!itemsData) return;

      // Get unique product IDs
      const productIds = [...new Set(itemsData.map(item => item.product_id))];

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Group items by order_id and attach product info
      const grouped: OrderItemsMap = {};
      itemsData.forEach(item => {
        const product = productsData?.find(p => p.id === item.product_id);
        if (!grouped[item.order_id]) grouped[item.order_id] = [];
        grouped[item.order_id].push({ ...item, product });
      });

      setOrderItems(grouped);
    } catch (err) {
      console.error('Error fetching order items:', err);
    }
  };

  // Utility functions
  const getStatusColor = (status: string): string => {
    const normalizedStatus = status?.toLowerCase().replace('_', '') as keyof typeof STATUS_COLORS;
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.pending;
  };

  const getStatusText = (status: string): string => {
    const normalizedStatus = status?.toLowerCase().replace('_', '') as keyof typeof STATUS_LABELS;
    return STATUS_LABELS[normalizedStatus] || status || 'Processando';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `MZN ${Number(amount).toFixed(2)}`;
  };

  const isSentStatus = (status: string): boolean => {
    return ['sent', 'enviado'].includes(status.toLowerCase());
  };

  // Event handlers
  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleTrackOrder = (orderId: number) => {
    router.push({ pathname: '/order-tracking', params: { orderId } });
  };

  // Components
  const StatusBadge = ({ status }: { status: string }) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusText}>{getStatusText(status)}</Text>
    </View>
  );

  const OrderHeader = ({ order }: { order: Order }) => {
    const isExpanded = expandedOrders[order.id];
    const showTracking = isSentStatus(order.order_status);

    return (
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderTop}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <StatusBadge status={order.order_status} />
        </View>
        
        <View style={styles.orderHeaderBottom}>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.total_amount)}</Text>
        </View>

        <View style={styles.orderActions}>
          {showTracking && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => handleTrackOrder(order.id)}
            >
              <Text style={styles.trackButtonText}>🚚 Rastrear</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => toggleOrderExpansion(order.id)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Ocultar' : 'Detalhes'} {isExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const OrderDetails = ({ order }: { order: Order }) => (
    <View style={styles.orderDetails}>
      <View style={styles.orderInfo}>
        <InfoRow label="Endereço" value={`${order.endereco_entrega}, ${order.cidade_entrega}`} />
        <InfoRow label="Total" value={formatCurrency(order.total_amount)} highlight />
      </View>

      {orderItems[order.id] && (
        <OrderItemsList items={orderItems[order.id]} />
      )}
    </View>
  );

  const InfoRow = ({ label, value, highlight = false }: { 
    label: string; 
    value: string; 
    highlight?: boolean;
  }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );

  const OrderItemsList = ({ items }: { items: OrderItem[] }) => (
    <View style={styles.itemsSection}>
      <Text style={styles.itemsTitle}>Itens ({items.length})</Text>
      <ScrollView style={styles.itemsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <OrderItemRow key={`${item.id}-${index}`} item={item} />
        ))}
      </ScrollView>
    </View>
  );

  const OrderItemRow = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemRow}>
      <View style={styles.itemImageContainer}>
        <Image
          source={
            item.product?.image_url 
              ? { uri: item.product.image_url }
              : require('../../assets/images/placeholder-Products.jpg')
          }
          style={styles.itemImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product?.name || 'Produto'}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.price_at_purchase)}</Text>
        </View>
      </View>
    </View>
  );

  const OrderCard = ({ item }: { item: Order }) => {
    const isExpanded = expandedOrders[item.id];

    return (
      <View style={styles.orderCard}>
        <OrderHeader order={item} />
        {isExpanded && <OrderDetails order={item} />}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
      <Text style={styles.emptyMessage}>
        Seus pedidos aparecerão aqui após a primeira compra.
      </Text>
    </View>
  );

  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Carregando pedidos...</Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>❌ Erro ao carregar</Text>
      <Text style={styles.errorDetail}>{error}</Text>
    </View>
  );

  // Render
  return (
    <View style={styles.container}>
      <AppHeader title="Meus pedidos" />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={OrderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#FDFDFB',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 16,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },

  // Order Header
  orderHeader: {
    marginBottom: 0,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5C5C5C',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF7A00',
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Actions
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  trackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF7A00',
    borderRadius: 20,
  },
  trackButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expandButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#008A44',
    borderRadius: 20,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#008A44',
  },

  // Order Details
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 16,
    paddingTop: 16,
  },

  // Order Info
  orderInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C5C5C',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#008A44',
  },

  // Items Section
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  itemsList: {
    maxHeight: 240,
  },

  // Order Item
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C5C5C',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7A00',
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5C5C5C',
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5C5C5C',
    textAlign: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});