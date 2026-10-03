import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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
      <Link href="/perfil" asChild>
        <TouchableOpacity>
          <Text style={styles.headerLink}>Perfil</Text>
        </TouchableOpacity>
      </Link>
    </View>
  </View>
);

export default function AgendamentoScreen() {
  const { tipo, servicoId } = useLocalSearchParams();
  const router = useRouter();
  const [servico, setServico] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [profNome, setProfNome] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const isWeb = Platform.OS === 'web';
  const storageKey = useMemo(() => 'markaqui_agendamentos', []);
  const valid = useMemo(() => servico.trim() && data.trim() && hora.trim(), [servico, data, hora]);
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
            setClienteNome(perfil.name);
          }
        }
      }
    } catch {}
  }, [isWeb]);
  useEffect(() => {
    try {
      if (isWeb && typeof localStorage !== 'undefined' && servicoId) {
        const raw = localStorage.getItem('markaqui_servicos');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((s) => s.id === servicoId);
            if (found) {
              setServico(found.servico);
              if (!data) setData(found.data || '');
              if (!hora) setHora(found.hora || '');
              setObservacoes(`${found.profissional} • ${found.contato}${found.preco ? ' • R$ ' + found.preco : ''}`);
              setProfNome(found.profissional || '');
            }
          }
        }
      }
    } catch {}
  }, [isWeb, servicoId, data, hora]);
  const persist = (next) => {
    setItems(next);
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch {}
  };
  const addItem = () => {
    if (!valid) return;
    const next = [
      ...items,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        tipo: tipo || 'cliente',
        cliente: tipo === 'cliente' ? clienteNome || '' : undefined,
        servico,
        data,
        hora,
        observacoes,
      },
    ];
    persist(next);
    setServico('');
    setData('');
    setHora('');
    setObservacoes('');
    if (tipo === 'cliente' && servicoId) {
      setStatus('Serviço contratado com sucesso');
      router.replace('/agendamento?tipo=cliente');
    } else {
      setStatus('Agendamento salvo');
    }
  };
  const displayItems = useMemo(() => {
    if (tipo === 'cliente') {
      return items.filter((x) => x.tipo === 'cliente' && x.cliente === clienteNome);
    }
    return items;
  }, [items, tipo, clienteNome]);
  const removeItem = (id) => {
    const next = items.filter((x) => x.id !== id);
    persist(next);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />
        {status ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>Agendamento de Serviços</Text>
        <Text style={styles.subtitle}>
          {tipo === 'profissional' ? 'Cadastre seus horários disponíveis' : 'Escolha um serviço e horário'}
        </Text>

        {tipo === 'cliente' && servicoId ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{servico}</Text>
            <Text style={styles.summaryLine}>Profissional: {profNome}</Text>
            <Text style={styles.summaryLine}>Cliente: {clienteNome || '—'}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {!(tipo === 'cliente' && servicoId) ? (
            <TextInput style={styles.input} placeholder="Serviço" value={servico} onChangeText={setServico} />
          ) : null}
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.half]} placeholder="Data" value={data} onChangeText={setData} />
            <TextInput style={[styles.input, styles.half]} placeholder="Hora" value={hora} onChangeText={setHora} />
          </View>
          {!(tipo === 'cliente' && servicoId) ? (
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Observações"
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
            />
          ) : null}
          <TouchableOpacity style={[styles.saveBtn, !valid && styles.saveDisabled]} onPress={addItem} disabled={!valid}>
            <Text style={styles.saveText}>{tipo === 'cliente' && servicoId ? 'Contratar serviço' : 'Salvar agendamento'}</Text>
          </TouchableOpacity>
        </View>

        {!(tipo === 'cliente' && servicoId) ? (
          <View style={styles.list}>
            <Text style={styles.subHeader}>{tipo === 'cliente' ? 'Meus agendamentos' : 'Agendamentos'}</Text>
            {displayItems.length === 0 ? (
              <Text style={styles.empty}>{tipo === 'cliente' ? 'Nenhum agendamento deste cliente' : 'Nenhum agendamento cadastrado'}</Text>
            ) : (
              displayItems.map((it) => (
                <View key={it.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{it.servico}</Text>
                  <Text style={styles.cardLine}>Data: {it.data}</Text>
                  <Text style={styles.cardLine}>Hora: {it.hora}</Text>
                  <Text style={styles.cardLine}>Perfil: {it.tipo}</Text>
                  {it.cliente ? <Text style={styles.cardLine}>Cliente: {it.cliente}</Text> : null}
                  {it.observacoes ? <Text style={styles.cardLine}>Obs: {it.observacoes}</Text> : null}
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(it.id)}>
                    <Text style={styles.removeText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}
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
  title: { fontSize: 26, fontWeight: 'bold', color: '#0D2136', marginTop: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', marginTop: 6, marginBottom: 16, textAlign: 'center' },
  summaryBox: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#0D2136', marginBottom: 6 },
  summaryLine: { fontSize: 14, color: '#0f172a' },
  form: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#cbd5e1' },
  input: { width: '100%', backgroundColor: '#f7fbfd', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  textarea: { minHeight: 80 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  saveBtn: { backgroundColor: '#1e3a56', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  list: { width: '90%', marginTop: 16 },
  subHeader: { fontSize: 16, fontWeight: '700', color: '#0D2136', marginBottom: 6 },
  empty: { color: '#475569', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0D2136', marginBottom: 4 },
  cardLine: { fontSize: 14, color: '#0f172a' },
  removeBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  removeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statusBox: { width: '90%', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  statusText: { color: '#0f172a', fontSize: 14 },
});