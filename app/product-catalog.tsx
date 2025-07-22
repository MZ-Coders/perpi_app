import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProductCatalogScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (search.length > 0) {
      setFiltered(products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())));
    } else {
      setFiltered(products);
    }
  }, [search, products]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('id, name, price, image_url');
    console.log('Produtos:', data, 'Erro:', error);
    setLoading(false);
    if (!error && data) setProducts(data);
  }

  function renderProduct({ item }: { item: any }) {
    return (
      <TouchableOpacity style={viewType === 'grid' ? styles.card : styles.listItem}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>R$ {item.price}</Text>
          {/* TODO: Adicionar avaliação, favoritos, botão carrinho */}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catálogo de Produtos</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={() => setViewType(viewType === 'grid' ? 'list' : 'grid')} style={styles.toggleBtn}>
          <Text>{viewType === 'grid' ? 'Lista' : 'Grade'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        key={viewType}
        keyExtractor={item => item.id.toString()}
        numColumns={viewType === 'grid' ? 2 : 1}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32 }}>Nenhum produto encontrado.</Text>}
        refreshing={loading}
        onRefresh={fetchProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFB', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#008A44' },
  searchRow: { flexDirection: 'row', marginBottom: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 8, backgroundColor: '#fff' },
  toggleBtn: { marginLeft: 8, padding: 8, backgroundColor: '#E0E0E0', borderRadius: 8 },
  card: { flex: 1, margin: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  listItem: { flexDirection: 'row', marginVertical: 8, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  image: { width: 80, height: 80, borderRadius: 8, marginBottom: 8 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  price: { color: '#FF7A00', fontWeight: 'bold', fontSize: 15 },
});
