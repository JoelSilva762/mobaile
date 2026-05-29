import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ref, onValue, remove, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../services/firebase';

export default function FavoritosScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      
      if (currentUser) {
        try {
          // Buscar IDs dos favoritos
          const favSnapshot = await get(ref(db, `users/${currentUser.uid}/favoritos`));
          const favData = favSnapshot.val();
          
          if (!favData) {
            setFavoritos([]);
            setLoading(false);
            return;
          }

          const ids = Object.keys(favData);
          console.log('IDs favoritos:', ids); // DEBUG

          // Buscar detalhes dos produtos
          const prodSnapshot = await get(ref(db, 'produtos'));
          const prodData = prodSnapshot.val();
          
          console.log('Produtos no banco:', prodData ? Object.keys(prodData) : 'nenhum'); // DEBUG

          if (prodData) {
            const lista = ids.map(id => {
              const produto = prodData[id];
              if (produto) {
                return {
                  id,
                  ...produto
                };
              }
              return null;
            }).filter(item => item !== null);
            
            console.log('Lista final:', lista); // DEBUG
            setFavoritos(lista);
          }
        } catch (error) {
          console.log('Erro ao buscar favoritos:', error);
        }
        
        setLoading(false);
      } else {
        setFavoritos([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  async function removerFavorito(produtoId: string) {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/favoritos/${produtoId}`));
    
    // Atualizar lista local
    setFavoritos(prev => prev.filter(item => item.id !== produtoId));
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1A5FA0" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="heart-outline" size={64} color="#333333" />
        <Text style={styles.emptyTitle}>Faça login</Text>
        <Text style={styles.emptyText}>Entre na sua conta para ver seus favoritos</Text>
        <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  if (favoritos.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="heart-outline" size={64} color="#333333" />
        <Text style={styles.emptyTitle}>Nenhum favorito</Text>
        <Text style={styles.emptyText}>Toque no coração nos produtos para salvá-los aqui</Text>
        <Pressable style={styles.browseButton} onPress={() => router.push('/')}>
          <Text style={styles.browseButtonText}>Explorar Produtos</Text>
        </Pressable>
      </View>
    );
  }

  const renderFavorito = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="shirt-outline" size={50} color="#333333" />
      </View>
      
      <View style={styles.info}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.ano}>{item.ano}</Text>
        <Text style={styles.preco}>R$ {item.preco ? item.preco.toFixed(2) : '0.00'}</Text>
      </View>

      <Pressable style={styles.removeButton} onPress={() => removerFavorito(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Favoritos</Text>
        <Text style={styles.headerCount}>{favoritos.length} produtos</Text>
      </View>

      <FlatList
        data={favoritos}
        renderItem={renderFavorito}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerCount: {
    color: '#808080',
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  time: {
    color: '#1A5FA0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nome: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  ano: {
    color: '#808080',
    fontSize: 12,
    marginTop: 2,
  },
  preco: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyText: {
    color: '#808080',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#1A5FA0',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  browseButton: {
    backgroundColor: '#1A5FA0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});