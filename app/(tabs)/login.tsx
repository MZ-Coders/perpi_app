import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-url-polyfill/auto';
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
        redirectTo: 'exp://localhost:19000', // ajuste para seu ambiente
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } // O fluxo OAuth redireciona automaticamente
  };

  return (
    <View style={[styles.container, colorScheme === 'dark' ? styles.dark : styles.light]}>
      <Text style={styles.title}>Entrar</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.oauthButton} onPress={() => handleOAuthLogin('google')}>
        <Text style={styles.oauthButtonText}>Entrar com Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.oauthButton} onPress={() => handleOAuthLogin('facebook')}>
        <Text style={styles.oauthButtonText}>Entrar com Facebook</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#008A44',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#FF7A00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#008A44',
    marginTop: 8,
  },
  oauthButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 8,
  },
  oauthButtonText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dark: {
    backgroundColor: '#121212',
  },
  light: {
    backgroundColor: '#FDFDFB',
  },
});
