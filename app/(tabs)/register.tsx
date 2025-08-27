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
  const [celular, setCelular] = useState('');
  const [isDeliverer, setIsDeliverer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    
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
      }

      setLoading(false);
      router.replace('/login');
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
              isDark && styles.darkInputText
            ]}
            placeholder="Email"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark && styles.darkInputText
            ]}
            placeholder="Celular"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={celular}
            onChangeText={setCelular}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={[
              styles.input,
              isDark ? styles.darkInput : styles.lightInput,
              isDark && styles.darkInputText
            ]}
            placeholder="Senha"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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

        {/* Primary Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Cadastrando...' : 'Criar Conta'}
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
});
