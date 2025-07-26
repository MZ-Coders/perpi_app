import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
// import supabase client here

export default function UserProfileScreen({ navigation }) {
  // TODO: Fetch user data from Supabase
  const colorScheme = useColorScheme();
  const user = {
    name: 'Cliente Um',
    email: 'cliente1@example.com',
    phone: '258840000001',
    role: 'customer',
  };

  return (
    <View style={[styles.container, colorScheme === 'dark' ? styles.dark : styles.light]}>
      <AppHeader title="Perfil" />
      <Text style={styles.title}>Perfil do Usuário</Text>
      <Text style={styles.label}>Nome: <Text style={styles.value}>{user.name}</Text></Text>
      <Text style={styles.label}>Email: <Text style={styles.value}>{user.email}</Text></Text>
      <Text style={styles.label}>Telefone: <Text style={styles.value}>{user.phone}</Text></Text>
      <Text style={styles.label}>Tipo: <Text style={styles.value}>{user.role}</Text></Text>
      <TouchableOpacity style={styles.button} onPress={() => {/* TODO: Implement logout */}}>
        <Text style={styles.buttonText}>Sair</Text>
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
  label: {
    fontSize: 16,
    color: '#5C5C5C',
    marginBottom: 8,
  },
  value: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF7A00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
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
