import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { EntregadorService } from '../../services/entregadorService';
import type { Entregador } from '../../types/entregador';

interface OrderItem {
  id: number;
  quantity: number;
  price_at_purchase: number;
  products: {
    name: string;
  };
}

interface Order {
  id: number;
  total_amount: number;
  order_status: string;
  created_at: string;
  endereco_entrega?: string;
  cidade_entrega?: string;
  provincia_entrega?: string;
  latitude_entrega?: number;
  longitude_entrega?: number;
  order_items: OrderItem[];
}

export default function EntregadorDashboard() {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    pedidosHoje: 0,
    ganhosDiarios: 0,
    avaliacaoMedia: 0,
    tempoMedioEntrega: '0 min'
  });

  useEffect(() => {
    carregarDados();
  }, []);

    const carregarDados = async () => {
    try {
      const [entregadorData, meusPedidos, disponiveis, stats] = await Promise.all([
        EntregadorService.buscarEntregadorLogado(),
        EntregadorService.buscarMeusPedidos(),
        EntregadorService.buscarPedidosDisponiveis(),
        EntregadorService.calcularEstatisticas()
      ]);

      setEntregador(entregadorData);
      setPedidos(meusPedidos.data || []);
      setPedidosDisponiveis(disponiveis.data || []);
      
      // Adaptar as estatísticas do serviço para o formato do estado
      if (stats.data) {
        setEstatisticas({
          pedidosHoje: stats.data.total_entregas,
          ganhosDiarios: stats.data.ganhos_hoje,
          avaliacaoMedia: stats.data.avaliacao_media,
          tempoMedioEntrega: '30 min' // valor fixo por enquanto
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      setLoading(false);
    }
  };

  

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const alternarDisponibilidade = async () => {
    if (!entregador) return;

    const novaDisponibilidade = !entregador.disponivel;
    const { error } = await EntregadorService.atualizarDisponibilidade(novaDisponibilidade);
    
    if (error) {
      Alert.alert('Erro', 'Não foi possível alterar sua disponibilidade.');
      return;
    }

    setEntregador(prev => prev ? { ...prev, disponivel: novaDisponibilidade } : null);
    
    if (novaDisponibilidade) {
      Alert.alert('Online', 'Você está disponível para receber pedidos!');
    } else {
      Alert.alert('Offline', 'Você não receberá novos pedidos.');
    }
  };

  const aceitarPedido = async (pedidoId: number) => {
    try {
      await EntregadorService.aceitarPedido(pedidoId.toString());
      await carregarDados();
      Alert.alert('Sucesso', 'Pedido aceito com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível aceitar o pedido');
    }
  };

  const atualizarStatusPedido = (pedidoId: number, novoStatus: string) => {
    Alert.alert(
      'Confirmar Atualização',
      `Deseja atualizar o status do pedido para "${getStatusLabel(novoStatus)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await EntregadorService.atualizarStatusPedido(pedidoId.toString(), novoStatus);
              await carregarDados();
            } catch {
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            }
          }
        }
      ]
    );
  };



  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'accepted': 'Aceito',
      'preparing': 'Preparando',
      'ready': 'Pronto',
      'picked_up': 'Coletado',
      'in_transit': 'Em Trânsito',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': '#FF9500',
      'accepted': '#007AFF',
      'preparing': '#FF9500',
      'ready': '#34C759',
      'picked_up': '#007AFF',
      'in_transit': '#5856D6',
      'delivered': '#34C759',
      'cancelled': '#FF3B30'
    };
    return colorMap[status] || '#8E8E93';
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const nextStatusMap: { [key: string]: string } = {
      'accepted': 'picked_up',
      'picked_up': 'in_transit',
      'in_transit': 'delivered'
    };
    return nextStatusMap[currentStatus] || null;
  };

  const openMap = (pedido: Order) => {
    if (pedido.latitude_entrega && pedido.longitude_entrega) {
      router.push({
        pathname: '/(tabs)/navegacao-entrega',
        params: {
          pedidoId: pedido.id.toString(),
          latitude: pedido.latitude_entrega.toString(),
          longitude: pedido.longitude_entrega.toString(),
          endereco: pedido.endereco_entrega || 'Endereço não informado'
        }
      });
    } else {
      Alert.alert('Erro', 'Coordenadas de entrega não disponíveis');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Painel do Entregador" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  if (!entregador) {
    return (
      <View style={styles.container}>
        <AppHeader title="Painel do Entregador" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>🚚 Cadastre-se como Entregador</Text>
          <Text style={styles.emptyText}>
            Para começar a fazer entregas, você precisa se cadastrar e ter seu perfil aprovado.
          </Text>
          <Pressable
            style={styles.cadastroButton}
            onPress={() => router.push('/cadastro-entregador')}
          >
            <Text style={styles.cadastroButtonText}>Fazer Cadastro</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderPedido = ({ item: pedido }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Pedido #{pedido.id.toString().slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pedido.order_status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(pedido.order_status)}</Text>
        </View>
      </View>

      <View style={styles.addressInfo}>
        <Text style={styles.addressLabel}>� Entrega:</Text>
        <Text style={styles.addressText}>{pedido.endereco_entrega}</Text>
        {pedido.endereco_entrega && (
          <Text style={styles.addressLabel}>🚚 Entrega:</Text>
        )}
      </View>

      {pedido.order_items && pedido.order_items.length > 0 && (
        <View style={styles.orderItems}>
          <Text style={styles.itemsTitle}>Itens:</Text>
          {pedido.order_items.map((item: OrderItem, index: number) => (
            <Text key={index} style={styles.itemText}>
              • {item.quantity}x {item.products.name} - {item.price_at_purchase} MZN
            </Text>
          ))}
          <Text style={styles.totalAmount}>
            Total: {pedido.total_amount} MZN
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <Pressable
          style={styles.mapButton}
          onPress={() => openMap(pedido)}
        >
          <Text style={styles.mapButtonText}>🗺️ Ver no Mapa</Text>
        </Pressable>

        {getNextStatus(pedido.order_status) && (
          <Pressable
            style={[styles.statusButton, { backgroundColor: getStatusColor(getNextStatus(pedido.order_status)!) }]}
            onPress={() => atualizarStatusPedido(pedido.id, getNextStatus(pedido.order_status)!)}
          >
            <Text style={styles.statusButtonText}>
              Marcar como {getStatusLabel(getNextStatus(pedido.order_status)!)}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.distanceInfo}>
        <Text style={styles.timeText}>⏱️ Criado: {new Date(pedido.created_at).toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Painel do Entregador" />
      
      {/* Status do entregador */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status: {entregador.disponivel ? '🟢 Online' : '🔴 Offline'}</Text>
          <Pressable
            style={[styles.toggleButton, entregador.disponivel ? styles.toggleActive : styles.toggleInactive]}
            onPress={alternarDisponibilidade}
          >
            <Text style={styles.toggleText}>
              {entregador.disponivel ? 'Ficar Offline' : 'Ficar Online'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.pedidosHoje}</Text>
          <Text style={styles.statLabel}>Entregas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.avaliacaoMedia.toFixed(1)}⭐</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.ganhosDiarios} MZN</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.tempoMedioEntrega}</Text>
          <Text style={styles.statLabel}>Tempo Médio</Text>
        </View>
      </View>

      {/* Lista de pedidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Meus Pedidos Ativos</Text>
        
        {pedidos.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>
              {entregador.disponivel 
                ? 'Aguardando novos pedidos...' 
                : 'Fique online para receber pedidos'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={pedidos}
            renderItem={renderPedido}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        )}
      </View>

      {/* Pedidos disponíveis -> Futuramente para aceitar pedidos sozinho */} 
      {/* {entregador.disponivel && pedidosDisponiveis.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆕 Pedidos Disponíveis</Text>
          <FlatList
            data={pedidosDisponiveis.slice(0, 3)} // Mostrar apenas os 3 primeiros
            renderItem={({ item: pedido }) => (
              <View style={[styles.orderCard, styles.availableOrder]}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Pedido #{pedido.id.toString().slice(-6)}</Text>
                  <Text style={styles.availableLabel}>Disponível</Text>
                </View>
                
                <Text style={styles.addressText}>📍 {pedido.endereco_entrega}</Text>
                <Text style={styles.totalAmount}>Total: {pedido.total_amount} MZN</Text>
                
                <Pressable
                  style={styles.acceptButton}
                  onPress={() => aceitarPedido(pedido.id)}
                >
                  <Text style={styles.acceptButtonText}>✅ Aceitar Pedido</Text>
                </Pressable>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          />
        </View>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  cadastroButton: {
    backgroundColor: '#008A44',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cadastroButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#FF3B30',
  },
  toggleInactive: {
    backgroundColor: '#008A44',
  },
  toggleText: {
    color: 'white',
    fontWeight: '600',
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
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  section: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  horizontalList: {
    marginTop: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableOrder: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    width: 280,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
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
  availableLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addressInfo: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  distanceInfo: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
