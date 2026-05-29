import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, Image, Alert, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ref, onValue, set, remove, get } from 'firebase/database';
import { db } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

type Cupom = {
  id: string;
  desconto: number;
  ativo: boolean;
  usadoPor?: Record<string, boolean>;
};

type Produto = {
  id: string;
  nome: string;
  time: string;
  preco: number;
  ano: string;
  categoria: string;
  descricao: string;
  imagem: string;
  quantidadeDisponivel: {
    P: number;
    M: number;
    G: number;
    GG: number;
  };
};

export default function AdminScreen() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'lista' | 'form' | 'cupons'>('lista');
  const [editando, setEditando] = useState(false);

  // Formulário Produto
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [time, setTime] = useState('');
  const [preco, setPreco] = useState('');
  const [ano, setAno] = useState('');
  const [categoria, setCategoria] = useState('home');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState('');
  const [qtdP, setQtdP] = useState('5');
  const [qtdM, setQtdM] = useState('5');
  const [qtdG, setQtdG] = useState('5');
  const [qtdGG, setQtdGG] = useState('5');

  // Formulário Cupom
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomDesconto, setCupomDesconto] = useState('');
  const [cupomAtivo, setCupomAtivo] = useState(true);

  // Detalhes do cupom selecionado (usuários que usaram)
  const [cupomSelecionado, setCupomSelecionado] = useState<Cupom | null>(null);
  const [modalUsuarios, setModalUsuarios] = useState(false);

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
      } else {
        setProdutos([]);
      }
    });

    const cuponsRef = ref(db, 'cupons');
    const unsubscribeCupons = onValue(cuponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.keys(data).map((key) => ({
          id: key,
          desconto: data[key].desconto || 0,
          ativo: data[key].ativo ?? true,
          usadoPor: data[key].usadoPor || {},
        }));
        setCupons(lista);
      } else {
        setCupons([]);
      }
    });

    return () => {
      unsubscribeProdutos();
      unsubscribeCupons();
    };
  }, []);

  // ─── PRODUTOS ─────────────────────────────────────────────

  function limparFormProduto() {
    setId('');
    setNome('');
    setTime('');
    setPreco('');
    setAno('');
    setCategoria('home');
    setDescricao('');
    setImagem('');
    setQtdP('5');
    setQtdM('5');
    setQtdG('5');
    setQtdGG('5');
    setEditando(false);
  }

  function preencherForm(produto: Produto) {
    setId(produto.id);
    setNome(produto.nome || '');
    setTime(produto.time || '');
    setPreco(produto.preco ? produto.preco.toString() : '');
    setAno(produto.ano || '');
    setCategoria(produto.categoria || 'home');
    setDescricao(produto.descricao || '');
    setImagem(produto.imagem || '');
    setQtdP(produto.quantidadeDisponivel?.P?.toString() || '5');
    setQtdM(produto.quantidadeDisponivel?.M?.toString() || '5');
    setQtdG(produto.quantidadeDisponivel?.G?.toString() || '5');
    setQtdGG(produto.quantidadeDisponivel?.GG?.toString() || '5');
    setEditando(true);
  }

  async function salvarProduto() {
    if (!id || !nome || !preco) {
      Alert.alert('Preencha ID, nome e preço');
      return;
    }

    await set(ref(db, `produtos/${id}`), {
      id,
      nome,
      time,
      preco: parseFloat(preco),
      ano,
      categoria,
      descricao,
      imagem,
      quantidadeDisponivel: {
        P: parseInt(qtdP) || 0,
        M: parseInt(qtdM) || 0,
        G: parseInt(qtdG) || 0,
        GG: parseInt(qtdGG) || 0,
      }
    });

    Alert.alert('Sucesso', editando ? 'Produto atualizado!' : 'Produto criado!');
    limparFormProduto();
    setAbaAtiva('lista');
  }

  async function excluirProduto(produtoId: string) {
    Alert.alert('Confirmar', 'Excluir este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await remove(ref(db, `produtos/${produtoId}`));
        }
      }
    ]);
  }

  function editarProduto(produto: Produto) {
    preencherForm(produto);
    setAbaAtiva('form');
  }

  function novoProduto() {
    limparFormProduto();
    setAbaAtiva('form');
  }

  // ─── CUPONS ──────────────────────────────────────────────

  function limparFormCupom() {
    setCupomCodigo('');
    setCupomDesconto('');
    setCupomAtivo(true);
  }

  async function salvarCupom() {
    const codigo = cupomCodigo.trim().toUpperCase();
    const desconto = parseInt(cupomDesconto);

    if (!codigo || isNaN(desconto) || desconto <= 0 || desconto > 100) {
      Alert.alert('Erro', 'Preencha código e desconto válido (1-100%)');
      return;
    }

    await set(ref(db, `cupons/${codigo}`), {
      desconto,
      ativo: cupomAtivo,
      usadoPor: {} // inicia vazio
    });

    Alert.alert('Sucesso', `Cupom ${codigo} criado!`);
    limparFormCupom();
  }

  async function excluirCupom(codigo: string) {
    Alert.alert('Confirmar', `Excluir cupom ${codigo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await remove(ref(db, `cupons/${codigo}`));
        }
      }
    ]);
  }

  async function toggleCupomAtivo(codigo: string, atual: boolean) {
    await set(ref(db, `cupons/${codigo}/ativo`), !atual);
  }

  function verUsuariosQueUsaram(cupom: Cupom) {
    setCupomSelecionado(cupom);
    setModalUsuarios(true);
  }

  // ─── RENDER ──────────────────────────────────────────────

  const renderProduto = ({ item }: { item: Produto }) => (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {item.imagem ? (
          <Image source={{ uri: item.imagem }} style={styles.image} />
        ) : (
          <Ionicons name="shirt-outline" size={40} color="#333333" />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.preco}>R$ {item.preco?.toFixed(2)}</Text>
        <Text style={styles.estoque}>
          P:{item.quantidadeDisponivel?.P || 0} M:{item.quantidadeDisponivel?.M || 0} G:{item.quantidadeDisponivel?.G || 0} GG:{item.quantidadeDisponivel?.GG || 0}
        </Text>
      </View>

      <View style={styles.acoes}>
        <Pressable style={styles.btnEditar} onPress={() => editarProduto(item)}>
          <Ionicons name="create-outline" size={20} color="#1A5FA0" />
        </Pressable>
        <Pressable style={styles.btnExcluir} onPress={() => excluirProduto(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );

  const renderCupom = ({ item }: { item: Cupom }) => {
    const usuariosUsaram = item.usadoPor ? Object.keys(item.usadoPor) : [];
    const qtdUsos = usuariosUsaram.length;

    return (
      <View style={styles.cupomCard}>
        <View style={styles.cupomHeader}>
          <View>
            <Text style={styles.cupomCodigo}>{item.id}</Text>
            <Text style={styles.cupomDesconto}>{item.desconto}% OFF</Text>
          </View>
          <View style={styles.cupomStatus}>
            <View style={[styles.statusDot, { backgroundColor: item.ativo ? '#22C55E' : '#EF4444' }]} />
            <Text style={styles.statusText}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
          </View>
        </View>

        <View style={styles.cupomInfo}>
          <Text style={styles.cupomUsos}>👤 {qtdUsos} usuário(s) já usaram</Text>
        </View>

        <View style={styles.cupomAcoes}>
          <Pressable
            style={[styles.cupomBtn, { backgroundColor: item.ativo ? '#EF4444' : '#22C55E' }]}
            onPress={() => toggleCupomAtivo(item.id, item.ativo)}
          >
            <Text style={styles.cupomBtnText}>{item.ativo ? 'Desativar' : 'Ativar'}</Text>
          </Pressable>

          <Pressable
            style={[styles.cupomBtn, { backgroundColor: '#1A5FA0' }]}
            onPress={() => verUsuariosQueUsaram(item)}
          >
            <Text style={styles.cupomBtnText}>Ver Usuários</Text>
          </Pressable>

          <Pressable
            style={[styles.cupomBtn, { backgroundColor: '#333' }]}
            onPress={() => excluirCupom(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  };

  // ─── TELA DE CUPONS ──────────────────────────────────────

  if (abaAtiva === 'cupons') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => { setAbaAtiva('lista'); limparFormCupom(); }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Cupons</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form novo cupom */}
        <View style={styles.cupomForm}>
          <Text style={styles.label}>Código do Cupom</Text>
          <TextInput
            style={styles.input}
            value={cupomCodigo}
            onChangeText={setCupomCodigo}
            placeholder="MOBILE20"
            placeholderTextColor="#666"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Desconto (%)</Text>
          <TextInput
            style={styles.input}
            value={cupomDesconto}
            onChangeText={setCupomDesconto}
            placeholder="20"
            placeholderTextColor="#666"
            keyboardType="number-pad"
          />

          <View style={styles.cupomToggleRow}>
            <Text style={styles.cupomToggleLabel}>Ativo</Text>
            <Pressable
              style={[styles.toggle, cupomAtivo && styles.toggleAtivo]}
              onPress={() => setCupomAtivo(!cupomAtivo)}
            >
              <View style={[styles.toggleCircle, cupomAtivo && styles.toggleCircleAtivo]} />
            </Pressable>
          </View>

          <Pressable style={styles.salvarCupomBtn} onPress={salvarCupom}>
            <Text style={styles.salvarText}>Criar Cupom</Text>
          </Pressable>
        </View>

        {/* Lista de cupons */}
        <FlatList
          data={cupons}
          renderItem={renderCupom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum cupom cadastrado</Text>
          }
        />

        {/* Modal usuários que usaram */}
        {modalUsuarios && cupomSelecionado && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Usuários - {cupomSelecionado.id}</Text>
                <Pressable onPress={() => setModalUsuarios(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </Pressable>
              </View>

              {cupomSelecionado.usadoPor && Object.keys(cupomSelecionado.usadoPor).length > 0 ? (
                <FlatList
                  data={Object.keys(cupomSelecionado.usadoPor)}
                  renderItem={({ item }) => (
                    <View style={styles.usuarioItem}>
                      <Ionicons name="person-circle" size={20} color="#1A5FA0" />
                      <Text style={styles.usuarioId}>{item}</Text>
                    </View>
                  )}
                  keyExtractor={(item) => item}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.emptyText}>Nenhum usuário utilizou este cupom</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  // ─── TELA DE FORM PRODUTO ────────────────────────────────

  if (abaAtiva === 'form') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => { limparFormProduto(); setAbaAtiva('lista'); }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{editando ? 'Editar' : 'Novo'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
          <Text style={styles.label}>ID</Text>
          <TextInput style={styles.input} value={id} onChangeText={setId} placeholder="011" placeholderTextColor="#666" editable={!editando} />

          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Barcelona Home" placeholderTextColor="#666" />

          <Text style={styles.label}>Time</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="Barcelona" placeholderTextColor="#666" />

          <Text style={styles.label}>Preço</Text>
          <TextInput style={styles.input} value={preco} onChangeText={setPreco} placeholder="349.99" placeholderTextColor="#666" keyboardType="decimal-pad" />

          <Text style={styles.label}>Ano</Text>
          <TextInput style={styles.input} value={ano} onChangeText={setAno} placeholder="2024/25" placeholderTextColor="#666" />

          <Text style={styles.label}>Categoria</Text>
          <View style={styles.cats}>
            {['home', 'away', 'third'].map((cat) => (
              <Pressable key={cat} style={[styles.cat, categoria === cat && styles.catAtiva]} onPress={() => setCategoria(cat)}>
                <Text style={[styles.catText, categoria === cat && styles.catTextAtiva]}>{cat.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>URL Imagem</Text>
          <TextInput style={[styles.input, { fontSize: 12 }]} value={imagem} onChangeText={setImagem} placeholder="https://..." placeholderTextColor="#666" />
          {imagem ? <Image source={{ uri: imagem }} style={styles.preview} /> : null}

          <Text style={styles.label}>Descrição</Text>
          <TextInput style={[styles.input, { height: 80 }]} value={descricao} onChangeText={setDescricao} placeholder="Descrição..." placeholderTextColor="#666" multiline />

          <Text style={styles.label}>Estoque</Text>
          <View style={styles.estoqueRow}>
            {[
              { label: 'P', value: qtdP, set: setQtdP },
              { label: 'M', value: qtdM, set: setQtdM },
              { label: 'G', value: qtdG, set: setQtdG },
              { label: 'GG', value: qtdGG, set: setQtdGG },
            ].map((item) => (
              <View key={item.label} style={styles.estoqueItem}>
                <Text style={styles.estoqueLabel}>{item.label}</Text>
                <TextInput style={styles.estoqueInput} value={item.value} onChangeText={item.set} keyboardType="number-pad" />
              </View>
            ))}
          </View>

          <Pressable style={styles.salvar} onPress={salvarProduto}>
            <Text style={styles.salvarText}>Salvar</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ─── TELA LISTA PRODUTOS ─────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Admin</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable style={[styles.novoBtn, { backgroundColor: '#7C3AED' }]} onPress={() => setAbaAtiva('cupons')}>
            <Ionicons name="ticket-outline" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.novoBtn} onPress={novoProduto}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={produtos}
        renderItem={renderProduto}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  novoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A5FA0',
    alignItems: 'center',
    justifyContent: 'center',
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
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  nome: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    color: '#808080',
    fontSize: 12,
    marginTop: 2,
  },
  preco: {
    color: '#1A5FA0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  estoque: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },
  acoes: {
    gap: 8,
  },
  btnEditar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 95, 160, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnExcluir: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#808080',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  cats: {
    flexDirection: 'row',
    gap: 8,
  },
  cat: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  catAtiva: {
    backgroundColor: '#1A5FA0',
    borderColor: '#1A5FA0',
  },
  catText: {
    color: '#808080',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catTextAtiva: {
    color: '#FFFFFF',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  estoqueRow: {
    flexDirection: 'row',
    gap: 12,
  },
  estoqueItem: {
    flex: 1,
    alignItems: 'center',
  },
  estoqueLabel: {
    color: '#808080',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  estoqueInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  salvar: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  salvarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ─── ESTILOS CUPOM ──────────────────────────────────────
  cupomForm: {
    padding: 20,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cupomToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cupomToggleLabel: {
    color: '#808080',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    padding: 2,
  },
  toggleAtivo: {
    backgroundColor: '#22C55E',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    transform: [{ translateX: 0 }],
  },
  toggleCircleAtivo: {
    transform: [{ translateX: 22 }],
  },
  salvarCupomBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  cupomCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cupomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cupomCodigo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cupomDesconto: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cupomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#808080',
    fontSize: 12,
  },
  cupomInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cupomUsos: {
    color: '#808080',
    fontSize: 13,
  },
  cupomAcoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cupomBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },

  // ─── MODAL ──────────────────────────────────────────────
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usuarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  usuarioId: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
  },
});