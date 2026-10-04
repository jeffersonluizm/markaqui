import React, { useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AppHeader = () => (
  <View style={styles.header}>
    <View style={styles.spacer} />
    <View style={styles.brandCenter}>
      <Text style={styles.headerBrand}>Markaqui</Text>
    </View>
    <View style={styles.headerNav}>
      <Link href="/home" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Início</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/sobre" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Sobre</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/perfil" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Perfil</Text>
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

export default function InicioScreen() {
  const [tipo, setTipo] = useState(null);
  const podeContinuar = !!tipo;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <AppHeader />
        <Text style={styles.title}>Como você quer usar o Markaqui?</Text>
        <Text style={styles.subtitle}>Escolha seu perfil para começar a agendar ou oferecer serviços</Text>

        <TouchableOpacity
          style={[styles.card, tipo === 'cliente' && styles.cardActive]}
          onPress={() => setTipo('cliente')}
        >
          <Text style={styles.cardTitle}>Sou Cliente</Text>
          <Text style={styles.cardText}>Quero agendar serviços</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, tipo === 'profissional' && styles.cardActive]}
          onPress={() => setTipo('profissional')}
        >
          <Text style={styles.cardTitle}>Sou Profissional</Text>
          <Text style={styles.cardText}>Quero oferecer serviços</Text>
        </TouchableOpacity>

        {podeContinuar ? (
          <Link href={tipo === 'profissional' ? '/profissional' : '/cliente'} asChild>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Continuar</Text>
            </TouchableOpacity>
          </Link>
        ) : (
          <TouchableOpacity style={[styles.ctaButton, styles.ctaDisabled]} disabled>
            <Text style={styles.ctaButtonText}>Continuar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#d8ecf5' },
  container: { flex: 1 },
  content: { alignItems: 'center', paddingBottom: 40 },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  spacer: { flex: 1 },
  brandCenter: { flex: 1, alignItems: 'center' },
  headerBrand: { fontSize: 22, fontWeight: 'bold', color: '#0D2136' },
  headerNav: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  headerLink: { fontSize: 16, color: '#0D2136', marginLeft: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0D2136', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', marginTop: 6, marginBottom: 20, textAlign: 'center' },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#1e3a56',
    marginBottom: 16,
  },
  cardActive: { borderColor: '#0D2136', backgroundColor: '#eef6fb' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0D2136', marginBottom: 4 },
  cardText: { fontSize: 14, color: '#333' },
  ctaButton: {
    backgroundColor: '#1e3a56',
    borderRadius: 30,
    paddingVertical: 12,
    width: '90%',
    alignItems: 'center',
    marginTop: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});