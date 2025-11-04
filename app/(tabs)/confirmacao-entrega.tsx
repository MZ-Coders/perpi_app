import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { EntregadorService } from '../../services/entregadorService';

export default function ConfirmacaoEntregaScreen() {
  const params = useLocalSearchParams();
  const pedidoId = params.pedidoId as string;
  
  const [foto, setFoto] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const tirarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const selecionarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const confirmarEntrega = async () => {
    if (!foto) {
      Alert.alert('Foto Obrigatória', 'Por favor, tire uma foto para confirmar a entrega.');
      return;
    }

    setLoading(true);
    try {
      // Aqui você faria o upload da foto para o Supabase Storage
      // Por simplicidade, vou apenas simular
      const fotoUrl = foto; // Em produção, seria a URL do Supabase Storage

      const { error } = await EntregadorService.atualizarStatusPedido(
        pedidoId,
        'entregue',
        observacao,
        fotoUrl
      );

      if (error) {
        console.error('Erro ao confirmar entrega:', error);
        Alert.alert('Erro', 'Não foi possível confirmar a entrega. Tente novamente.');
        return;
      }

      Alert.alert(
        'Entrega Confirmada!',
        'A entrega foi confirmada com sucesso.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/entregador')
          }
        ]
      );
    } catch (error) {
      console.error('Erro:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Confirmar Entrega" />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Foto de Confirmação</Text>
          <Text style={styles.sectionSubtitle}>
            Tire uma foto do produto entregue ou do local de entrega para confirmar
          </Text>
          
          {foto ? (
            <View style={styles.fotoContainer}>
              <Image source={{ uri: foto }} style={styles.fotoPreview} />
              <View style={styles.fotoActions}>
                <Pressable style={styles.fotoButton} onPress={tirarFoto}>
                  <Text style={styles.fotoButtonText}>📷 Nova Foto</Text>
                </Pressable>
                <Pressable style={styles.fotoButton} onPress={selecionarFoto}>
                  <Text style={styles.fotoButtonText}>🖼️ Galeria</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.fotoPlaceholderIcon}>📷</Text>
              <Text style={styles.fotoPlaceholderText}>Nenhuma foto selecionada</Text>
              <View style={styles.fotoActions}>
                <Pressable style={styles.fotoButton} onPress={tirarFoto}>
                  <Text style={styles.fotoButtonText}>📷 Tirar Foto</Text>
                </Pressable>
                <Pressable style={styles.fotoButton} onPress={selecionarFoto}>
                  <Text style={styles.fotoButtonText}>🖼️ Selecionar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Observações (Opcional)</Text>
          <TextInput
            style={styles.observacaoInput}
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Adicione observações sobre a entrega..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Informações Importantes</Text>
          <Text style={styles.infoText}>
            • A foto é obrigatória para confirmar a entrega
          </Text>
          <Text style={styles.infoText}>
            • Certifique-se de que o produto foi entregue corretamente
          </Text>
          <Text style={styles.infoText}>
            • Após confirmar, você receberá o pagamento pela entrega
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
          
          <Pressable
            style={[styles.confirmButton, (!foto || loading) && styles.confirmButtonDisabled]}
            onPress={confirmarEntrega}
            disabled={!foto || loading}
          >
            <Text style={styles.confirmButtonText}>
              {loading ? 'Confirmando...' : 'Confirmar Entrega'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  fotoContainer: {
    alignItems: 'center',
  },
  fotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  fotoPlaceholder: {
    alignItems: 'center',
    padding: 32,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  fotoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fotoPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  fotoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  fotoButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  fotoButtonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  observacaoInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    height: 100,
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
