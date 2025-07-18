import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

export default function ThemeSettings() {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme || 'light');

  return (
    <View style={[styles.container, theme === 'dark' ? styles.dark : styles.light]}>
      <Text style={styles.title}>Configuração de Tema</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Modo Escuro</Text>
        <Switch
          value={theme === 'dark'}
          onValueChange={v => setTheme(v ? 'dark' : 'light')}
        />
      </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#008A44',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    color: '#1A1A1A',
    marginRight: 12,
  },
  dark: {
    backgroundColor: '#121212',
  },
  light: {
    backgroundColor: '#FDFDFB',
  },
});
