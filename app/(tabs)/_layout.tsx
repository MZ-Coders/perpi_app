// As rotas de Favoritos e Perfil são declaradas dentro do componente, não fora!


import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthUser } from '../../hooks/useAuthUser';
import DrawerUserHeader from '../components/DrawerUserHeader';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAuthUser();
  const router = useRouter();
  // Só renderiza após checar o estado do usuário (undefined = carregando)
  const [checked, setChecked] = React.useState(false);
  React.useEffect(() => {
    setChecked(true);
  }, [user]);
  if (!checked) return null;
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        // You can customize the drawer style and header here
      }}
      drawerContent={props => {
        // Renderiza manualmente os itens do Drawer para garantir apenas labels em português
        const { navigation, state } = props;
        const screens = [
          { key: 'index', label: 'Catálogo', icon: 'home' },
          ...(user ? [
            { key: 'favorites', label: 'Favoritos', icon: 'heart' },
            { key: 'profile', label: 'Perfil', icon: 'user' },
          ] : []),
          { key: 'explore', label: 'Explorar', icon: 'search' },
        ];
        return (
          <DrawerContentScrollView {...props}>
            <DrawerUserHeader />
            {!user && (
              <>
                <TouchableOpacity
                  disabled
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    backgroundColor: 'rgba(255, 215, 0, 0.08)',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                  accessibilityLabel="Aviso de login"
                >
                  <Icon name="alert-circle" size={22} color="#FFA500" style={{ marginRight: 16 }} />
                  <>
                    <span style={{ color: '#FFA500', fontWeight: 'bold' }}>
                      Faça login para aproveitar todos os recursos do app!
                    </span>
                  </>
                </TouchableOpacity>
              </>
            )}
            {screens.map(screen => (
              <TouchableOpacity
                key={screen.key}
                onPress={() => navigation.navigate(screen.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: state.routeNames[state.index] === screen.key ? 'rgba(0,138,68,0.08)' : 'transparent',
                  borderRadius: 8,
                  marginBottom: 2,
                }}
                accessibilityLabel={screen.label}
              >
                <Icon name={screen.icon} size={22} color={state.routeNames[state.index] === screen.key ? '#008A44' : '#888'} style={{ marginRight: 16 }} />
                <>{screen.label}</>
              </TouchableOpacity>
            ))}
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
      {/* Adiciona explicitamente as rotas de Favoritos e Perfil para garantir navegação */}
      {user ? (
        <>
          <Drawer.Screen
            name="favorites"
            options={{
              drawerLabel: 'Favoritos',
              title: 'Favoritos',
              headerTitle: 'Favoritos',
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: 'Perfil',
              title: 'Perfil',
              headerTitle: 'Perfil',
            }}
          />
        </>
      ) : null}
      <Drawer.Screen
        name="explore"
        options={{
          title: 'Explore',
          drawerLabel: 'Explorar',
        }}
      />
      {/* Só mostra Favoritos e Perfil se autenticado */}
      {/* As rotas de Favoritos e Perfil são automáticas pelo Expo Router, não declare manualmente aqui! */}
    </Drawer>
  );
}
