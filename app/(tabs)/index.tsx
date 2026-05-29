import { View, Text, ScrollView, Pressable, StyleSheet, FlatList, ActivityIndicator, Modal, Alert, Image, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { getImageUrl } from '../../services/cloudinary';
import * as Linking from 'expo-linking';

const BANNERS = [
  { id: '1', image: require('../../assets/uniformes.png'), title: 'PROMOÇÃO ESPECIAL', subtitle: 'ATÉ 30% OFF' },
  { id: '2', image: require('../../assets/vascao.png'), title: 'NOVOS LANÇAMENTOS', subtitle: 'COLEÇÃO 2024' },
  { id: '3', image: require('../../assets/banner2.png'), title: 'FRETE GRÁTIS', subtitle: 'ACIMA DE R$ 199' },
];

export default function HomeScreen() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
  const [user, setUser] = useState<any>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  
  // Novos estados
  const [searchQuery, setSearchQuery] = useState('');
  const [anoFiltro, setAnoFiltro] = useState('Todos');
  const [showAnos, setShowAnos] = useState(false);
  const bannerRef = useRef<any>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const produtosRef = ref(db, 'produtos');
    const unsubscribeProdutos = onValue(produtosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setProdutos(lista);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const favRef = ref(db, `users/${currentUser.uid}/favoritos`);
        onValue(favRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setFavoritos(Object.keys(data));
          } else {
            setFavoritos([]);
          }
        });
      } else {
        setFavoritos([]);
      }
    });

    // Auto-scroll banner
    const bannerInterval = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => {
      unsubscribeProdutos();
      unsubscribeAuth();
      clearInterval(bannerInterval);
    };
  }, []);

  // Lógica de Filtro e Pesquisa
  const anosDisponiveis = ['Todos', ...Array.from(new Set(produtos.map(p => p.ano).filter(Boolean))).sort().reverse()];

  const produtosFiltrados = produtos.filter((p) => {
    const matchCategoria = categoriaAtiva === 'Todos' || (p.categoria && p.categoria.toLowerCase() === categoriaAtiva.toLowerCase());
    const matchAno = anoFiltro === 'Todos' || p.ano === anoFiltro;
    const matchSearch = searchQuery === '' || (p.nome && p.nome.toLowerCase().includes(searchQuery.toLowerCase())) || (p.time && p.time.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategoria && matchAno && matchSearch;
  });

  const abrirProduto = (produto: any) => {
    setProdutoSelecionado(produto);
    setTamanhoSelecionado('');
  };

  const fecharProduto = () => {
    setProdutoSelecionado(null);
    setTamanhoSelecionado('');
  };

  async function toggleFavorito(produtoId: string, e: any) {
    e.stopPropagation();
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para favoritar produtos');
      return;
    }
    const favRef = ref(db, `users/${user.uid}/favoritos/${produtoId}`);
    if (favoritos.includes(produtoId)) {
      await remove(favRef);
    } else {
      await set(favRef, true);
    }
  }

  async function adicionarAoCarrinho() {
    if (!user) {
      Alert.alert('Login necessário', 'Faça login para adicionar ao carrinho');
      return;
    }
    if (!tamanhoSelecionado) {
      Alert.alert('Selecione um tamanho');
      return;
    }
    const carrinhoRef = ref(db, `users/${user.uid}/carrinho`);
    const novoItemRef = push(carrinhoRef);
    await set(novoItemRef, {
      produtoId: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      preco: produtoSelecionado.preco,
      time: produtoSelecionado.time,
      imagem: produtoSelecionado.imagem,
      ano: produtoSelecionado.ano,
      tamanho: tamanhoSelecionado,
      quantidade: 1,
      adicionadoEm: new Date().toISOString(),
    });
    Alert.alert('Sucesso', 'Produto adicionado ao carrinho!');
    fecharProduto();
  }

  function comprarWhatsApp() {
    const tamanho = tamanhoSelecionado || 'Não selecionado';
    const mensagem = `Olá! Quero comprar o uniforme:\n\n🏟️ Time: ${produtoSelecionado.time}\n👕 Produto: ${produtoSelecionado.nome}\n📅 Ano: ${produtoSelecionado.ano}\n📏 Tamanho: ${tamanho}\n💰 Preço: R$ ${produtoSelecionado.preco ? produtoSelecionado.preco.toFixed(2) : '0.00'}\n\nPodemos finalizar a compra?`;
    const url = `https://wa.me/5592984372524?text=${encodeURIComponent(mensagem)}`;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1A5FA0" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const renderCategoria = ({ item }: any) => (
    <Pressable
      style={[styles.categoriaButton, categoriaAtiva === item && styles.categoriaButtonActive]}
      onPress={() => setCategoriaAtiva(item)}
    >
      <Text style={[styles.categoriaText, categoriaAtiva === item && styles.categoriaTextActive]}>{item}</Text>
    </Pressable>
  );

  const renderProduto = ({ item }: any) => {
    const isFavorito = favoritos.includes(item.id);
    return (
      <Pressable style={styles.card} onPress={() => abrirProduto(item)}>
        <View style={styles.imageContainer}>
          {item.imagem ? (
            <Image source={{ uri: getImageUrl(item.imagem, 300) }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="shirt-outline" size={40} color="#333333" />
            </View>
          )}
        </View>
        <Pressable style={styles.favoriteButton} onPress={(e) => toggleFavorito(item.id, e)}>
          <Ionicons name={isFavorito ? 'heart' : 'heart-outline'} size={18} color={isFavorito ? '#EF4444' : '#FFFFFF'} />
        </Pressable>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTeam}>{item.time}</Text>
          <Text style={styles.cardName} numberOfLines={1}>{item.nome}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>R$ {item.preco ? item.preco.toFixed(2) : '0.00'}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerWelcome}>Bem-vindo</Text>
            <Text style={styles.headerName}>KaSports</Text>
          </View>
        </View>
        <Pressable style={styles.notificationButton} onPress={() => Alert.alert("Notificações", "Você não tem novas notificações.")}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        
        {/* Barra de Pesquisa */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#808080" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por time ou produto..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#808080" />
            </Pressable>
          )}
        </View>

        {/* Banner Carrossel */}
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
              setActiveBanner(index);
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.banner}>
                <Image source={item.image} style={styles.bannerImage} resizeMode="cover" />
                <View style={styles.bannerOverlay} />
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  <Pressable style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>VER OFERTAS</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
          {/* Indicadores do Banner */}
          <View style={styles.bannerDots}>
            {BANNERS.map((_, index) => (
              <View key={index} style={[styles.dot, activeBanner === index && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Categorias e Filtro de Ano */}
        <View style={styles.filtersRow}>
          <FlatList
            data={['Todos', 'Home', 'Away', 'Third']}
            renderItem={renderCategoria}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriasList}
          />
         
        </View>

       
        

        {/* Produtos Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produtos Populares</Text>
          <Text style={styles.sectionCount}>{produtosFiltrados.length} itens</Text>
        </View>

        {/* Produtos Grid */}
        {produtosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#333333" />
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        ) : (
          <FlatList
            data={produtosFiltrados}
            renderItem={renderProduto}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.produtosRow}
            contentContainerStyle={styles.produtosList}
          />
        )}

        {/* Seção Visual: Vantagens */}
        <View style={styles.vantagensContainer}>
          <Text style={styles.vantagensTitle}>Por que escolher a KaSports?</Text>
          <View style={styles.vantagemItem}>
            <View style={styles.vantagemIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#1A5FA0" />
            </View>
            <View style={styles.vantagemInfo}>
              <Text style={styles.vantagemText}>100% Original</Text>
              <Text style={styles.vantagemSubtext}>Garantia de autenticidade</Text>
            </View>
          </View>
          <View style={styles.vantagemItem}>
            <View style={styles.vantagemIcon}>
              <Ionicons name="rocket-outline" size={24} color="#1A5FA0" />
            </View>
            <View style={styles.vantagemInfo}>
              <Text style={styles.vantagemText}>Envio Rápido</Text>
              <Text style={styles.vantagemSubtext}>Entrega em até 5 dias</Text>
            </View>
          </View>
          <View style={styles.vantagemItem}>
            <View style={styles.vantagemIcon}>
              <Ionicons name="refresh-outline" size={24} color="#1A5FA0" />
            </View>
            <View style={styles.vantagemInfo}>
              <Text style={styles.vantagemText}>Troca Fácil</Text>
              <Text style={styles.vantagemSubtext}>7 dias para devolver</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* MODAL DO PRODUTO REFORMULADO */}
      <Modal visible={produtoSelecionado !== null} animationType="slide">
        <View style={styles.modalContainer}>
          {produtoSelecionado && (
            <>
              {/* Imagem do Modal com botões em cima */}
              <View style={styles.modalImageContainer}>
                <Image 
                  source={produtoSelecionado.imagem ? { uri: getImageUrl(produtoSelecionado.imagem, 600) } : require('../../assets/uniformes.png')} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <View style={styles.modalTopButtons}>
                  <Pressable onPress={fecharProduto} style={styles.modalCircleButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={styles.modalCircleButton} onPress={() => toggleFavorito(produtoSelecionado.id, { stopPropagation: () => {} })}>
                    <Ionicons name={favoritos.includes(produtoSelecionado.id) ? 'heart' : 'heart-outline'} size={24} color={favoritos.includes(produtoSelecionado.id) ? '#EF4444' : '#FFFFFF'} />
                  </Pressable>
                </View>
              </View>

              {/* Card de Informações (Sobe por cima da imagem) */}
              <View style={styles.modalDetailsCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeaderInfo}>
                    <View>
                      <Text style={styles.modalTeam}>{produtoSelecionado.time}</Text>
                      <Text style={styles.modalName} numberOfLines={2}>{produtoSelecionado.nome}</Text>
                      <Text style={styles.modalYear}>{produtoSelecionado.ano}</Text>
                    </View>
                    <View style={styles.modalPriceTag}>
                      <Text style={styles.modalPrice}>R$ {produtoSelecionado.preco ? produtoSelecionado.preco.toFixed(2) : '0.00'}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalDesc}>{produtoSelecionado.descricao}</Text>

                  <Text style={styles.sizeLabel}>Selecione o Tamanho:</Text>
                  <View style={styles.sizeOptions}>
                    {['P', 'M', 'G', 'GG'].map((tamanho) => {
                      const disponivel = produtoSelecionado.quantidadeDisponivel && produtoSelecionado.quantidadeDisponivel[tamanho] > 0;
                      const selecionado = tamanhoSelecionado === tamanho;
                      return (
                        <Pressable
                          key={tamanho}
                          style={[styles.sizeButton, selecionado ? styles.sizeButtonActive : (!disponivel && styles.sizeButtonDisabled)]}
                          onPress={() => disponivel && setTamanhoSelecionado(tamanho)}
                          disabled={!disponivel}
                        >
                          <Text style={[styles.sizeButtonText, selecionado ? styles.sizeButtonTextActive : (!disponivel && styles.sizeButtonTextDisabled)]}>
                            {tamanho}
                          </Text>
                          {disponivel && <Text style={styles.sizeStock}>{produtoSelecionado.quantidadeDisponivel[tamanho]} un</Text>}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable 
                      style={[styles.cartButton, !tamanhoSelecionado && styles.cartButtonDisabled]} 
                      onPress={adicionarAoCarrinho}
                      disabled={!tamanhoSelecionado}
                    >
                      <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.cartButtonText}>
                        {tamanhoSelecionado ? 'Adicionar ao Carrinho' : 'Selecione um tamanho'}
                      </Text>
                    </Pressable>

                    <Pressable style={styles.whatsappButton} onPress={comprarWhatsApp}>
                      <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                      <Text style={styles.whatsappButtonText}>Comprar no WhatsApp</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </>
          )}
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#808080',
    marginTop: 16,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A5FA0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWelcome: {
    color: '#808080',
    fontSize: 12,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
    height: 50,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },

  // Banner
  bannerWrapper: {
    marginHorizontal: 20,
    marginBottom: 5,
  },
  banner: {
    width: 340, // Aproximação da largura da tela com padding
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 15,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 1,
  },
  bannerTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    color: '#0D0D0D',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  dotActive: {
    backgroundColor: '#1A5FA0',
    width: 20,
  },

  // Filters Row
  filtersRow: {
    
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoriasList: {
   
    paddingHorizontal: 30,
    marginBottom: 8,
    flex: 1,
  },
  categoriaButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 8,
  },
  categoriaButtonActive: {
    backgroundColor: '#1A5FA0',
    borderColor: '#1A5FA0',
  },
  categoriaText: {
    color: '#808080',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriaTextActive: {
    color: '#FFFFFF',
  },
  anoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1A5FA0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
  },
  anoButtonText: {
    color: '#1A5FA0',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Dropdown Anos
  anosDropdown: {
        paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 8,
  },
  anoItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#252525',
    marginRight: 8,
  },
  anoItemActive: {
    backgroundColor: '#1A5FA0',
  },
  anoItemText: {
    color: '#808080',
    fontSize: 12,
  },
  anoItemTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCount: {
    color: '#808080',
    fontSize: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666666',
    marginTop: 12,
    fontSize: 14,
  },

  // Produtos Grid
  produtosRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  produtosList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#252525',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardTeam: {
    color: '#1A5FA0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Vantagens
  vantagensContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  vantagensTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  vantagemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vantagemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 95, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vantagemInfo: {
    flex: 1,
  },
  vantagemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vantagemSubtext: {
    color: '#808080',
    fontSize: 12,
    marginTop: 2,
  },

  // MODAL REFORMULADO
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  modalImageContainer: {
    height: '45%', // Ocupa quase metade da tela
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalTopButtons: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDetailsCard: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    marginTop: -20, // Efeito de subir por cima da imagem
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTeam: {
    color: '#1A5FA0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
    maxWidth: '80%',
  },
  modalYear: {
    color: '#808080',
    fontSize: 12,
    marginTop: 4,
  },
  modalPriceTag: {
    backgroundColor: '#1A5FA0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDesc: {
    color: '#B3B3B3',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
    marginBottom: 16,
  },
  sizeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sizeButton: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  sizeButtonActive: {
    backgroundColor: 'rgba(26, 95, 160, 0.2)',
    borderColor: '#1A5FA0',
  },
  sizeButtonDisabled: {
    borderColor: '#1A1A1A',
    opacity: 0.4,
  },
  sizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sizeButtonTextActive: {
    color: '#1A5FA0',
  },
  sizeButtonTextDisabled: {
    color: '#333333',
  },
  sizeStock: {
    fontSize: 9,
    color: '#808080',
    marginTop: 2,
  },
  modalActions: {
    paddingBottom: 20,
  },
  cartButton: {
    backgroundColor: '#1A5FA0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cartButtonDisabled: {
    backgroundColor: '#333333',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  whatsappButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
