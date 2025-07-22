

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useAuthUser } from '../../hooks/useAuthUser';
import DrawerUserHeader from '../components/DrawerUserHeader';

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
      drawerContent={props => {
        // Sobrescreve labels do menu para português
        const newProps = {
          ...props,
          state: {
            ...props.state,
            routes: props.state.routes.map(route => {
              if (route.name === 'favorites') {
                return { ...route, name: 'Favoritos' };
              }
              if (route.name === 'profile') {
                return { ...route, name: 'Perfil' };
              }
              return route;
            })
          }
        };
        return (
          <DrawerContentScrollView {...props}>
            <DrawerUserHeader />
            <DrawerItemList {...newProps} />
          </DrawerContentScrollView>
        );
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
      {/* Opção de tema sempre visível */}
      <Drawer.Screen
        name="theme-settings"
        options={{
          title: 'Tema',
          drawerLabel: 'Tema',
        }}
      />
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {user ? (
        <>
          <Drawer.Screen
            name="favorites"
            options={{
              drawerLabel: () => <>{'Favoritos'}</>,
              title: 'Favoritos',
              headerTitle: 'Favoritos',
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: () => <>{'Perfil'}</>,
              title: 'Perfil',
              headerTitle: 'Perfil',
            }}
          />
        </>
      ) : null}
    </Drawer>
  );
}
