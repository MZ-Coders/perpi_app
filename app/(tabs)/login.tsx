import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import Logo from '../../components/Logo';
import { supabase } from '../../lib/supabaseClient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.replace('/');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'exp://localhost:19000',
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
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
        <Text style={[styles.formTitle, isDark && styles.darkText]}>Entrar</Text>
        
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
            placeholder="Senha"
            placeholderTextColor={isDark ? '#8E8E93' : '#5C5C5C'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Primary Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, isDark && styles.darkDivider]} />
          <Text style={[styles.dividerText, isDark && styles.darkSecondaryText]}>ou</Text>
          <View style={[styles.divider, isDark && styles.darkDivider]} />
        </View>

        {/* OAuth Buttons */}
        <TouchableOpacity
          style={[styles.secondaryButton, isDark ? styles.darkSecondaryButton : styles.lightSecondaryButton]}
          onPress={() => handleOAuthLogin('google')}
          activeOpacity={0.9}
        >
          <Text style={[styles.secondaryButtonText, isDark && styles.darkText]}>
            Continuar com Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isDark ? styles.darkSecondaryButton : styles.lightSecondaryButton]}
          onPress={() => handleOAuthLogin('facebook')}
          activeOpacity={0.9}
        >
          <Text style={[styles.secondaryButtonText, isDark && styles.darkText]}>
            Continuar com Facebook
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <TouchableOpacity 
        style={styles.footer}
        onPress={() => router.push('/register')}
        activeOpacity={0.7}
      >
        <Text style={[styles.footerText, isDark && styles.darkSecondaryText]}>
          Não tem conta? 
        </Text>
        <Text style={styles.footerLink}> Cadastre-se</Text>
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

  secondaryButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  lightSecondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  darkSecondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#3A3A3C',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  darkDivider: {
    backgroundColor: '#3A3A3C',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#5C5C5C',
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
});