import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AppHeader from '../components/AppHeader';
import { useAuthUser } from '../hooks/useAuthUser';
import { supabase } from '../lib/supabaseClient';

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
}

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthUser();
  const isEditing = !!id;

  const [form, setForm] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    zip_code: '',
    is_default: false,
  });

  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const fetchAddress = useCallback(async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        Alert.alert('Erro', 'Endereço não encontrado');
        router.back();
        return;
      }

      setForm({
        street: data.street,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        latitude: data.latitude,
        longitude: data.longitude,
        is_default: data.is_default,
      });
    } catch (err) {
      console.error('Erro ao buscar endereço:', err);
      Alert.alert('Erro', 'Não foi possível carregar o endereço');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  }, [id, user?.id, router]);

  useEffect(() => {
    if (isEditing && id) {
      fetchAddress();
    }
  }, [id, isEditing, fetchAddress]);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Pedir permissão para acessar localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir o acesso à localização para usar esta função.'
        );
        return;
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Tentar obter endereço a partir das coordenadas
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        setForm(prev => ({
          ...prev,
          street: address.street || '',
          city: address.city || '',
          state: address.region || '',
          zip_code: address.postalCode || '',
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        Alert.alert('Sucesso', 'Localização obtida com sucesso!');
      } else {
        // Se não conseguir o endereço, pelo menos salvar as coordenadas
        setForm(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
        Alert.alert(
          'Localização Obtida',
          'Coordenadas obtidas, mas não foi possível determinar o endereço automaticamente. Por favor, preencha os campos manualmente.'
        );
      }
    } catch (err) {
      console.error('Erro ao obter localização:', err);
      Alert.alert(
        'Erro',
        'Não foi possível obter a localização. Verifique se o GPS está ativado.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!form.street.trim()) {
      Alert.alert('Erro', 'O campo Rua é obrigatório');
      return false;
    }
    if (!form.city.trim()) {
      Alert.alert('Erro', 'O campo Cidade é obrigatório');
      return false;
    }
    if (!form.state.trim()) {
      Alert.alert('Erro', 'O campo Estado/Província é obrigatório');
      return false;
    }
    if (!form.zip_code.trim()) {
      Alert.alert('Erro', 'O campo CEP/Código Postal é obrigatório');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      setLoading(true);

      // Se este endereço for definido como padrão, remover o padrão dos outros
      if (form.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const addressData = {
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zip_code.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        is_default: form.is_default,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        // Atualizar endereço existente
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar endereço:', error);
          Alert.alert('Erro', 'Não foi possível atualizar o endereço');
          return;
        }

        Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
      } else {
        // Criar novo endereço
        const { error } = await supabase
          .from('addresses')
          .insert([{ ...addressData, created_at: new Date().toISOString() }]);

        if (error) {
          console.error('Erro ao criar endereço:', error);
          Alert.alert('Erro', 'Não foi possível salvar o endereço');
          return;
        }

        Alert.alert('Sucesso', 'Endereço adicionado com sucesso!');
      }

      // Usar replace em vez de back para forçar refresh
      router.replace('/addresses');
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      Alert.alert('Erro', 'Não foi possível salvar o endereço');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <AppHeader 
          title={isEditing ? 'Editar Endereço' : 'Novo Endereço'}
          backMode={true}
          onMenuPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008A44" />
          <Text style={styles.loadingText}>Carregando endereço...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        title={isEditing ? 'Editar Endereço' : 'Novo Endereço'}
        backMode={true}
        onMenuPress={() => router.back()}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* Botão para obter localização atual */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="map-pin" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.locationButtonText}>
                {loadingLocation ? 'Obtendo localização...' : 'Usar localização atual'}
              </Text>
            </TouchableOpacity>

            {/* Formulário */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rua/Endereço *</Text>
                <TextInput
                  style={styles.input}
                  value={form.street}
                  onChangeText={(text) => setForm(prev => ({ ...prev, street: text }))}
                  placeholder="Ex: Av. Julius Nyerere, 123"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cidade *</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(text) => setForm(prev => ({ ...prev, city: text }))}
                  placeholder="Ex: Maputo"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Estado/Província *</Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  onChangeText={(text) => setForm(prev => ({ ...prev, state: text }))}
                  placeholder="Ex: Maputo"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CEP/Código Postal *</Text>
                <TextInput
                  style={styles.input}
                  value={form.zip_code}
                  onChangeText={(text) => setForm(prev => ({ ...prev, zip_code: text }))}
                  placeholder="Ex: 1100"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Coordenadas (se disponíveis) */}
              {(form.latitude && form.longitude) && (
                <View style={styles.coordinatesContainer}>
                  <Text style={styles.coordinatesTitle}>Coordenadas GPS:</Text>
                  <Text style={styles.coordinatesText}>
                    Lat: {form.latitude.toFixed(6)}, Long: {form.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {/* Switch para endereço padrão */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Definir como endereço padrão</Text>
                <Switch
                  value={form.is_default}
                  onValueChange={(value) => setForm(prev => ({ ...prev, is_default: value }))}
                  trackColor={{ false: '#E0E0E0', true: '#A8D5BA' }}
                  thumbColor={form.is_default ? '#008A44' : '#F4F3F4'}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Botão de salvar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Atualizar Endereço' : 'Salvar Endereço'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008A44',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  coordinatesContainer: {
    backgroundColor: '#F0F8F4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordinatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008A44',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#008A44',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
