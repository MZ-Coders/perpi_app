

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthUser } from '../../hooks/useAuthUser';
import DrawerUserHeader from '../components/DrawerUserHeader';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  const router = useRouter();
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
          title: 'Catálogo',
          drawerLabel: 'Catálogo',
          headerRight: ({ tintColor }) =>
            user ? (
              <>
              <TouchableOpacity
                onPress={() => {
                  // Dispara um evento customizado para abrir o modal do carrinho na tela de catálogo
                  if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('abrirCarrinho'));
                  }
                }}
                style={{ marginRight: 8, padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.08)' }}
                accessibilityLabel="Abrir carrinho"
              >
                <Icon name="shopping-cart" size={24} color={tintColor || '#008A44'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                style={{ marginRight: 16, padding: 6, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.08)' }}
                accessibilityLabel="Ir para o perfil"
              >
                <Icon name="user" size={24} color={tintColor || '#008A44'} />
              </TouchableOpacity>
              </>
            ) : null,
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
