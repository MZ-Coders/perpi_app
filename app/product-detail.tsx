import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Platform } from 'react-native';
let SharedElement: any = null;
if (Platform.OS !== 'web') {
  SharedElement = require('react-native-shared-element').SharedElement;
}
import { useLocalSearchParams } from 'expo-router';

// Espera receber os dados do produto via params
export default function ProductDetailScreen() {
  const params = useLocalSearchParams();
  const { name, price, image_url, sharedId } = params;

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
      {/* Adicione aqui mais detalhes do produto, descrição, avaliações, etc. */}
    </ScrollView>
  );
// For react-navigation-shared-element or Expo Router v2+ stack, export sharedElements config
// This is required for the animation to work
// @ts-ignore
ProductDetailScreen.sharedElements = (route) => {
  const { sharedId } = route?.params || {};
  return sharedId ? [sharedId] : [];
};
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
});
