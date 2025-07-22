import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ThemeSettingsScreen() {
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Tenta pegar do localStorage/localStorage polyfill
    const stored = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('theme') : null;
    setTheme(stored || null);
  }, []);

  function setThemeAndPersist(value: string) {
    setTheme(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('theme', value);
    }
    // Força reload para aplicar tema globalmente
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha o tema</Text>
      <TouchableOpacity
        style={[styles.button, theme === 'light' && styles.buttonActive]}
        onPress={() => setThemeAndPersist('light')}
      >
        <Text style={styles.buttonText}>Claro</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, theme === 'dark' && styles.buttonActive]}
        onPress={() => setThemeAndPersist('dark')}
      >
        <Text style={styles.buttonText}>Escuro</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, !theme && styles.buttonActive]}
        onPress={() => setThemeAndPersist('system')}
      >
        <Text style={styles.buttonText}>Automático (Sistema)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 32, color: '#008A44' },
  button: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 18, elevation: 2 },
  buttonActive: { backgroundColor: '#008A44' },
  buttonText: { fontSize: 18, color: '#008A44', fontWeight: 'bold' },
});
