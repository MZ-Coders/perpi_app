import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { supabase } from '../../lib/supabaseClient';

export default function DrawerUserHeader({ trigger }: { trigger?: any }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users_').select('nome, sobrenome, profile_picture_url, email').eq('id', user.id).single();
        setUser({ ...user, ...data });
      } else {
        setUser(null);
      }
    }
    fetchUser();
  }, [trigger]);

  let name = 'Guest';
  let avatar = null;
  let initials = '';
  if (user) {
    name = user.nome || user.sobrenome ? `${user.nome || ''} ${user.sobrenome || ''}`.trim() : (user.user_metadata?.full_name || user.email || 'Usuário');
    avatar = user.profile_picture_url;
    initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  }

  return (
    <View style={styles.header}>
      {!user ? (
        <Icon name="user" size={64} color="#888" style={styles.avatar} />
      ) : avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.initials}>{initials}</Text></View>
      )}
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 28, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, backgroundColor: '#E0E0E0' },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  initials: { fontWeight: 'bold', color: '#008A44', fontSize: 28 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#008A44' },
});
