import AppHeaderTransparent from '@/components/AppHeaderTransparent';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { supabase } from '../lib/supabaseClient';


export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: '', sobrenome: '', celular: '', profile_picture_url: '' });

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

  // Detecta se veio do menu: se tem param "fromMenu" ou se não pode voltar
  const isFromMenu = params.fromMenu === '1' || !(router.canGoBack && router.canGoBack());

  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
        <AppHeaderTransparent
          onBack={() => router.back()}
          showCart={false}
          mode={isFromMenu ? 'menu' : 'back'}
        />
      </View>
      
      <StatusBar backgroundColor="#008A44" barStyle="light-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MEU PERFIL</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas informações pessoais</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {form.profile_picture_url ? (
              <Image source={{ uri: form.profile_picture_url }} style={styles.avatar} />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>
                  {getInitials(form.nome, form.sobrenome)}
                </Text>
              </View>
            )}
            {editMode && (
              <Text style={styles.avatarHint}>Adicione uma URL de imagem no campo abaixo</Text>
            )}
          </View>

          {/* User Info Header */}
          {!editMode && (
            <View style={styles.userInfoHeader}>
              <Text style={styles.userName}>
                {user?.nome && user?.sobrenome ? `${user.nome} ${user.sobrenome}` : 'Usuário'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          )}

          {/* Form Section */}
          <View style={styles.formSection}>
            {editMode ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NOME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu nome"
                    value={form.nome}
                    onChangeText={v => setForm(f => ({ ...f, nome: v }))}
                    placeholderTextColor="#5C5C5C"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SOBRENOME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu sobrenome"
                    value={form.sobrenome}
                    onChangeText={v => setForm(f => ({ ...f, sobrenome: v }))}
                    placeholderTextColor="#5C5C5C"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CELULAR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="(00) 00000-0000"
                    value={form.celular}
                    onChangeText={v => setForm(f => ({ ...f, celular: v }))}
                    keyboardType="phone-pad"
                    placeholderTextColor="#5C5C5C"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>FOTO DO PERFIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    value={form.profile_picture_url}
                    onChangeText={v => setForm(f => ({ ...f, profile_picture_url: v }))}
                    placeholderTextColor="#5C5C5C"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.infoSection}>
                <View style={styles.infoGroup}>
                  <Text style={styles.infoGroupTitle}>INFORMAÇÕES PESSOAIS</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nome</Text>
                    <Text style={styles.infoValue}>{user?.nome || 'Não informado'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sobrenome</Text>
                    <Text style={styles.infoValue}>{user?.sobrenome || 'Não informado'}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Celular</Text>
                    <Text style={styles.infoValue}>{user?.celular || 'Não informado'}</Text>
                  </View>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoGroupTitle}>CONTA</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user?.email || 'Não informado'}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {editMode ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>SALVAR ALTERAÇÕES</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => setEditMode(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => setEditMode(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>EDITAR PERFIL</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>SAIR DA CONTA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFB',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#008A44',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  initialsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#008A44',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  avatarHint: {
    fontSize: 12,
    color: '#5C5C5C',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userInfoHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5C5C5C',
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
  },
  editForm: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#008A44',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoSection: {
    gap: 24,
  },
  infoGroup: {
    gap: 16,
  },
  infoGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008A44',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoRow: {
    gap: 6,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C5C5C',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#008A44',
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
    gap: 16,
  },
  editActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF7A00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#FF7A00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#008A44',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#008A44',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});