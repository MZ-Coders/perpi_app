

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import DrawerUserHeader from '../components/DrawerUserHeader';
import { useAuthUser } from '../../hooks/useAuthUser';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        // You can customize the drawer style and header here
      }}
      drawerContent={props => (
        <DrawerContentScrollView {...props}>
          <DrawerUserHeader />
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
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
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {user ? (
        <>
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
        </>
      ) : null}
    </Drawer>
  );
}
