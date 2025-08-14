import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import { EntregadorService } from '../../services/entregadorService';
import type { FormularioCadastroEntregador } from '../../types/entregador';

export default function CadastroEntregadorScreen() {
  const [formulario, setFormulario] = useState<FormularioCadastroEntregador>({
    nome_completo: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    numero_bi: '',
    numero_passaporte: '',
    endereco: '',
    veiculo_tipo: 'moto',
    veiculo_placa: '',
    conta_bancaria: '',
    aceite_termos: false,
  });

  const [fotosDocumentos, setFotosDocumentos] = useState<{
    foto_bi?: string;
    foto_passaporte?: string;
    foto_perfil?: string;
  }>({});

  const [loading, setLoading] = useState(false);

  const handleInputChange = (campo: keyof FormularioCadastroEntregador, valor: any) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const selecionarFoto = async (tipoFoto: 'foto_bi' | 'foto_passaporte' | 'foto_perfil') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFotosDocumentos(prev => ({
          ...prev,
          [tipoFoto]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const validarFormulario = (): boolean => {
    if (!formulario.nome_completo.trim()) {
      Alert.alert('Erro', 'Nome completo é obrigatório.');
      return false;
    }
    if (!formulario.telefone.trim()) {
      Alert.alert('Erro', 'Telefone é obrigatório.');
      return false;
    }
    if (!formulario.email.trim()) {
      Alert.alert('Erro', 'Email é obrigatório.');
      return false;
    }
    if (!formulario.endereco.trim()) {
      Alert.alert('Erro', 'Endereço é obrigatório.');
      return false;
    }
    if (!formulario.numero_bi.trim() && !formulario.numero_passaporte.trim()) {
      Alert.alert('Erro', 'Número do BI ou Passaporte é obrigatório.');
      return false;
    }
    if (!formulario.aceite_termos) {
      Alert.alert('Erro', 'É necessário aceitar os termos e condições.');
      return false;
    }
    if (!fotosDocumentos.foto_bi && !fotosDocumentos.foto_passaporte) {
      Alert.alert('Erro', 'É necessário enviar foto do BI ou Passaporte.');
      return false;
    }

    return true;
  };

  const submeterCadastro = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Aqui você faria o upload das fotos para o Supabase Storage
      // Por simplicidade, vou apenas simular
      const dadosCompletos = {
        ...formulario,
        ...fotosDocumentos
      };

      const { data, error } = await EntregadorService.cadastrarEntregador(dadosCompletos);

      if (error) {
        console.error('Erro ao cadastrar:', error);
        Alert.alert('Erro', 'Não foi possível completar o cadastro. Tente novamente.');
        return;
      }

      Alert.alert(
        'Cadastro Enviado!',
        'Seu cadastro foi enviado para análise. Você receberá uma notificação quando for aprovado.',
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

  const renderFotoSelector = (
    titulo: string,
    tipoFoto: 'foto_bi' | 'foto_passaporte' | 'foto_perfil',
    obrigatorio: boolean = false
  ) => (
    <View style={styles.fotoContainer}>
      <Text style={styles.fotoLabel}>
        {titulo} {obrigatorio && <Text style={styles.obrigatorio}>*</Text>}
      </Text>
      <Pressable 
        style={styles.fotoSelector}
        onPress={() => selecionarFoto(tipoFoto)}
      >
        {fotosDocumentos[tipoFoto] ? (
          <Image source={{ uri: fotosDocumentos[tipoFoto] }} style={styles.fotoPreview} />
        ) : (
          <View style={styles.fotoPlaceholder}>
            <Text style={styles.fotoPlaceholderText}>📷</Text>
            <Text style={styles.fotoPlaceholderSubtext}>Tocar para selecionar</Text>
          </View>
        )}
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader title="Cadastro de Entregador" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informações Pessoais</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={formulario.nome_completo}
              onChangeText={(text) => handleInputChange('nome_completo', text)}
              placeholder="Seu nome completo"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <TextInput
              style={styles.input}
              value={formulario.telefone}
              onChangeText={(text) => handleInputChange('telefone', text)}
              placeholder="+258 84 123 4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formulario.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput
              style={styles.input}
              value={formulario.data_nascimento}
              onChangeText={(text) => handleInputChange('data_nascimento', text)}
              placeholder="DD/MM/AAAA"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formulario.endereco}
              onChangeText={(text) => handleInputChange('endereco', text)}
              placeholder="Rua, bairro, cidade"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆔 Documentos</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número do BI</Text>
            <TextInput
              style={styles.input}
              value={formulario.numero_bi}
              onChangeText={(text) => handleInputChange('numero_bi', text)}
              placeholder="123456789A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número do Passaporte</Text>
            <TextInput
              style={styles.input}
              value={formulario.numero_passaporte}
              onChangeText={(text) => handleInputChange('numero_passaporte', text)}
              placeholder="ABC123456"
            />
          </View>

          {renderFotoSelector('Foto do BI', 'foto_bi', true)}
          {renderFotoSelector('Foto do Passaporte', 'foto_passaporte')}
          {renderFotoSelector('Foto de Perfil', 'foto_perfil')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏍️ Veículo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Veículo *</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'moto', label: '🏍️ Moto' },
                { value: 'bicicleta', label: '🚲 Bicicleta' },
                { value: 'carro', label: '🚗 Carro' },
                { value: 'pe', label: '🚶 A pé' },
              ].map((opcao) => (
                <Pressable
                  key={opcao.value}
                  style={[
                    styles.radioOption,
                    formulario.veiculo_tipo === opcao.value && styles.radioOptionSelected
                  ]}
                  onPress={() => handleInputChange('veiculo_tipo', opcao.value)}
                >
                  <Text style={[
                    styles.radioText,
                    formulario.veiculo_tipo === opcao.value && styles.radioTextSelected
                  ]}>
                    {opcao.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {formulario.veiculo_tipo !== 'pe' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Placa do Veículo</Text>
              <TextInput
                style={styles.input}
                value={formulario.veiculo_placa}
                onChangeText={(text) => handleInputChange('veiculo_placa', text)}
                placeholder="ABC-1234"
                autoCapitalize="characters"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Informações Bancárias</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Conta Bancária</Text>
            <TextInput
              style={styles.input}
              value={formulario.conta_bancaria}
              onChangeText={(text) => handleInputChange('conta_bancaria', text)}
              placeholder="Banco - Agência - Conta"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Termos e Condições</Text>
          
          <View style={styles.termosContainer}>
            <Text style={styles.termosTexto}>
              Como entregador, você se compromete a:
              {'\n'}• Cumprir horários de entrega estabelecidos
              {'\n'}• Manter sigilo sobre dados dos clientes
              {'\n'}• Zelar pela qualidade dos produtos entregues
              {'\n'}• Seguir as normas de segurança no trânsito
              {'\n'}• Manter documentação sempre atualizada
            </Text>
            
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => handleInputChange('aceite_termos', !formulario.aceite_termos)}
            >
              <View style={[styles.checkbox, formulario.aceite_termos && styles.checkboxChecked]}>
                {formulario.aceite_termos && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                Aceito os termos e condições
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submeterCadastro}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Enviando...' : 'Enviar Cadastro'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  obrigatorio: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  radioOption: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  radioOptionSelected: {
    borderColor: '#008A44',
    backgroundColor: '#E8F5E8',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioTextSelected: {
    color: '#008A44',
    fontWeight: '600',
  },
  fotoContainer: {
    marginBottom: 16,
  },
  fotoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fotoSelector: {
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 8,
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  fotoPlaceholder: {
    alignItems: 'center',
  },
  fotoPlaceholderText: {
    fontSize: 32,
    marginBottom: 8,
  },
  fotoPlaceholderSubtext: {
    fontSize: 14,
    color: '#666',
  },
  termosContainer: {
    marginTop: 8,
  },
  termosTexto: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#008A44',
    borderColor: '#008A44',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#008A44',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
