import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRecovery = async () => {
    setFeedback(null);
    if (!email) {
      setFeedback({ type: 'error', message: 'Digite seu e-mail.' });
      return;
    }
    // Validação simples de e-mail
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setFeedback({ type: 'error', message: 'Digite um e-mail válido.' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) {
        if (error.status === 429 || error.message?.includes('Too Many Requests')) {
          setFeedback({ type: 'error', message: 'Você solicitou recuperação de senha muitas vezes. Aguarde alguns minutos antes de tentar novamente.' });
        } else if (error.status === 400 || error.message?.toLowerCase().includes('invalid email')) {
          setFeedback({ type: 'error', message: 'E-mail inválido. Confira o endereço digitado.' });
        } else if (error.status === 404 || error.message?.toLowerCase().includes('user not found')) {
          setFeedback({ type: 'error', message: 'Não existe conta para este e-mail.' });
        } else if (error.status === 403 || error.message?.toLowerCase().includes('not allowed')) {
          setFeedback({ type: 'error', message: 'Não é permitido recuperar senha para este usuário.' });
        } else if (error.status === 500 || error.message?.toLowerCase().includes('server error')) {
          setFeedback({ type: 'error', message: 'Ocorreu um erro interno. Tente novamente mais tarde.' });
        } else {
          setFeedback({ type: 'error', message: error.message || 'Erro ao enviar recuperação.' });
        }
      } else {
        setFeedback({ type: 'success', message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
      }
    } catch (e) {
      setLoading(false);
      setFeedback({ type: 'error', message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperação de Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Digite seu e-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TouchableOpacity style={styles.button} onPress={handleRecovery} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar recuperação'}</Text>
      </TouchableOpacity>
      {feedback && (
        <View style={[styles.feedback, feedback.type === 'success' ? styles.success : styles.error]}>
          <Text style={{ color: feedback.type === 'success' ? '#008A44' : '#E53935', textAlign: 'center' }}>{feedback.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  success: {
    backgroundColor: '#E6F9F0',
    borderColor: '#008A44',
    borderWidth: 1,
  },
  error: {
    backgroundColor: '#FDECEA',
    borderColor: '#E53935',
    borderWidth: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFB',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008A44',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#008A44',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
