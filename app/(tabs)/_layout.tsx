
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        // You can customize the drawer style and header here
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Home',
          drawerLabel: 'Catálogo',
          // Optionally add an icon here
        }}
      />
      <Drawer.Screen
        name="explore"
        options={{
          title: 'Explore',
          drawerLabel: 'Explorar',
        }}
      />
      <Drawer.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          drawerLabel: 'Favoritos',
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Perfil',
          drawerLabel: 'Perfil',
        }}
      />
    </Drawer>
  );
}
