import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text } from 'react-native';
let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}

// Espera receber os dados do produto via params
export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const {
    name,
    price,
    image_url,
    sharedId,
    description,
    stock_quantity,
    is_active,
    category_id,
    category_name
  } = params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Platform.OS === 'web' || !SharedElement ? (
        <Image source={{ uri: image_url as string }} style={styles.image} />
      ) : (
        <SharedElement id={sharedId as string} style={styles.image} onNode={() => {}}>
          <Image source={{ uri: image_url as string }} style={styles.image} />
        </SharedElement>
      )}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.price}>MZN {price}</Text>
      <Text style={styles.description}>
        <Text style={styles.detailLabel}>Descrição:</Text> {description && String(description).trim() ? description : 'Sem descrição'}
      </Text>
      <Text style={styles.detail}><Text style={styles.detailLabel}>Categoria:</Text> {category_name || category_id}</Text>
      <Text style={styles.detail}><Text style={styles.detailLabel}>Estoque:</Text> {stock_quantity}</Text>
      <Text style={styles.detail}><Text style={styles.detailLabel}>Ativo:</Text> {(
        is_active === true ||
        is_active === 'true' ||
        (Array.isArray(is_active) && is_active[0] === 'true')
      ) ? 'Sim' : 'Não'}</Text>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FDFDFB',
    minHeight: '100%',
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#008A44',
    marginBottom: 12,
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF7A00',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  detail: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#008A44',
  },
});
