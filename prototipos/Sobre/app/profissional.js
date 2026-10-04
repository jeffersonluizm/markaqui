import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';

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
      <Link href="/cliente" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Cliente</Text>
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

export default function ProfissionalScreen() {
  const [nomeServico, setNomeServico] = useState('');
  const [nomeProfissional, setNomeProfissional] = useState('');
  const [contato, setContato] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const isWeb = Platform.OS === 'web';
  const storageKey = useMemo(() => 'markaqui_servicos', []);
  const valid = useMemo(() => nomeServico.trim() && nomeProfissional.trim() && contato.trim() && preco.trim() && descricao.trim() && data.trim() && hora.trim(), [nomeServico, nomeProfissional, contato, preco, descricao, data, hora]);
  useEffect(() => {
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
        }
      }
    } catch {}
  }, [isWeb, storageKey]);
  useEffect(() => {
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        const rawPerfil = localStorage.getItem('markaqui_perfil');
        if (rawPerfil) {
          const perfil = JSON.parse(rawPerfil);
          if (perfil && typeof perfil === 'object' && perfil.name) {
            setNomeProfissional(perfil.name);
          }
        }
      }
    } catch {}
  }, [isWeb]);
  
  const persist = (next) => {
    setItems(next);
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch {}
  };
  const onChangeContato = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    setContato(digits);
  };
  const onChangePreco = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    setPreco(digits);
  };
  const salvar = () => {
    if (!valid) { setStatus('Preencha todos os campos'); return; }
    const novo = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      servico: nomeServico,
      profissional: nomeProfissional,
      contato,
      preco,
      descricao,
      data,
      hora,
    };
    const next = [...items, novo];
    persist(next);
    setStatus('Serviço criado');
    setNomeServico('');
    setNomeProfissional('');
    setContato('');
    setPreco('');
    setDescricao('');
    setData('');
    setHora('');
  };
  const remover = (id) => {
    const next = items.filter((x) => x.id !== id);
    persist(next);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        <Text style={styles.title}>Cadastrar Serviço</Text>
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Nome do serviço" value={nomeServico} onChangeText={setNomeServico} />
          <TextInput style={styles.input} placeholder="Nome do profissional" value={nomeProfissional} onChangeText={setNomeProfissional} />
          <TextInput style={styles.input} placeholder="Contato (somente números)" value={contato} onChangeText={onChangeContato} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Preço (somente números)" value={preco} onChangeText={onChangePreco} keyboardType="numeric" />
          <TextInput style={[styles.input, styles.textarea]} placeholder="Descrição" value={descricao} onChangeText={setDescricao} multiline />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.half]} placeholder="Data (YYYY-MM-DD)" value={data} onChangeText={setData} />
            <TextInput style={[styles.input, styles.half]} placeholder="Hora (HH:MM)" value={hora} onChangeText={setHora} />
          </View>
          <TouchableOpacity style={[styles.saveBtn, !valid && styles.saveDisabled]} onPress={salvar} disabled={!valid}>
            <Text style={styles.saveText}>Salvar serviço</Text>
          </TouchableOpacity>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>

        <View style={styles.list}>
          <Text style={styles.subTitle}>Meus serviços</Text>
          {items.length === 0 ? (
            <Text style={styles.empty}>Nenhum serviço cadastrado</Text>
          ) : (
            items.map((it) => (
              <View key={it.id} style={styles.card}>
                <Text style={styles.cardTitle}>{it.servico}</Text>
                <Text style={styles.cardLine}>Profissional: {it.profissional}</Text>
                <Text style={styles.cardLine}>Contato: {it.contato}</Text>
                <Text style={styles.cardLine}>Data: {it.data} • Hora: {it.hora}</Text>
                <Text style={styles.cardLine}>Descrição: {it.descricao}</Text>
                <TouchableOpacity style={styles.removeBtn} onPress={() => remover(it.id)}>
                  <Text style={styles.removeText}>Excluir</Text>
                </TouchableOpacity>
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
  subTitle: { width: '90%', fontSize: 18, fontWeight: '700', color: '#0D2136', marginBottom: 8 },
  form: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#cbd5e1' },
  input: { width: '100%', backgroundColor: '#f7fbfd', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  textarea: { minHeight: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  saveBtn: { backgroundColor: '#1e3a56', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  status: { marginTop: 8, color: '#0f172a' },
  list: { width: '90%', marginTop: 16 },
  empty: { color: '#475569', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D2136', marginBottom: 4 },
  cardLine: { fontSize: 14, color: '#0f172a' },
  removeBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  removeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
});