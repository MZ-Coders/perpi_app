import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthUser();

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar endereços:', error);
        Alert.alert('Erro', 'Não foi possível carregar os endereços');
        return;
      }

      setAddresses(data || []);
    } catch (err) {
      console.error('Erro ao buscar endereços:', err);
      Alert.alert('Erro', 'Não foi possível carregar os endereços');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleDeleteAddress = async (addressId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId)
                .eq('user_id', user?.id);

              if (error) {
                Alert.alert('Erro', 'Não foi possível excluir o endereço');
                return;
              }

              // Atualizar lista
              fetchAddresses();
              Alert.alert('Sucesso', 'Endereço excluído com sucesso');
            } catch (err) {
              console.error('Erro ao excluir endereço:', err);
              Alert.alert('Erro', 'Não foi possível excluir o endereço');
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      // Primeiro, remover default de todos os endereços do usuário
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Depois, definir o endereço selecionado como padrão
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user?.id);

      if (error) {
        Alert.alert('Erro', 'Não foi possível definir como padrão');
        return;
      }

      // Atualizar lista
      fetchAddresses();
      Alert.alert('Sucesso', 'Endereço definido como padrão');
    } catch (err) {
      console.error('Erro ao definir endereço padrão:', err);
      Alert.alert('Erro', 'Não foi possível definir como padrão');
    }
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressTitle}>
          <MaterialIcons name="location-on" size={20} color="#008A44" />
          <Text style={styles.addressStreet}>{item.street}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Padrão</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/address-form',
              params: { id: item.id }
            })}
          >
            <Feather name="edit-2" size={16} color="#008A44" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(item.id)}
          >
            <Feather name="trash-2" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.addressDetails}>
        {item.city}, {item.state}
      </Text>
      <Text style={styles.addressDetails}>
        CEP: {item.zip_code}
      </Text>
      
      {!item.is_default && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(item.id)}
        >
          <Text style={styles.setDefaultButtonText}>Definir como padrão</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="location-off" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>Nenhum endereço cadastrado</Text>
      <Text style={styles.emptyStateText}>
        Adicione endereços para facilitar suas entregas
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => router.push('/address-form')}
      >
        <Text style={styles.addFirstButtonText}>Adicionar Primeiro Endereço</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Meus Endereços" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008A44" />
          <Text style={styles.loadingText}>Carregando endereços...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Meus Endereços" />
      
      <View style={styles.content}>
        {addresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAddressItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {addresses.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/address-form')}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 80,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressStreet: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#008A44',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  addressDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F8F4',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  setDefaultButtonText: {
    color: '#008A44',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#008A44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
