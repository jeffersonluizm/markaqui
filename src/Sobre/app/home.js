import { Link } from 'expo-router';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AppHeader = () => (
  <View style={styles.navbar}>
    <View style={styles.spacer} />
    <View style={styles.brandContainer}>
      <Text style={styles.logoText}>Markaqui</Text>
    </View>
    <View style={styles.menu}>
      <Text style={[styles.menuItem, styles.active]}>Início</Text>
      <Link href="/sobre" asChild>
        <TouchableOpacity>
          <Text style={styles.menuItem}>Sobre</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/perfil" asChild>
        <TouchableOpacity>
          <Text style={styles.menuItem}>Perfil</Text>
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.main}>
        <AppHeader />
        <Text style={styles.title}>Simplifique o Agendamento de Serviços</Text>
        <Text style={styles.subtitle}>
          Agende facilmente compromissos{"\n"}
          com profissionais e serviços
        </Text>
        <View style={styles.illustrationContainer}>
          <Image
            source={{ uri: 'https://i.imgur.com/vVSHkO9.png' }}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
        <Link href="/inicio" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Comece agora</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d8ecf5',
  },
  navbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  spacer: { flex: 1 },
  brandContainer: { flex: 1, alignItems: 'center' },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  menu: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 24,
  },
  active: {
    textDecorationLine: 'underline',
  },
  main: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a56',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: 280,
  },
  button: {
    backgroundColor: '#1e3a56',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 50,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});