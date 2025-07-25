import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useAuthUser } from '../hooks/useAuthUser';

interface AppHeaderProps {
  title?: string;
  onMenuPress?: () => void;
  showCart?: boolean;
  showUser?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title = '', onMenuPress, showCart = true, showUser = true }) => {
  const router = useRouter();
  const user = useAuthUser();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} accessibilityLabel="Abrir menu">
        <Icon name="menu" size={28} color="#008A44" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightIcons}>
        {showCart && (
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton} accessibilityLabel="Abrir carrinho">
            <Icon name="shopping-cart" size={24} color="#008A44" />
          </TouchableOpacity>
        )}
        {showUser && user && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.iconButton} accessibilityLabel="Ir para o perfil">
            <Icon name="user" size={24} color="#008A44" />
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
    elevation: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    color: '#008A44',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AppHeader;
