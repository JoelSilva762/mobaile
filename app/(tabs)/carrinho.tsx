import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, Alert, Image, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { getImageUrl } from '../../services/cloudinary';
import * as Linking from 'expo-linking';

export default function CarrinhoScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Cupom
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<any>(null);
  const [cupomError, setCupomError] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const cartRef = ref(db, `users/${currentUser.uid}/carrinho`);
        const unsubscribeCart = onValue(cartRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const lista = Object.keys(data).map((key) => ({
              key,
              ...data[key]
            }));
            setCarrinho(lista);
          } else {
            setCarrinho([]);
          }
          setLoading(false);
        });
        
        return () => unsubscribeCart();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  async function removerItem(itemKey: string) {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/carrinho/${itemKey}`));
  }

  async function alterarQuantidade(itemKey: string, novaQuantidade: number) {
    if (!user || novaQuantidade < 1) return;
    await update(ref(db, `users/${user.uid}/carrinho/${itemKey}`), {
      quantidade: novaQuantidade
    });
  }

  // LÓGICA DO CUPOM ATUALIZADA
  async function aplicarCupom() {
    if (!cupomInput.trim() || !user) return;
    setCupomError('');
    Keyboard.dismiss();

    const code = cupomInput.trim().toUpperCase();

    try {
      const cupomRef = ref(db, `cupons/${code}`);
      const snapshot = await get(cupomRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        // 1. Verifica se o cupom está ativo
        if (!data.ativo) {
          setCupomError('Este cupom expirou ou está inativo');
          return;
        }

        // 2. Verifica se o usuário já usou este cupom
        if (data.usadoPor && data.usadoPor[user.uid]) {
          setCupomError('Você já utilizou este cupom');
          return;
        }

        // 3. Verifica se tem desconto válido
        if (data.desconto) {
          setCupomAplicado({ code: code, desconto: data.desconto });
          Alert.alert('Sucesso', `Cupom de ${data.desconto}% aplicado!`);
        } else {
          setCupomError('Cupom inválido');
        }
      } else {
        setCupomError('Cupom não encontrado');
        setCupomAplicado(null);
      }
    } catch (error) {
      setCupomError('Erro ao verificar cupom');
    }
  }

  function removerCupom() {
    setCupomAplicado(null);
    setCupomInput('');
  }

  // CÁLCULOS DE PREÇO
  const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const valorDesconto = cupomAplicado ? (subtotal * (cupomAplicado.desconto / 100)) : 0;
  const total = subtotal - valorDesconto;

  // FINALIZAR PEDIDO ATUALIZADO
  async function finalizarWhatsApp() {
    if (carrinho.length === 0) {
      Alert.alert('Carrinho vazio');
      return;
    }

    // Se tiver um cupom aplicado, marca como usado no banco de dados ANTES de enviar pro WhatsApp
       // Se tiver um cupom aplicado, marca como usado no banco de dados ANTES de enviar pro WhatsApp
    if (cupomAplicado && user) {
      try {
        const cupomRef = ref(db, `cupons/${cupomAplicado.code}`);
        // Usa o update com o caminho dinâmico dentro do objeto
        await update(cupomRef, {
          [`usadoPor/${user.uid}`]: true
        });
      } catch (error) {
        console.log("Erro ao marcar cupom como usado:", error);
        // Continua o processo mesmo se falhar ao marcar
      }
    }
    let mensagem = `Olá! Quero finalizar a compra dos seguintes itens:\n\n`;
    
    carrinho.forEach((item) => {
      const subtotalItem = item.preco * item.quantidade;
      mensagem += `👕 ${item.nome}\n`;
      mensagem += `   Tamanho: ${item.tamanho} | Qtd: ${item.quantidade}\n`;
      mensagem += `   Preço: R$ ${subtotalItem.toFixed(2)}\n\n`;
    });

    mensagem += `💰 Subtotal: R$ ${subtotal.toFixed(2)}\n`;
    if (cupomAplicado) {
      mensagem += `🏷️ Cupom (${cupomAplicado.code}): -${cupomAplicado.desconto}% (R$ ${valorDesconto.toFixed(2)})\n`;
    }
    mensagem += `\n💳 TOTAL FINAL: R$ ${total.toFixed(2)}`;

    const url = `https://wa.me/5592984372524?text=${encodeURIComponent(mensagem)}`;
    Linking.openURL(url);
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
        <Ionicons name="cart-outline" size={64} color="#333333" />
        <Text style={styles.emptyTitle}>Faça login</Text>
        <Text style={styles.emptyText}>Entre na sua conta para ver seu carrinho</Text>
        <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }

  if (carrinho.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cart-outline" size={64} color="#333333" />
        <Text style={styles.emptyTitle}>Carrinho vazio</Text>
        <Text style={styles.emptyText}>Adicione produtos ao seu carrinho</Text>
        <Pressable style={styles.browseButton} onPress={() => router.push('/')}>
          <Text style={styles.browseButtonText}>Explorar Produtos</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: getImageUrl(item.imagem, 150) }} 
        style={styles.cardImage}
        resizeMode="cover"
      />
      
      <View style={styles.cardInfo}>
        <View>
          <Text style={styles.cardNome} numberOfLines={2}>{item.nome}</Text>
          <Text style={styles.cardTamanho}>Tam: {item.tamanho}</Text>
        </View>
        
        <View style={styles.cardBottom}>
          <View style={styles.qtdContainer}>
            <Pressable style={styles.qtdButton} onPress={() => alterarQuantidade(item.key, item.quantidade - 1)}>
              <Ionicons name="remove" size={14} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.qtdText}>{item.quantidade}</Text>
            <Pressable style={styles.qtdButton} onPress={() => alterarQuantidade(item.key, item.quantidade + 1)}>
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.cardPreco}>R$ {(item.preco * item.quantidade).toFixed(2)}</Text>
        </View>
      </View>

      <Pressable style={styles.removeButton} onPress={() => removerItem(item.key)}>
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Carrinho</Text>
        <Text style={styles.headerCount}>{carrinho.length} itens</Text>
      </View>

      <FlatList
        data={carrinho}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer fixo */}
      <View style={styles.footer}>
        <View style={styles.valuesContainer}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Subtotal</Text>
            <Text style={styles.valueAmount}>R$ {subtotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Frete</Text>
            <Text style={styles.valueFree}>Grátis</Text>
          </View>

          {cupomAplicado && (
            <View style={styles.valueRow}>
              <View style={styles.cupomAppliedRow}>
                <Text style={styles.valueLabel}>Cupom ({cupomAplicado.code})</Text>
                <Pressable onPress={removerCupom}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                </Pressable>
              </View>
              <Text style={styles.valueDiscount}>- R$ {valorDesconto.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Aba de Cupom */}
        <View style={styles.cupomContainer}>
          <TextInput
            style={styles.cupomInput}
            placeholder="Código do cupom"
            placeholderTextColor="#666666"
            value={cupomInput}
            onChangeText={(text) => {
              setCupomInput(text);
              setCupomError('');
            }}
            autoCapitalize="characters"
            editable={!cupomAplicado}
          />
          <Pressable 
            style={[styles.cupomButton, cupomAplicado && styles.cupomButtonDisabled]} 
            onPress={aplicarCupom}
            disabled={cupomAplicado !== null}
          >
            <Text style={styles.cupomButtonText}>Aplicar</Text>
          </Pressable>
        </View>
        {cupomError ? <Text style={styles.cupomErrorText}>{cupomError}</Text> : null}

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>R$ {total.toFixed(2)}</Text>
        </View>

        <Pressable style={styles.checkoutButton} onPress={finalizarWhatsApp}>
          <Text style={styles.checkoutText}>Finalizar Pedido</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
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
  cartList: {
    paddingHorizontal: 20,
    paddingBottom: 400,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    gap: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#252525',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80,
  },
  cardNome: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTamanho: {
    color: '#1A5FA0',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  qtdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 2,
  },
  qtdButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  cardPreco: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#333333',
  },
  valuesContainer: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    color: '#808080',
    fontSize: 14,
  },
  valueAmount: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  valueFree: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  valueDiscount: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cupomAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cupomContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  cupomInput: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cupomButton: {
    backgroundColor: '#1A5FA0',
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cupomButtonDisabled: {
    backgroundColor: '#333333',
  },
  cupomButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cupomErrorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValor: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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