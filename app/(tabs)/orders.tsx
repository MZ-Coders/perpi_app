import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  FlatList, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OrdersSkeleton from '../../components/OrdersSkeleton';
import { router } from 'expo-router';
import AppHeader from '../../components/AppHeader';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

export default function OrdersScreen() {

  const [showSuccess, setShowSuccess] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const authUser = useAuthUser();
  const USER_ID = authUser?.id;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Checa se deve mostrar modal de sucesso (cross-plataforma)
      const flag = await AsyncStorage.getItem('showOrderSuccess');
      if (flag === '1') {
        setShowSuccess(true);
        // Animação de entrada do modal
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
        setTimeout(async () => {
          // Animação de saída
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowSuccess(false);
          });
          await AsyncStorage.removeItem('showOrderSuccess');
        }, 3000);
      }
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
      // Fetch order items for each order
      if (data && data.length > 0) {
        const orderIds = data.map((order: any) => order.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        if (!itemsError && itemsData) {
          // Fetch products for all items
          const productIds = [...new Set(itemsData.map((item: any) => item.product_id))];
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name, image_url')
            .in('id', productIds);
          // Group items by order_id and attach product info
          const grouped: { [orderId: number]: any[] } = {};
          itemsData.forEach((item: any) => {
            const product = productsData?.find((p: any) => p.id === item.product_id);
            if (!grouped[item.order_id]) grouped[item.order_id] = [];
            grouped[item.order_id].push({ ...item, product });
          });
          setOrderItems(grouped);
        }
      }
    })();
  }, [USER_ID]);

const getStatusTextColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'entregue':
    case 'delivered':
      return { color: '#34C759' };
    case 'em_preparacao':
    case 'preparing':
      return { color: '#FFCC00' };
    case 'cancelado':
    case 'cancelled':
      return { color: '#FF3B30' };
    case 'pendente':
    case 'pending':
      return { color: '#888' };
    default:
      return { color: '#008A44' };
  }
};

const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'entregue':
      case 'delivered':
        return <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />;
      case 'em_preparacao':
      case 'preparing':
        return <MaterialCommunityIcons name="chef-hat" size={18} color="#fff" />;
      case 'cancelado':
      case 'cancelled':
        return <MaterialCommunityIcons name="close-circle" size={18} color="#fff" />;
      case 'pendente':
      case 'pending':
        return <MaterialCommunityIcons name="clock-outline" size={18} color="#888" />;
      default:
        return <MaterialCommunityIcons name="package-variant" size={18} color="#fff" />;
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


  const [orderItems, setOrderItems] = useState<{ [orderId: number]: any[] }>({});
  const [expandedOrders, setExpandedOrders] = useState<{ [orderId: number]: boolean }>({});

  const toggleAccordion = (orderId: number) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedOrders[item.id] || false;
    const status = (item.order_status || '').toLowerCase();
    const showTrackButton = status === 'enviado' || status === 'sent';
    return (
      <View style={styles.orderCard}>
        {/* Header do pedido com design moderno */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>PEDIDO</Text>
              <Text style={styles.orderId}>#{item.id}</Text>
            </View>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.orderHeaderRight}>
            <View style={[styles.statusBadge, styles.statusBadgeGray]}> 
              <View style={styles.statusIconWrapper}>
                {getStatusIcon(item.order_status)}
              </View>
              <Text style={[styles.statusText, getStatusTextColor(item.order_status)]}>{getStatusText(item.order_status)}</Text>
            </View>
            {/* Botão de rastreamento, exatamente abaixo do status e mesmo tamanho */}
            {showTrackButton && (
              <TouchableOpacity
                style={[
                  styles.statusBadge,
                  styles.trackButton,
                  {
                    marginTop: 8,
                    alignSelf: 'stretch',
                    minWidth: 100,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    paddingVertical: styles.statusBadge.paddingVertical // igual ao status
                  }
                ]}
                onPress={() => router.push({ pathname: '/order-tracking', params: { orderId: item.id } })}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.trackButtonText}>Rastrear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Valor total destacado */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total do Pedido</Text>
          <Text style={styles.totalAmount}>MZN {Number(item.total_amount).toFixed(2)}</Text>
        </View>

        {/* Informações de entrega */}
        <View style={styles.deliverySection}>
          <View style={styles.deliveryIcon}>
            <Text style={styles.deliveryIconEmoji}>🏠</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryLabel}>Endereço de Entrega</Text>
            <Text style={styles.deliveryAddress} numberOfLines={2}>
              {item.endereco_entrega}, {item.cidade_entrega}
            </Text>
          </View>
        </View>

        {/* Itens do pedido com novo design */}
        {orderItems[item.id] && orderItems[item.id].length > 0 && (
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Itens ({orderItems[item.id].length})</Text>
              <TouchableOpacity style={styles.expandButton} onPress={() => toggleAccordion(item.id)}>
                <Text style={styles.expandButtonText}>{isExpanded ? 'Ocultar Itens' : 'Ver Itens'}</Text>
              </TouchableOpacity>
            </View>
            {isExpanded && (
              <ScrollView
                style={styles.itemsList}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemsScrollContent}
              >
                {orderItems[item.id].map((orderItem: any, index: number) => (
                  <View key={`${orderItem.id}-${index}`} style={styles.orderItemCard}>
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
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemQuantity}>{orderItem.quantity}x</Text>
                        <Text style={styles.itemPrice}>
                          MZN {Number(orderItem.price_at_purchase).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Meus Pedidos" />
      
      {/* Modal de Sucesso Animado */}
      <Modal
        transparent={true}
        visible={showSuccess}
        animationType="none"
        onRequestClose={() => setShowSuccess(false)}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Animated.View
            style={[
              styles.successModal,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Compra Realizada!</Text>
            <Text style={styles.successMessage}>
              Seu pedido foi confirmado com sucesso e já está sendo preparado.
            </Text>
            <View style={styles.successCheckmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {loading ? (
        <OrdersSkeleton />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <View style={styles.emptyIconBg}></View>
          </View>
          <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
          <Text style={styles.emptyMessage}>
            Explore nossos produtos e faça seu primeiro pedido. Você vai amar!
          </Text>
          <TouchableOpacity style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Começar a Comprar</Text>
          </TouchableOpacity>
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
    backgroundColor: '#FDFDFB',
  },

  // Modal de Sucesso
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: screenWidth - 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successCheckmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  // Lista
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 16,
  },

  // Card do pedido redesenhado
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F3F3',
  },

  // Header do pedido
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderIdContainer: {
    marginBottom: 4,
  },
  orderIdLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5C5C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#008A44',
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C5C5C',
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },

  // Status badge redesenhado
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
  },
  statusBadgeGray: {
    backgroundColor: '#E0E0E0',
  },
  statusIcon: {
    fontSize: 14,
  },
  statusIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Removido: statusSuccess, statusWarning, statusError, statusPrimary, statusPending

  // Seção do total
  totalSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C5C5C',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#008A44',
  },

  // Seção de entrega
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 20,
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryIconEmoji: {
    fontSize: 18,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C5C5C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    lineHeight: 20,
  },

  // Seção de itens redesenhada
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
    paddingTop: 20,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#008A44',
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemsList: {
    flexGrow: 0,
  },
  itemsScrollContent: {
    paddingRight: 16,
  },

  // Cards de itens horizontais
  orderItemCard: {
    width: 140,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
  },
  itemImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 16,
    textAlign: 'center',
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5C5C',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7A00',
  },

  // Card para mais itens
  moreItemsCard: {
    width: 100,
    backgroundColor: '#008A44',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  moreItemsLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Botão de rastreamento
  trackButton: {
    marginTop: 16,
    backgroundColor: '#FF7A00',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Estados redesenhados
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingSpinnerText: {
    fontSize: 24,
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#008A44',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIllustration: {
    position: 'relative',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 64,
    zIndex: 2,
  },
  emptyIconBg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#008A44',
    opacity: 0.1,
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
