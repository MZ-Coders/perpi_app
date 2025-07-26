import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'delivered':
        return styles.statusSuccess;
      case 'em_preparacao':
      case 'preparing':
        return styles.statusWarning;
      case 'cancelado':
      case 'cancelled':
        return styles.statusError;
      default:
        return styles.statusPrimary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'delivered':
        return 'Entregue';
      case 'em_preparacao':
      case 'preparing':
        return 'Em Preparação';
      case 'cancelado':
      case 'cancelled':
        return 'Cancelado';
      case 'pendente':
      case 'pending':
        return 'Pendente';
      default:
        return status || 'Processando';
    }
  };

  const formatDate = (dateString: string) => {
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

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      {/* Header do pedido */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderTop}>
          <Text style={styles.orderId}>Pedido #{item.id}</Text>
          <View style={[styles.statusBadge, getStatusColor(item.order_status)]}>
            <Text style={styles.statusText}>{getStatusText(item.order_status)}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Informações do pedido */}
      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total:</Text>
          <Text style={styles.totalAmount}>MZN {Number(item.total_amount).toFixed(2)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Endereço:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.endereco_entrega}, {item.cidade_entrega}
          </Text>
        </View>
      </View>

      {/* Itens do pedido */}
      {orderItems[item.id] && orderItems[item.id].length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Itens do Pedido</Text>
          <ScrollView style={styles.itemsList} nestedScrollEnabled>
            {orderItems[item.id].map((orderItem: any, index: number) => (
              <View key={`${orderItem.id}-${index}`} style={styles.orderItemRow}>
                <View style={styles.itemImageContainer}>
                  {orderItem.product?.image_url ? (
                    <Image 
                      source={{ uri: orderItem.product.image_url }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.imagePlaceholder]}>
                      <Text style={styles.imagePlaceholderText}>📦</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {orderItem.product?.name || 'Produto'}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQuantity}>Qtd: {orderItem.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      MZN {Number(orderItem.price_at_purchase).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header customizado */}
      <AppHeader title="Meus Pedidos" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Erro ao carregar pedidos</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Nenhuma compra ainda</Text>
          <Text style={styles.emptyMessage}>
            Quando você fizer seu primeiro pedido, ele aparecerá aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout principal
  container: {
    flex: 1,
    backgroundColor: '#FDFDFB', // neutralLight
  },
  
  // Header
  header: {
    backgroundColor: '#008A44', // brand-color-primary
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    fontSize: 32, // display-lg equivalent
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15, // body-md
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },

  // Lista
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },

  // Card do pedido
  orderCard: {
    backgroundColor: '#FFFFFF', // neutralSurface
    borderRadius: 16, // radius-lg
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Header do pedido
  orderHeader: {
    marginBottom: 16,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 20, // title-lg
    fontWeight: '600',
    color: '#008A44', // brand-color-primary
  },
  orderDate: {
    fontSize: 13, // caption-sm
    fontWeight: '500',
    color: '#5C5C5C', // neutralTextSecondary
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Status badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999, // radius-full
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11, // caption-xs
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusSuccess: {
    backgroundColor: '#34C759',
  },
  statusWarning: {
    backgroundColor: '#FFCC00',
  },
  statusError: {
    backgroundColor: '#FF3B30',
  },
  statusPrimary: {
    backgroundColor: '#008A44',
  },

  // Informações do pedido
  orderInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0', // neutralBorder
    paddingTop: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14, // body-sm
    fontWeight: '500',
    color: '#5C5C5C', // neutralTextSecondary
    flex: 1,
  },
  infoValue: {
    fontSize: 14, // body-sm
    fontWeight: '400',
    color: '#1A1A1A', // neutralTextPrimary
    flex: 2,
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 18, // title-md
    fontWeight: '700',
    color: '#008A44', // brand-color-primary
  },

  // Seção de itens
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0', // neutralBorder
    paddingTop: 16,
  },
  itemsTitle: {
    fontSize: 16, // title-md
    fontWeight: '600',
    color: '#1A1A1A', // neutralTextPrimary
    marginBottom: 12,
  },
  itemsList: {
    maxHeight: 200,
  },

  // Item do pedido
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8, // radius-md
    backgroundColor: '#F3F3F3',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14, // body-sm
    fontWeight: '500',
    color: '#1A1A1A', // neutralTextPrimary
    marginBottom: 4,
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12, // caption-sm
    fontWeight: '500',
    color: '#5C5C5C', // neutralTextSecondary
  },
  itemPrice: {
    fontSize: 14, // body-sm
    fontWeight: '600',
    color: '#FF7A00', // brand-color-accent
  },

  // Estados de loading/error/empty
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16, // body-lg
    fontWeight: '400',
    color: '#5C5C5C', // neutralTextSecondary
    textAlign: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18, // title-md
    fontWeight: '600',
    color: '#FF3B30', // error
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14, // body-sm
    fontWeight: '400',
    color: '#5C5C5C', // neutralTextSecondary
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24, // headline-md
    fontWeight: '700',
    color: '#1A1A1A', // neutralTextPrimary
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16, // body-lg
    fontWeight: '400',
    color: '#5C5C5C', // neutralTextSecondary
    textAlign: 'center',
    lineHeight: 22,
  },
});
