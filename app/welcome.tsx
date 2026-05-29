import { View, Text, Pressable, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const IMAGENS = [
  require('../assets/in1.png'),
  require('../assets/in2.png'),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [indiceAtual, setIndiceAtual] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Auto-play do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setIndiceAtual((prev) => {
        const next = (prev + 1) % IMAGENS.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const mudarImagem = (direcao: 'esq' | 'dir') => {
    const next = direcao === 'dir'
      ? (indiceAtual + 1) % IMAGENS.length
      : (indiceAtual - 1 + IMAGENS.length) % IMAGENS.length;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setIndiceAtual(next);
  };

  return (
    <View style={styles.container}>
      {/* Admin discreto no canto superior direito */}
      <Pressable style={styles.adminButton} onPress={() => router.push('/admin')}>
        <Ionicons name="settings-outline" size={22} color="#808080" />
      </Pressable>

      {/* Área da imagem com carrossel */}
      <View style={styles.imagemArea}>
        <Animated.FlatList
          ref={flatListRef}
          data={IMAGENS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndiceAtual(index);
          }}
          renderItem={({ item }) => (
            <Image source={item} style={styles.imagem} resizeMode="cover" />
          )}
          keyExtractor={(_, index) => index.toString()}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          scrollEnabled={true}
        />

        {/* Fade gradient na parte inferior da imagem */}
        <LinearGradient
          colors={['transparent', '#0D0D0D']}
          style={styles.fadeOverlay}
        />

      

        {/* Indicadores de página */}
     
      </View>

      {/* Conteúdo inferior */}
      <View style={styles.conteudoInferior}>
        {/* Logo e texto */}
        <View style={styles.logoContainer}>
        
          <Text style={styles.title}>KaSports</Text>
          <Text style={styles.subtitle}>Uniformes de Futebol Premium</Text>
        </View>

        {/* Botões */}
        <View style={styles.botoesContainer}>
          <Pressable
            style={styles.botaoPrimario}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.botaoPrimarioTexto}>Entrar</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={styles.botaoSecundario}
            onPress={() => router.push('/cadastro')}
          >
            <Text style={styles.botaoSecundarioTexto}>Criar Conta</Text>
          </Pressable>

          <Pressable
            style={styles.botaoConvidado}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.botaoConvidadoTexto}>Continuar como convidado</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  // Admin discreto
  adminButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Área da imagem (62% da tela)
  imagemArea: {
    height: height * 0.62,
    width: '100%',
    position: 'relative',
  },
  imagem: {
    width: width,
    height: '100%',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },

  // Setas de navegação do carrossel
  navSeta: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  navSetaEsq: {
    left: 12,
  },
  navSetaDir: {
    right: 12,
  },

  // Indicadores do carrossel
  indicadores: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    zIndex: 5,
  },
  indicador: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  indicadorAtivo: {
    width: 28,
    backgroundColor: '#1A5FA0',
  },

  // Conteúdo inferior
  conteudoInferior: {
    flex: 1,
    paddingHorizontal: 28,
    
    justifyContent: 'space-between',
    paddingBottom: 30,
  },

  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
   
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 25
  },
  subtitle: {
    fontSize: 14,
    color: '#808080',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  // Botões modernos
  botoesContainer: {
    gap: 12,
  },
  botaoPrimario: {
    backgroundColor: '#1A5FA0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#1A5FA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  botaoPrimarioTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  botaoSecundarioTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  botaoConvidado: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  botaoConvidadoTexto: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
});