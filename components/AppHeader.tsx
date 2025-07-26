import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuthUser } from '../hooks/useAuthUser';

interface AppHeaderProps {
  title?: string;
  onMenuPress?: () => void;
  showCart?: boolean;
  showUser?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title = '', onMenuPress, showCart = true, showUser = true }) => {
  const router = useRouter();
  const navigation = useNavigation();
  const user = useAuthUser();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          if (onMenuPress) {
            onMenuPress();
          } else {
            navigation.dispatch(DrawerActions.openDrawer());
          }
        }}
        style={styles.iconButton}
        accessibilityLabel="Abrir menu"
      >
        <Icon name="menu" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightIcons}>
        {showCart && (
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton} accessibilityLabel="Abrir carrinho">
            <Icon name="shopping-cart" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {showUser && user && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.iconButton} accessibilityLabel="Ir para o perfil">
            <Icon name="user" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40, // Ajuste para evitar sobreposição com a barra de status
    backgroundColor: '#008A44',
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: '#008A44',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    color: '#fff',
    letterSpacing: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default AppHeader;
