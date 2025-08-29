import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import Logo from '../../components/Logo';
import { supabase } from '../../lib/supabaseClient';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [celularNumber, setCelularNumber] = useState(''); // Apenas a parte do número sem +258
  const [isDeliverer, setIsDeliverer] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Número completo com prefixo fixo
  const celular = `+258${celularNumber}`;

  // Função para validar número de celular de Moçambique (apenas a parte numérica)
  const validateMozambiquePhone = (phoneNumber: string): boolean => {
    // Remove espaços e formatação
    const cleanPhone = phoneNumber.replace(/[\s\-]/g, '');
    
    // Deve ter exatamente 9 dígitos e começar com 8
    return /^8[0-9]{8}$/.test(cleanPhone);
  };

  // Função para formatar número de celular (apenas a parte após +258)
  const formatMozambiquePhone = (phone: string): string => {
    // Remove tudo que não é número
    let cleaned = phone.replace(/[^\d]/g, '');
    
    // Limita a 9 dígitos
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }
    
    // Formatar como XX XXX XXXX
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatMozambiquePhone(text);
    setCelularNumber(formatted);
  };

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validação das senhas
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }
    
    // Validação do número de celular
    if (!validateMozambiquePhone(celularNumber)) {
      setError('Número de celular inválido. Deve ter 9 dígitos e começar com 8 (ex: 84 123 4567)');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const userRole = isDeliverer ? 'driver' : 'customer';
        console.log('Inserindo usuário com role:', userRole); // Para debug
        
        const { error: insertError } = await supabase.from('users_').insert([
          { 
            id: data.user.id, 
            email, 
            celular,
            user_role: userRole,
            full_name: email.split('@')[0], // Nome temporário baseado no email
            password_hash: 'auth_handled' // Placeholder já que a autenticação é gerenciada pelo Supabase Auth
          }
        ]);

        if (insertError) {
          console.error('Erro ao inserir usuário:', insertError);
          setError('Erro ao criar perfil do usuário');
          setLoading(false);
          return;
        }

        // Usuário criado com sucesso - navegar diretamente para a tela principal
        console.log('Usuário criado com sucesso, navegando para tela principal');
        setSuccess('Conta criada com sucesso! Redirecionando...');
        
        // Aguardar um pouco para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Forçar recarregamento da sessão para garantir que o role seja carregado
        await supabase.auth.refreshSession();
        
        // Verificar novamente o usuário e role para garantir navegação correta
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const { data: userData } = await supabase
            .from('users_')
            .select('user_role')
            .eq('id', currentUser.id)
            .single();
          
          const actualRole = userData?.user_role || (isDeliverer ? 'driver' : 'customer');
          console.log('Role do usuário após criação:', actualRole);
          console.log('Dados do usuário:', userData);
          
          // Pequena pausa para mostrar feedback de sucesso
          setTimeout(() => {
            // Navegar para a tela principal baseado no role real do usuário
            if (actualRole === 'driver') {
              console.log('Navegando para tela de entregador');
              router.replace('/entregador');
            } else {
              console.log('Navegando para tela de cliente');
              router.replace('/');
            }
          }, 1000);
        } else {
          // Fallback para navegação baseada na seleção do usuário
          setTimeout(() => {
            if (isDeliverer) {
              router.replace('/entregador');
            } else {
              router.replace('/');
            }
          }, 1000);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Erro inesperado durante o cadastro');
      setLoading(false);
    }
  };

  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={isDark ? '#121212' : '#FDFDFB'} 
      />
      
      {/* Header */}
        <Logo />

      {/* Form Container */}
      <View style={[styles.formContainer, isDark ? styles.darkSurface : styles.lightSurface]}>
        <Text style={[styles.formTitle, isDark && styles.darkText]}>Criar Conta</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark && styles.darkInputText,
              email && !validateEmail(email) && styles.inputError
            ]}
            placeholder="Email"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          {email && !validateEmail(email) && (
            <Text style={styles.fieldErrorText}>Email inválido</Text>
          )}
          
          {email && validateEmail(email) && (
            <Text style={styles.fieldSuccessText}>✓ Email válido</Text>
          )}
          
          {/* Campo de Celular com prefixo fixo */}
          <View style={[
            styles.phoneInputContainer,
            isDark ? styles.darkInput : styles.lightInput,
            celularNumber && !validateMozambiquePhone(celularNumber) && styles.inputError
          ]}>
            <Text style={[
              styles.phonePrefix,
              isDark && styles.darkInputText
            ]}>+258</Text>
            <TextInput
              style={[
                styles.phoneInput,
                isDark && styles.darkInputText
              ]}
              placeholder="84 123 4567"
              placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
              value={celularNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
            />
          </View>
          
          {celularNumber && !validateMozambiquePhone(celularNumber) && (
            <Text style={styles.fieldErrorText}>
              Deve ter 9 dígitos e começar com 8
            </Text>
          )}
          
          {celularNumber && validateMozambiquePhone(celularNumber) && (
            <Text style={styles.fieldSuccessText}>✓ Número válido</Text>
          )}
          
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark && styles.darkInputText,
              password && password.length < 6 && styles.inputError
            ]}
            placeholder="Senha"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {password && password.length < 6 && (
            <Text style={styles.fieldErrorText}>A senha deve ter pelo menos 6 caracteres</Text>
          )}
          
          {password && password.length >= 6 && (
            <Text style={styles.fieldSuccessText}>✓ Senha válida</Text>
          )}
          
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark && styles.darkInputText,
              confirmPassword && password !== confirmPassword && styles.inputError
            ]}
            placeholder="Confirmar Senha"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          {confirmPassword && password !== confirmPassword && (
            <Text style={styles.fieldErrorText}>As senhas não coincidem</Text>
          )}
          
          {confirmPassword && password === confirmPassword && password.length >= 6 && (
            <Text style={styles.fieldSuccessText}>✓ Senhas coincidem</Text>
          )}
        </View>

        {/* Seleção de tipo de usuário */}
        <View style={styles.userTypeContainer}>
          <Text style={[styles.userTypeTitle, isDark && styles.darkText]}>
            Tipo de conta
          </Text>
          
          <View style={styles.userTypeOptions}>
            <TouchableOpacity
              style={[
                styles.userTypeOption,
                !isDeliverer && styles.userTypeOptionSelected,
                isDark ? styles.darkUserTypeOption : styles.lightUserTypeOption,
                !isDeliverer && (isDark ? styles.darkUserTypeOptionSelected : styles.lightUserTypeOptionSelected)
              ]}
              onPress={() => setIsDeliverer(false)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.userTypeOptionText,
                !isDeliverer && styles.userTypeOptionTextSelected,
                isDark && styles.darkText,
                !isDeliverer && styles.lightText
              ]}>
                Cliente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.userTypeOption,
                isDeliverer && styles.userTypeOptionSelected,
                isDark ? styles.darkUserTypeOption : styles.lightUserTypeOption,
                isDeliverer && (isDark ? styles.darkUserTypeOptionSelected : styles.lightUserTypeOptionSelected)
              ]}
              onPress={() => setIsDeliverer(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.userTypeOptionText,
                isDeliverer && styles.userTypeOptionTextSelected,
                isDark && styles.darkText,
                isDeliverer && styles.lightText
              ]}>
                Entregador
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {success ? (
          <Text style={styles.successText}>{success}</Text>
        ) : null}

        {/* Primary Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton, 
            (loading || 
             password !== confirmPassword || 
             password.length < 6 || 
             !validateMozambiquePhone(celularNumber) ||
             !validateEmail(email)) && styles.disabledButton
          ]}
          onPress={handleRegister}
          disabled={loading || 
                   password !== confirmPassword || 
                   password.length < 6 || 
                   !validateMozambiquePhone(celularNumber) ||
                   !validateEmail(email)}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Text>
        </TouchableOpacity>

        {/* Terms Text */}
        <Text style={[styles.termsText, isDark && styles.darkSecondaryText]}>
          Ao criar uma conta, você concorda com nossos{' '}
          <Text style={styles.termsLink}>Termos de Uso</Text>
          {' '}e{' '}
          <Text style={styles.termsLink}>Política de Privacidade</Text>
        </Text>
      </View>

      {/* Footer */}
      <TouchableOpacity 
        style={styles.footer}
        onPress={() => router.push('/login')}
        activeOpacity={0.7}
      >
        <Text style={[styles.footerText, isDark && styles.darkSecondaryText]}>
          Já tem conta? 
        </Text>
        <Text style={styles.footerLink}> Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 32,
  },
  lightContainer: {
    backgroundColor: '#FDFDFB',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: -0.01,
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7A00',
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // Form
  formContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lightSurface: {
    backgroundColor: '#FFFFFF',
  },
  darkSurface: {
    backgroundColor: '#1E1E1E',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },

  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  lightInput: {
    backgroundColor: '#FDFDFB',
    borderColor: '#E0E0E0',
    color: '#1A1A1A',
  },
  darkInput: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  darkInputText: {
    color: '#FFFFFF',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FF7A00',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  termsLink: {
    color: '#008A44',
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#5C5C5C',
  },
  footerLink: {
    fontSize: 14,
    color: '#008A44',
    fontWeight: '600',
  },

  // Error
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Success
  successText: {
    color: '#34C759',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },

  // Dark theme text
  darkText: {
    color: '#FFFFFF',
  },
  darkSecondaryText: {
    color: '#8E8E93',
  },
  lightText: {
    color: '#FFFFFF',
  },

  // User Type Selection
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  userTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeOption: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  lightUserTypeOption: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  darkUserTypeOption: {
    backgroundColor: 'transparent',
    borderColor: '#3A3A3C',
  },
  userTypeOptionSelected: {
    backgroundColor: '#FF7A00',
  },
  lightUserTypeOptionSelected: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  darkUserTypeOptionSelected: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  userTypeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  userTypeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Input validation styles
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  fieldSuccessText: {
    color: '#34C759',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Phone input styles
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    color: '#008A44',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    height: 52,
  },
});
