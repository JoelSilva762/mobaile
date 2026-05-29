import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { ref, onValue, update } from 'firebase/database';
import { auth, db } from '../../services/firebase';

export default function PerfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [nomeEditado, setNomeEditado] = useState('');
  const [telefoneEditado, setTelefoneEditado] = useState('');
  const [enderecoEditado, setEnderecoEditado] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
            setNomeEditado(data.nome || '');
            setTelefoneEditado(data.telefone || '');
            setEnderecoEditado(data.endereco || '');
          }
        });
      }
    });
    return unsubscribe;
  }, []);

  async function handleSair() {
    try {
      await signOut(auth);
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sair');
    }
  }

  async function salvarEdicao() {
    if (!user) return;
    
    try {
      await updateProfile(user, { displayName: nomeEditado });
      await update(ref(db, `users/${user.uid}`), {
        nome: nomeEditado,
        telefone: telefoneEditado,
        endereco: enderecoEditado,
      });
      setEditando(false);
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar');
    }
  }

  // Tela de perfil para convidado (não logado)
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person-outline" size={60} color="#808080" />
          </View>
          <Text style={styles.guestTitle}>Você não está logado</Text>
          <Text style={styles.guestSubtitle}>Faça login para acessar seu perfil e pedidos</Text>
          
          <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </Pressable>
          
          <Pressable style={styles.guestButton} onPress={() => router.push('/cadastro')}>
            <Text style={styles.guestButtonText}>Criar Conta</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AQUI: contentContainerStyle adicionado para não esconder atrás da Tab Bar */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header com avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
            </View>
          </View>
          
          <Text style={styles.nome}>{userData?.nome || 'Usuário'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          {userData?.isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#1A5FA0" />
              <Text style={styles.adminText}>Administrador</Text>
            </View>
          )}
        </View>

        {/* Menu de opções (Limpo) */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Minha Conta</Text>
          
          <Pressable style={styles.menuItem} onPress={() => setEditando(true)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(26, 95, 160, 0.15)' }]}>
              <Ionicons name="person" size={20} color="#1A5FA0" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Editar Perfil</Text>
              <Text style={styles.menuSubtext}>Nome, telefone e endereço</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Ionicons name="bag-handle" size={20} color="#22C55E" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Meus Pedidos</Text>
              <Text style={styles.menuSubtext}>Histórico de compras</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </Pressable>
        </View>

        {/* Configurações */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Suporte</Text>
          
          <Pressable style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Ionicons name="help-circle" size={20} color="#06B6D4" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Ajuda e Suporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </Pressable>
        </View>

        {/* Botão sair */}
        <Pressable style={styles.sairButton} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.sairText}>Sair da Conta</Text>
        </Pressable>
      </ScrollView>

      {/* Modal de edição */}
      <Modal
        visible={editando}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <Pressable onPress={() => setEditando(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={nomeEditado}
                  onChangeText={setNomeEditado}
                  placeholder="Seu nome"
                  placeholderTextColor="#666666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={telefoneEditado}
                  onChangeText={setTelefoneEditado}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#666666"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Endereço</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={enderecoEditado}
                  onChangeText={setEnderecoEditado}
                  placeholder="Rua, número, bairro, cidade"
                  placeholderTextColor="#666666"
                  multiline
                />
              </View>

              <Pressable style={styles.salvarButton} onPress={salvarEdicao}>
                <Text style={styles.salvarButtonText}>Salvar Alterações</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  // AQUI: Espaço para a Tab Bar não sobrepor o botão de sair
  scrollContent: {
    paddingBottom: 120, 
  },
  
  // Guest
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestSubtitle: {
    color: '#808080',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#1A5FA0',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A5FA0',
  },
  guestButtonText: {
    color: '#1A5FA0',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A5FA0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(26, 95, 160, 0.3)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  nome: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#808080',
    fontSize: 14,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 95, 160, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminText: {
    color: '#1A5FA0',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Menu
  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  menuTitle: {
    color: '#808080',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtext: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },

  // Sair
  sairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sairText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#808080',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  salvarButton: {
    backgroundColor: '#1A5FA0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  salvarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});