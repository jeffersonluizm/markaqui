import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Header = () => (
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

export default function ClienteScreen() {
  const [servicos, setServicos] = useState([]);
  const storageKey = useMemo(() => 'markaqui_servicos', []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setServicos(parsed);
      }
    } catch {}
  }, [storageKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        <Text style={styles.title}>Serviços disponíveis</Text>
        <View style={styles.list}>
          {servicos.length === 0 ? (
            <Text style={styles.empty}>Nenhum serviço disponível</Text>
          ) : (
            servicos.map((it) => (
              <View key={it.id} style={styles.card}>
                <Text style={styles.cardTitle}>{it.servico}</Text>
                <Text style={styles.cardLine}>Profissional: {it.profissional}</Text>
                <Text style={styles.cardLine}>Contato: {it.contato}</Text>
                {it.preco ? <Text style={styles.cardLine}>Preço: R$ {it.preco}</Text> : null}
                <Text style={styles.cardLine}>Data: {it.data} • Hora: {it.hora}</Text>
                <Text style={styles.cardLine}>Descrição: {it.descricao}</Text>
                <Link href={`/agendamento?tipo=cliente&servicoId=${it.id}`} asChild>
                  <TouchableOpacity style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>Contratar</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#d8ecf5' },
  content: { alignItems: 'center', paddingBottom: 40 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  spacer: { flex: 1 },
  brandCenter: { flex: 1, alignItems: 'center' },
  headerBrand: { fontSize: 22, fontWeight: 'bold', color: '#0D2136' },
  headerNav: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  headerLink: { fontSize: 16, color: '#0D2136', marginLeft: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0D2136', marginTop: 10, marginBottom: 8, textAlign: 'center' },
  list: { width: '90%', marginTop: 8 },
  empty: { color: '#475569', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D2136', marginBottom: 4 },
  cardLine: { fontSize: 14, color: '#0f172a' },
  ctaBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#1e3a56', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});