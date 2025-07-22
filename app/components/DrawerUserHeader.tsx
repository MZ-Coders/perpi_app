import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DrawerUserHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('users_').select('nome, sobrenome, profile_picture_url, email').eq('id', user.id).single();
        setUser({ ...user, ...data });
      }
    }
    fetchUser();
  }, []);

  if (!user) return null;
  const name = user.nome || user.sobrenome ? `${user.nome || ''} ${user.sobrenome || ''}`.trim() : (user.user_metadata?.full_name || user.email || 'Usuário');
  const avatar = user.profile_picture_url;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <View style={styles.header}>
      {avatar ? (
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
