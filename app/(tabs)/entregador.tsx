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
import type { Entregador, Pedido } from '../../types/entregador';

export default function EntregadorScreen() {
  const [entregador, setEntregador] = useState<Entregador | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<Pedido[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    total_entregas: 0,
    avaliacao_media: 0,
    ganhos_hoje: 0,
    ganhos_mes: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Buscar dados do entregador
      const { data: entregadorData } = await EntregadorService.buscarEntregadorAtual();
      setEntregador(entregadorData);

      if (!entregadorData) {
        // Se não há entregador cadastrado, redirecionar para cadastro
        Alert.alert(
          'Cadastro Necessário',
          'Você precisa se cadastrar como entregador primeiro.',
          [
            {
              text: 'Cadastrar Agora',
              onPress: () => router.push('/cadastro-entregador')
            }
          ]
        );
        return;
      }

      if (entregadorData.status_verificacao === 'pendente') {
        Alert.alert(
          'Aguardando Aprovação',
          'Seu cadastro está sendo analisado. Aguarde a aprovação para começar a trabalhar.'
        );
        return;
      }

      if (entregadorData.status_verificacao === 'rejeitado') {
        Alert.alert(
          'Cadastro Rejeitado',
          'Seu cadastro foi rejeitado. Entre em contato com o suporte.'
        );
        return;
      }

      // Carregar pedidos e estatísticas
      await Promise.all([
        carregarMeusPedidos(),
        carregarPedidosDisponiveis(),
        carregarEstatisticas()
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarMeusPedidos = async () => {
    const { data } = await EntregadorService.buscarMeusPedidos();
    setPedidos(data);
  };

  const carregarPedidosDisponiveis = async () => {
    const { data } = await EntregadorService.buscarPedidosDisponiveis();
    setPedidosDisponiveis(data);
  };

  const carregarEstatisticas = async () => {
    const { data } = await EntregadorService.calcularEstatisticas();
    if (data) {
      setEstatisticas(data);
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

  const aceitarPedido = async (pedidoId: string) => {
    const { error } = await EntregadorService.aceitarPedido(pedidoId);
    
    if (error) {
      Alert.alert('Erro', 'Não foi possível aceitar o pedido.');
      return;
    }

    Alert.alert('Pedido Aceito!', 'O pedido foi atribuído a você.');
    await carregarDados();
  };

  const atualizarStatusPedido = (pedidoId: string, novoStatus: Pedido['status']) => {
    Alert.alert(
      'Confirmar Status',
      `Deseja marcar o pedido como "${getStatusLabel(novoStatus)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const { error } = await EntregadorService.atualizarStatusPedido(pedidoId, novoStatus);
            
            if (error) {
              Alert.alert('Erro', 'Não foi possível atualizar o status.');
              return;
            }

            await carregarDados();
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: Pedido['status']) => {
    switch (status) {
      case 'novo': return 'Novo';
      case 'atribuido': return 'Atribuído';
      case 'aceito': return 'Aceito';
      case 'coletado': return 'Coletado';
      case 'em_transito': return 'Em Trânsito';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: Pedido['status']) => {
    switch (status) {
      case 'novo': return '#FFA500';
      case 'atribuido': return '#2196F3';
      case 'aceito': return '#4CAF50';
      case 'coletado': return '#FF9800';
      case 'em_transito': return '#FF5722';
      case 'entregue': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#666';
    }
  };

  const getNextStatus = (currentStatus: Pedido['status']): Pedido['status'] | null => {
    switch (currentStatus) {
      case 'aceito': return 'coletado';
      case 'coletado': return 'em_transito';
      case 'em_transito': return 'entregue';
      default: return null;
    }
  };

  const openMap = (pedido: Pedido) => {
    router.push({
      pathname: '/order-tracking',
      params: { orderId: pedido.id }
    });
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

  const renderPedido = ({ item: pedido }: { item: Pedido }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Pedido #{pedido.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pedido.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(pedido.status)}</Text>
        </View>
      </View>

      <View style={styles.addressInfo}>
        <Text style={styles.addressLabel}>� Entrega:</Text>
        <Text style={styles.addressText}>{pedido.endereco_entrega}</Text>
        {pedido.endereco_coleta && (
          <>
            <Text style={styles.addressLabel}>🏪 Coleta:</Text>
            <Text style={styles.addressText}>{pedido.endereco_coleta}</Text>
          </>
        )}
      </View>

      {pedido.itens && pedido.itens.length > 0 && (
        <View style={styles.orderItems}>
          <Text style={styles.itemsTitle}>Itens:</Text>
          {pedido.itens.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.quantidade}x {item.produto_nome} - {item.preco_unitario} MZN
            </Text>
          ))}
          <Text style={styles.totalAmount}>
            Total: {pedido.valor_total} MZN
            {pedido.valor_entrega && ` (Entrega: ${pedido.valor_entrega} MZN)`}
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

        {getNextStatus(pedido.status) && (
          <Pressable
            style={[styles.statusButton, { backgroundColor: getStatusColor(getNextStatus(pedido.status)!) }]}
            onPress={() => atualizarStatusPedido(pedido.id, getNextStatus(pedido.status)!)}
          >
            <Text style={styles.statusButtonText}>
              Marcar como {getStatusLabel(getNextStatus(pedido.status)!)}
            </Text>
          </Pressable>
        )}
      </View>

      {pedido.distancia_km && (
        <View style={styles.distanceInfo}>
          <Text style={styles.distanceText}>📏 Distância: {pedido.distancia_km.toFixed(1)} km</Text>
          {pedido.tempo_estimado && (
            <Text style={styles.timeText}>⏱️ Tempo estimado: {pedido.tempo_estimado} min</Text>
          )}
        </View>
      )}
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
          <Text style={styles.statNumber}>{estatisticas.total_entregas}</Text>
          <Text style={styles.statLabel}>Entregas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.avaliacao_media.toFixed(1)}⭐</Text>
          <Text style={styles.statLabel}>Avaliação</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.ganhos_hoje} MZN</Text>
          <Text style={styles.statLabel}>Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estatisticas.ganhos_mes} MZN</Text>
          <Text style={styles.statLabel}>Este Mês</Text>
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
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        )}
      </View>

      {/* Pedidos disponíveis */}
      {entregador.disponivel && pedidosDisponiveis.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆕 Pedidos Disponíveis</Text>
          <FlatList
            data={pedidosDisponiveis.slice(0, 3)} // Mostrar apenas os 3 primeiros
            renderItem={({ item: pedido }) => (
              <View style={[styles.orderCard, styles.availableOrder]}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Pedido #{pedido.id.slice(-6)}</Text>
                  <Text style={styles.availableLabel}>Disponível</Text>
                </View>
                
                <Text style={styles.addressText}>📍 {pedido.endereco_entrega}</Text>
                <Text style={styles.totalAmount}>Total: {pedido.valor_total} MZN</Text>
                
                <Pressable
                  style={styles.acceptButton}
                  onPress={() => aceitarPedido(pedido.id)}
                >
                  <Text style={styles.acceptButtonText}>✅ Aceitar Pedido</Text>
                </Pressable>
              </View>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalList}
          />
        </View>
      )}
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
