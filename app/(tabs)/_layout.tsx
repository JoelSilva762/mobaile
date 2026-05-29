import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1A5FA0',
        tabBarInactiveTintColor: '#808080',
        tabBarShowLabel: false,
        headerShown: false,
        // MUDANÇA CHAVE AQUI: Centraliza o ícone nativamente sem precisar de View em volta
        tabBarIconStyle: styles.tabBarIconStyle, 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeIconCircle]}>
              <Ionicons name="home" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeIconCircle]}>
              <Ionicons name="heart" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeIconCircle]}>
              <Ionicons name="cart" size={24} color={color} />
              
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconCircle, focused && styles.activeIconCircle]}>
              <Ionicons name="person" size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute', // Faz a barra flutuar sobre o conteúdo (sumiu o fundo preto!)
    backgroundColor: 'rgba(26, 26, 26, 0.94)', // Transparência estilo vidro fosco
    borderTopWidth: 0,
    
    // Margens para deixar a barra arredondada flutuante
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 24 : 16, 
    
    // Arredondamento completo
    borderRadius: 25,
    
    // Sombras fortes para destacar a barra do fundo transparente
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    
    height: 65,
    paddingBottom: 0,
    paddingTop: 0,
  },
  
  // Alinha o contêiner do ícone perfeitamente no meio da barra
  tabBarIconStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Empurra o ícone exatamente pro centro vertical da barra de 65px
  },

  // A "bolha" atrás do ícone
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  activeIconCircle: {
    backgroundColor: 'rgba(26, 95, 160, 0.15)', // Bolha azul ao clicar
  },
  
  badge: {
    position: 'absolute',
    top: 2,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1A1A1A', // Borda para se misturar com o fundo da tab
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});