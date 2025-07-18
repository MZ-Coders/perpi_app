import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: '', sobrenome: '', celular: '', avatar_url: '' });

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Busca dados extras na tabela users
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
        setUser({ ...user, ...data });
        setForm({
          nome: data?.nome || '',
          sobrenome: data?.sobrenome || '',
          celular: data?.celular || '',
          avatar_url: data?.avatar_url || '',
        });
      }
    };
    fetchUser();
  }, []);

  const getInitials = (nome: string = '', sobrenome: string = '') => {
    const n = nome?.trim()?.[0] || '';
    const s = sobrenome?.trim()?.[0] || '';
    return (n + s).toUpperCase() || 'U';
  };

  const handleSave = async () => {
    if (!user?.id) return;
    await supabase.from('users').update({
      nome: form.nome,
      sobrenome: form.sobrenome,
      celular: form.celular,
      avatar_url: form.avatar_url,
    }).eq('id', user.id);
    setUser({ ...user, ...form });
    setEditMode(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil do Usuário</Text>
      <View style={styles.avatarContainer}>
        {form.avatar_url ? (
          <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsAvatar}>
            <Text style={styles.initialsText}>
              {getInitials(form.nome, form.sobrenome)}
            </Text>
          </View>
        )}
      </View>
      {editMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={form.nome}
            onChangeText={v => setForm(f => ({ ...f, nome: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Sobrenome"
            value={form.sobrenome}
            onChangeText={v => setForm(f => ({ ...f, sobrenome: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Celular"
            value={form.celular}
            onChangeText={v => setForm(f => ({ ...f, celular: v }))}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="URL do Avatar"
            value={form.avatar_url}
            onChangeText={v => setForm(f => ({ ...f, avatar_url: v }))}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.infoText}>Nome: {user?.nome || '-'}</Text>
          <Text style={styles.infoText}>Sobrenome: {user?.sobrenome || '-'}</Text>
          <Text style={styles.infoText}>Email: {user?.email || '-'}</Text>
          <Text style={styles.infoText}>Celular: {user?.celular || '-'}</Text>
        </>
      )}
      <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(!editMode)}>
        <Text style={styles.editButtonText}>{editMode ? 'Cancelar' : 'Editar Perfil'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFB',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008A44',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
  },
  initialsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#FF7A00',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#008A44',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
