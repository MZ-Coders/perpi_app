import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuthUser } from '../hooks/useAuthUser';
import { supabase } from '../lib/supabaseClient';

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

interface AddressSelectorProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  isRequired?: boolean;
  style?: any;
}

export default function AddressSelector({ 
  selectedAddress, 
  onAddressSelect, 
  isRequired = false,
  style 
}: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
        return;
      }

      setAddresses(data || []);

      // Se não há endereço selecionado, selecionar o padrão automaticamente
      if (!selectedAddress && data && data.length > 0) {
        const defaultAddress = data.find(addr => addr.is_default) || data[0];
        onAddressSelect(defaultAddress);
      }
    } catch (err) {
      console.error('Erro ao buscar endereços:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedAddress, onAddressSelect]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Atualizar endereços quando o modal for aberto
  useFocusEffect(
    useCallback(() => {
      if (showModal) {
        fetchAddresses();
      }
    }, [showModal, fetchAddresses])
  );

  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    setShowModal(false);
  };

  const handleAddNewAddress = () => {
    setShowModal(false);
    router.push('/address-form');
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={[
        styles.addressItem,
        selectedAddress?.id === item.id && styles.selectedAddressItem
      ]}
      onPress={() => handleAddressSelect(item)}
    >
      <View style={styles.addressInfo}>
        <View style={styles.addressHeader}>
          <MaterialIcons name="location-on" size={20} color="#008A44" />
          <Text style={styles.addressStreet}>{item.street}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Padrão</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressDetails}>
          {item.city}, {item.state}
        </Text>
        <Text style={styles.addressDetails}>
          CEP: {item.zip_code}
        </Text>
      </View>
      {selectedAddress?.id === item.id && (
        <MaterialIcons name="check-circle" size={24} color="#008A44" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#008A44" />
        <Text style={styles.loadingText}>Carregando endereços...</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.container,
          style,
          !selectedAddress && isRequired && styles.requiredContainer
        ]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.header}>
          <MaterialIcons 
            name="location-on" 
            size={24} 
            color={selectedAddress ? "#008A44" : "#999"} 
          />
          <Text style={styles.title}>Endereço de Entrega</Text>
          {isRequired && (
            <Text style={styles.requiredAsterisk}>*</Text>
          )}
        </View>
        
        {selectedAddress ? (
          <View style={styles.selectedAddress}>
            <Text style={styles.selectedStreet}>{selectedAddress.street}</Text>
            <Text style={styles.selectedDetails}>
              {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zip_code}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>
            {addresses.length > 0 ? 'Toque para selecionar um endereço' : 'Nenhum endereço cadastrado'}
          </Text>
        )}
        
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#666" />
      </TouchableOpacity>

      {/* Modal de Seleção de Endereços */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Endereço</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>Nenhum endereço cadastrado</Text>
              <Text style={styles.emptyText}>
                Adicione um endereço para continuar com a compra
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewAddress}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Adicionar Endereço</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={addresses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAddressItem}
                contentContainerStyle={styles.addressList}
                showsVerticalScrollIndicator={false}
              />
              
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={handleAddNewAddress}
              >
                <MaterialIcons name="add" size={20} color="#008A44" />
                <Text style={styles.addNewButtonText}>Adicionar Novo Endereço</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredContainer: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  requiredAsterisk: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  selectedAddress: {
    flex: 1,
    marginLeft: 8,
  },
  selectedStreet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  selectedDetails: {
    fontSize: 12,
    color: '#666',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
  },
  addressList: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedAddressItem: {
    borderColor: '#008A44',
    backgroundColor: '#F0F8F4',
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  addressDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008A44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8F4',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#008A44',
  },
  addNewButtonText: {
    color: '#008A44',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
