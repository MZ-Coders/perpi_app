import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://venpdlamvxpqnhqtkgrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnBkbGFtdnhwcW5ocXRrZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzIxMjEsImV4cCI6MjA2ODQwODEyMX0.HSG7bLA6fFJxXjV4dakKYlNntvFvpiIBP9TFqmZ1HSE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: '', sobrenome: '', celular: '', profile_picture_url: '' });
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();
      if (authError) {
        Alert.alert('Erro ao buscar usuário', authError.message || JSON.stringify(authError));
        return;
      }
      if (user) {
        // Busca dados extras na tabela users_
        const { data, error: selectError } = await supabase.from('users_').select('*').eq('id', user.id).single();
        let userData = data;
        if (selectError) {
          Alert.alert('Erro ao buscar perfil', selectError.message || JSON.stringify(selectError));
        }
        // Se não existe, cria registro
        if (!userData) {
          // Campos obrigatórios do schema
          const insertPayload: any = {
            id: user.id,
            email: user.email,
            nome: '',
            sobrenome: '',
            celular: '',
            profile_picture_url: '',
            full_name: user.user_metadata?.full_name || user.email || '',
            password_hash: '',
            user_role: 'customer',
            is_verified: false
          };
          const { data: insertData, error: insertError } = await supabase.from('users_').insert(insertPayload).select().single();
          if (insertError) {
            Alert.alert('Erro ao criar perfil', insertError.message || JSON.stringify(insertError));
            return;
          }
          userData = insertData;
        }
        setUser({ ...user, ...userData });
        setForm({
          nome: userData?.nome || '',
          sobrenome: userData?.sobrenome || '',
          celular: userData?.celular || '',
          profile_picture_url: userData?.profile_picture_url || '',
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
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado.');
      return;
    }
    // Monta objeto apenas com campos definidos
    const updateData: any = {
      id: user.id,
      email: user.email,
      nome: form.nome,
      sobrenome: form.sobrenome,
      celular: form.celular,
      profile_picture_url: form.profile_picture_url,
      full_name: user.user_metadata?.full_name || user.email || '',
      password_hash: '',
      user_role: 'customer',
      is_verified: false
    };
    const { error, status, data } = await supabase.from('users_').update(updateData).eq('id', user.id);
    if (error) {
      Alert.alert('Erro ao atualizar perfil', error.message || JSON.stringify(error));
    } else if (status !== 204 && !data) {
      Alert.alert('Erro', 'Perfil não foi atualizado. Nenhum dado retornado.');
    } else {
      setUser({ ...user, ...form });
      setEditMode(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    Alert.alert('Logout', 'Você saiu da conta.');
    setUser(null);
    // Redireciona para login (expo-router)
    // Se estiver usando expo-router:
    try {
      // @ts-ignore
      if (typeof window === 'undefined') {
        // mobile: use navigation
        // @ts-ignore
        const navigation = require('expo-router').useRouter();
        navigation.replace('/login');
      } else {
        // web: reload
        window.location.href = '/login';
      }
    } catch (e) {
      // fallback: reload
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil do Usuário</Text>
      <View style={styles.avatarContainer}>
        {form.profile_picture_url ? (
          <Image source={{ uri: form.profile_picture_url }} style={styles.avatar} />
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
            value={form.profile_picture_url}
            onChangeText={v => setForm(f => ({ ...f, profile_picture_url: v }))}
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
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      {/* Botão para navegação à tela de recuperação de senha */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#FF7A00', marginTop: 10 }]}
        disabled={recovering}
        onPress={async () => {
          setRecovering(true);
          try {
            // @ts-ignore
            const navigation = require('expo-router').useRouter();
            navigation.push('/password-recovery');
            // Sinal visual: aguarda 1s para mostrar que algo aconteceu
            setTimeout(() => setRecovering(false), 1000);
          } catch (e) {
            setRecovering(false);
            Alert.alert('Navegação', 'Acesse a tela de recuperação de senha pelo menu principal.');
          }
        }}
      >
        <Text style={styles.logoutButtonText}>{recovering ? 'Abrindo...' : 'Recuperar Senha'}</Text>
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
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#E53935',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
