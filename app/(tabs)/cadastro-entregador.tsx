import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useAuthUser } from '../../hooks/useAuthUser';
import { EntregadorService } from '../../services/entregadorService';
import type { FormularioCadastroEntregador } from '../../types/entregador';

export default function CadastroEntregadorScreen() {
  const user = useAuthUser();
  const [formulario, setFormulario] = useState<FormularioCadastroEntregador>({
    nome_completo: '',
    telefone: '',
    email: user?.email || '',
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
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Verificar se o usuário já possui cadastro ao carregar a tela
  useEffect(() => {
    const verificarCadastroExistente = async () => {
      try {
        const { jaCadastrado } = await EntregadorService.verificarUsuarioJaCadastrado();
        if (jaCadastrado) {
          Alert.alert(
            'Cadastro Existente',
            'Você já possui um cadastro de entregador. Será redirecionado para o painel do entregador.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(tabs)/entregador')
              }
            ]
          );
        }
      } catch (error) {
        console.log('Erro ao verificar cadastro existente:', error);
      }
    };

    verificarCadastroExistente();
  }, []);

  // Calcular progresso do formulário
  const calcularProgresso = (): number => {
    const camposObrigatorios = [
      'nome_completo', 'telefone', 'email', 'endereco', 'aceite_termos'
    ];
    const camposDocumento = formulario.numero_bi || formulario.numero_passaporte;
    const fotoDocumento = fotosDocumentos.foto_bi || fotosDocumentos.foto_passaporte;
    
    let preenchidos = 0;
    camposObrigatorios.forEach(campo => {
      if (campo === 'aceite_termos') {
        if (formulario[campo]) preenchidos++;
      } else if (formulario[campo as keyof FormularioCadastroEntregador]?.toString().trim()) {
        preenchidos++;
      }
    });
    
    if (camposDocumento) preenchidos++;
    if (fotoDocumento) preenchidos++;
    
    return Math.round((preenchidos / (camposObrigatorios.length + 2)) * 100);
  };

  const handleInputChange = async (campo: keyof FormularioCadastroEntregador, valor: any) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[campo]) {
      setErrors(prev => ({
        ...prev,
        [campo]: ''
      }));
    }

    // Validação específica para email
    if (campo === 'email' && valor.length > 0) {
      // Validação básica de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(valor)) {
        setErrors(prev => ({
          ...prev,
          email: 'Formato de email inválido'
        }));
        return;
      }

      // Verificar se o email já está em uso (apenas se o formato estiver correto)
      try {
        const { disponivel } = await EntregadorService.verificarEmailDisponivel(valor);
        if (!disponivel) {
          setErrors(prev => ({
            ...prev,
            email: 'Este email já está sendo usado por outro entregador'
          }));
        }
      } catch (error) {
        console.log('Erro ao verificar email:', error);
        // Não mostrar erro aqui para não interromper a digitação
      }
    }
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
    const newErrors: {[key: string]: string} = {};

    if (!formulario.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }
    if (!formulario.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    if (!formulario.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formulario.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formulario.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    if (!formulario.numero_bi.trim() && !formulario.numero_passaporte.trim()) {
      newErrors.numero_bi = 'Número do BI ou Passaporte é obrigatório';
      newErrors.numero_passaporte = 'Número do BI ou Passaporte é obrigatório';
    }
    if (!formulario.aceite_termos) {
      newErrors.aceite_termos = 'É necessário aceitar os termos e condições';
    }
    if (!fotosDocumentos.foto_bi && !fotosDocumentos.foto_passaporte) {
      newErrors.foto_documento = 'É necessário enviar foto do BI ou Passaporte';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      Alert.alert('Erro de Validação', firstError);
      return false;
    }

    return true;
  };

  const submeterCadastro = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      // Verificar se o usuário está logado
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para se cadastrar como entregador.');
        setLoading(false);
        return;
      }

      // Aqui você faria o upload das fotos para o Supabase Storage
      // Por simplicidade, vou apenas simular
      const dadosCompletos = {
        ...formulario,
        ...fotosDocumentos
      };

      const { error } = await EntregadorService.cadastrarEntregador(dadosCompletos);

      if (error) {
        console.error('Erro ao cadastrar:', error);
        
        // Verificar se é uma mensagem de erro personalizada (nossas validações)
        if (error.message) {
          Alert.alert('Erro', error.message);
        } else if (error.code === '23505') {
          Alert.alert('Erro', 'Você já possui um cadastro de entregador ou este email já está sendo usado.');
        } else {
          Alert.alert('Erro', 'Não foi possível completar o cadastro. Tente novamente.');
        }
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
      
      {/* Indicador de Progresso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Progresso: {calcularProgresso()}%</Text>
          <Text style={styles.progressSubtext}>Complete todos os campos obrigatórios</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${calcularProgresso()}%` }
            ]} 
          />
        </View>
      </View>
      
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
              style={[
                styles.input,
                errors.nome_completo && styles.inputError
              ]}
              value={formulario.nome_completo}
              onChangeText={(text) => handleInputChange('nome_completo', text)}
              placeholder="Seu nome completo"
              autoCapitalize="words"
            />
            {errors.nome_completo ? (
              <Text style={styles.errorText}>{errors.nome_completo}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <TextInput
              style={[
                styles.input,
                errors.telefone && styles.inputError
              ]}
              value={formulario.telefone}
              onChangeText={(text) => handleInputChange('telefone', text)}
              placeholder="+258 84 123 4567"
              keyboardType="phone-pad"
            />
            {errors.telefone ? (
              <Text style={styles.errorText}>{errors.telefone}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError
              ]}
              value={formulario.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
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
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#008A44',
    borderRadius: 3,
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
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
