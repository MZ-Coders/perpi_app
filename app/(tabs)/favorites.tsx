import React, { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
    }, [])
  );

  async function fetchFavorites() {
    setLoading(true);
    // Busca favoritos do usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('favorites')
      .select('id, product_id, products(id, name, price, image_url)')
      .eq('user_id', user.id);
    setLoading(false);
    if (!error && data) {
      setFavorites(data);
    }
  }

  async function handleRemoveFavorite(favoriteId: any) {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    fetchFavorites();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Favoritos</Text>
      <FlatList
        data={favorites}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image source={{ uri: item.products?.image_url }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.products?.name}</Text>
              <Text style={styles.price}>MZN {item.products?.price}</Text>
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFavorite(item.id)}>
              <Text style={styles.removeBtnIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum favorito encontrado.</Text>}
        refreshing={loading}
        onRefresh={fetchFavorites}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFB', paddingHorizontal: 16, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#008A44', marginBottom: 18, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, elevation: 2 },
  image: { width: 60, height: 60, borderRadius: 12, marginRight: 16, backgroundColor: '#FDFDFB' },
  name: { fontWeight: 'bold', fontSize: 15, marginBottom: 2, color: '#1A1A1A' },
  price: { color: '#008A44', fontWeight: 'bold', fontSize: 16 },
  removeBtn: { marginLeft: 10, backgroundColor: '#FF7A00', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, justifyContent: 'center', alignItems: 'center' },
  removeBtnIcon: { color: '#fff', fontSize: 18 },
  emptyText: { textAlign: 'center', marginVertical: 24, color: '#5C5C5C', fontSize: 16 },
});
