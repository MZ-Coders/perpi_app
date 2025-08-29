import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppHeader from '../../components/AppHeader';
import { OrdersListRefresh, usePullToRefresh } from '../../components/PullToRefresh';
import { supabase } from '../../lib/supabaseClient';

interface OrderStatus {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  isCompleted: boolean;
  isActive: boolean;
  icon: string;
}

export default function OrderFollowScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status do pedido baseado no enum order_status da tabela orders
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([
    {
      id: 'pending',
      title: 'Pedido Pendente',
      subtitle: 'Aguardando confirmação do pedido',
      timestamp: '',
      isCompleted: true,
      isActive: false,
      icon: 'clock-outline'
    },
    {
      id: 'confirmed',
      title: 'Pedido Confirmado',
      subtitle: 'Pedido aceito',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'check-circle'
    },
    {
      id: 'preparing',
      title: 'Em Preparação',
      subtitle: 'Seu pedido está sendo preparado',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'chef-hat'
    },
    {
      id: 'ready',
      title: 'Pronto para Coleta',
      subtitle: 'Pedido pronto, aguardando entregador',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'package-variant-closed'
    },
    {
      id: 'sent',
      title: 'Saiu para Entrega',
      subtitle: 'O entregador está a caminho',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'truck-delivery'
    },
    {
      id: 'delivered',
      title: 'Entregue',
      subtitle: 'Pedido entregue com sucesso',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'check-all'
    },
    {
      id: 'cancelled',
      title: 'Cancelado',
      subtitle: 'Pedido foi cancelado',
      timestamp: '',
      isCompleted: false,
      isActive: false,
      icon: 'close-circle'
    }
  ]);

  // Função para buscar detalhes do pedido (separada para reutilizar no refresh)
  const fetchOrderDetails = async () => {
    try {
      // Buscar detalhes do pedido
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Buscar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (!itemsError && itemsData) {
        // Buscar produtos
        const productIds = itemsData.map((item: any) => item.product_id);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', productIds);

        // Combinar dados
        const itemsWithProducts = itemsData.map((item: any) => ({
          ...item,
          product: productsData?.find((p: any) => p.id === item.product_id)
        }));
        setOrderItems(itemsWithProducts);
      }

      // Atualizar status baseado no status atual do pedido
      const statusMap: { [key: string]: number } = {
        'pending': 0,
        'confirmed': 1,
        'preparing': 2,
        'ready': 3,
        'sent': 4,
        'delivered': 5,
        'cancelled': 6
      };

      const currentIndex = statusMap[orderData.order_status.toLowerCase()] || 0;

      setOrderStatuses(prevStatuses => 
        prevStatuses.map((status, index) => {
          // Para pedidos cancelados, mostrar apenas os status até o cancelamento
          if (orderData.order_status.toLowerCase() === 'cancelled') {
            return {
              ...status,
              isCompleted: status.id === 'cancelled',
              isActive: status.id === 'cancelled',
              timestamp: status.id === 'cancelled' ? 'Cancelado' : ''
            };
          }
          
          // Para outros status, seguir a sequência normal
          return {
            ...status,
            isCompleted: index < currentIndex,
            isActive: index === currentIndex,
            timestamp: index < currentIndex ? 'Concluído' : 
                      index === currentIndex ? 'Atual' : ''
          };
        })
      );

    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
    }
  };

  // Hook para pull-to-refresh
  const { refreshing, onRefresh } = usePullToRefresh(fetchOrderDetails);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchOrderDetails();
      setLoading(false);
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusItem = (status: OrderStatus, index: number) => {
    const isLast = index === orderStatuses.length - 1;
    const isCancelled = status.id === 'cancelled' && status.isActive;
    
    return (
      <View key={status.id} style={styles.statusContainer}>
        <View style={styles.statusLeft}>
          <View style={[
            styles.statusIcon,
            isCancelled ? styles.statusIconCancelled :
            status.isCompleted ? styles.statusIconCompleted : 
            status.isActive ? styles.statusIconActive : styles.statusIconPending
          ]}>
            <MaterialCommunityIcons 
              name={status.icon as any} 
              size={20} 
              color={status.isCompleted || status.isActive ? '#fff' : '#ccc'} 
            />
          </View>
          {!isLast && (
            <View style={[
              styles.statusLine,
              isCancelled ? styles.statusLineCancelled :
              status.isCompleted ? styles.statusLineCompleted : styles.statusLinePending
            ]} />
          )}
        </View>
        <View style={styles.statusContent}>
          <View style={styles.statusHeader}>
            <Text style={[
              styles.statusTitle,
              isCancelled ? styles.statusTitleCancelled :
              status.isActive ? styles.statusTitleActive : 
              status.isCompleted ? styles.statusTitleCompleted : styles.statusTitlePending
            ]}>
              {status.title}
            </Text>
            {status.timestamp && (
              <Text style={styles.statusTime}>{status.timestamp}</Text>
            )}
          </View>
          {status.subtitle && (
            <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title="Acompanhar Pedido"
          onMenuPress={() => router.push('/(tabs)/orders')}
          showCart={false}
          showUser={false}
          backMode={true}
        />
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Acompanhar Pedido"
        onMenuPress={() => router.push('/(tabs)/orders')}
        showCart={false}
        showUser={false}
        backMode={true}
      />
      
      <OrdersListRefresh
        onRefresh={onRefresh}
        refreshing={refreshing}
      >
        <View style={styles.scrollViewContent}>
          {/* Header do Pedido */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>Pedido #{orderId}</Text>
              <Text style={styles.orderDate}>
                Realizado em {order ? formatDate(order.created_at) : '-'}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={onRefresh}
                style={styles.refreshButton}
              >
                <MaterialCommunityIcons 
                  name="refresh" 
                  size={20} 
                  color="#008A44" 
                />
              </TouchableOpacity>
              {/* Desabilidando Tracking por parte do cliente. Sera trabalhando na versao a posterior */}
              {/* <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => router.push({ pathname: '/order-tracking', params: { orderId } })}
              >
                <MaterialCommunityIcons name="map-marker" size={20} color="#fff" />
                <Text style={styles.trackButtonText}>Rastrear</Text>
              </TouchableOpacity> */}
            </View>
          </View>

        {/* Timeline de Status */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Status do Pedido</Text>
          <View style={styles.timeline}>
            {orderStatuses.map((status, index) => renderStatusItem(status, index))}
          </View>
        </View>

        {/* Informações de Entrega */}
        {order && (
          <View style={styles.deliveryContainer}>
            <Text style={styles.sectionTitle}>Informações de Entrega</Text>
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryIconContainer}>
                <MaterialCommunityIcons name="map-marker" size={24} color="#008A44" />
              </View>
              <View style={styles.deliveryDetails}>
                <Text style={styles.deliveryTitle}>Endereço de Entrega</Text>
                <Text style={styles.deliveryAddress}>
                  {order.endereco_entrega}, {order.cidade_entrega}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Itens do Pedido */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Itens do Pedido ({orderItems.length})</Text>
          {orderItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.itemCard}>
              <View style={styles.itemImageContainer}>
                {item.product?.image_url ? (
                  <Image
                    source={{ uri: item.product.image_url }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemImage, styles.imagePlaceholder]}>
                    <MaterialCommunityIcons name="food" size={24} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product?.name || 'Produto'}</Text>
                <Text style={styles.itemQuantity}>Quantidade: {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  MZN {Number(item.price_at_purchase).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resumo do Pedido */}
        {order && (
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  MZN {(Number(order.total_amount) * 0.9).toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxa de Entrega</Text>
                <Text style={styles.summaryValue}>
                  MZN {(Number(order.total_amount) * 0.1).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  MZN {Number(order.total_amount).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
        </View>
      </OrdersListRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header do Pedido
  orderHeader: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008A44',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8f0',
  },
  trackButton: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Timeline
  timelineContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statusLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconCompleted: {
    backgroundColor: '#008A44',
  },
  statusIconActive: {
    backgroundColor: '#FF7A00',
  },
  statusIconCancelled: {
    backgroundColor: '#f44336',
  },
  statusIconPending: {
    backgroundColor: '#f0f0f0',
  },
  statusLine: {
    width: 2,
    height: 40,
  },
  statusLineCompleted: {
    backgroundColor: '#008A44',
  },
  statusLineCancelled: {
    backgroundColor: '#f44336',
  },
  statusLinePending: {
    backgroundColor: '#e0e0e0',
  },
  statusContent: {
    flex: 1,
    paddingTop: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusTitleCompleted: {
    color: '#008A44',
  },
  statusTitleActive: {
    color: '#FF7A00',
  },
  statusTitleCancelled: {
    color: '#f44336',
  },
  statusTitlePending: {
    color: '#999',
  },
  statusTime: {
    fontSize: 12,
    color: '#666',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Entrega
  deliveryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryDetails: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Itens
  itemsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7A00',
  },

  // Resumo
  summaryContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCard: {
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008A44',
  },
});
