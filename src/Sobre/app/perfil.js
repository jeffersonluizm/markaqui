import React, { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";

const AppHeader = () => (
  <View style={styles.navbar}>
    <View style={styles.spacer} />
    <View style={styles.brandContainer}>
      <Text style={styles.logoText}>Markaqui</Text>
    </View>
    <View style={styles.menu}>
      <Link href="/home" asChild>
        <TouchableOpacity>
          <Text style={styles.menuItem}>Início</Text>
        </TouchableOpacity>
      </Link>
      <Link href="/sobre" asChild>
        <TouchableOpacity>
          <Text style={styles.menuItem}>Sobre</Text>
        </TouchableOpacity>
      </Link>
      <Text style={[styles.menuItem, styles.active]}>Perfil</Text>
    </View>
  </View>
);

const UserIcon = () => (
  <View style={styles.userIconContainer}>
    <View style={styles.userIconHead} />
    <View style={styles.userIconBody} />
  </View>
);

export default function PerfilScreen() {
  const [accountType, setAccountType] = useState("Cliente");
  const [notifications, setNotifications] = useState("Ativadas");
  const [name, setName] = useState("");
  const [cityState, setCityState] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const storageKey = useMemo(() => "markaqui_perfil", []);
  const isWeb = Platform.OS === "web";
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      cityState.trim().length > 0 &&
      phone.trim().length > 0
    );
  }, [name, cityState, phone]);
  useEffect(() => {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const data = JSON.parse(raw);
          if (data && typeof data === "object") {
            setName(data.name || "");
            setCityState(data.cityState || "");
            setPhone(data.phone || "");
            setAccountType(data.accountType || "Cliente");
            setNotifications(data.notifications || "Ativadas");
          }
        }
        const rawAg = localStorage.getItem('markaqui_agendamentos');
        if (rawAg) {
          const parsed = JSON.parse(rawAg);
          if (Array.isArray(parsed)) setAgendamentos(parsed);
        }
        const rawSv = localStorage.getItem('markaqui_servicos');
        if (rawSv) {
          const parsed = JSON.parse(rawSv);
          if (Array.isArray(parsed)) setServicos(parsed);
        }
      }
    } catch {}
  }, [isWeb, storageKey]);
  const meusAgendamentos = useMemo(() => {
    if (!name) return [];
    return agendamentos.filter((x) => x.tipo === 'cliente' && x.cliente === name);
  }, [agendamentos, name]);
  const meusServicos = useMemo(() => {
    if (!name) return [];
    return servicos.filter((x) => x.profissional === name);
  }, [servicos, name]);
  const removeAgendamento = (id) => {
    const next = agendamentos.filter((x) => x.id !== id);
    setAgendamentos(next);
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem('markaqui_agendamentos', JSON.stringify(next));
      }
    } catch {}
  };
  const removeServico = (id) => {
    const next = servicos.filter((x) => x.id !== id);
    setServicos(next);
    try {
      if (isWeb && typeof localStorage !== 'undefined') {
        localStorage.setItem('markaqui_servicos', JSON.stringify(next));
      }
    } catch {}
  };
  const saveProfile = () => {
    if (!isValid) {
      setStatus("Preencha todos os campos");
      return;
    }
    const payload = { name, cityState, phone, accountType, notifications };
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
      setStatus("Alterações salvas");
    } catch {
      setStatus("Falha ao salvar");
    }
  };
  const exitProfile = () => {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    } catch {}
    setName("");
    setCityState("");
    setPhone("");
    setAccountType("Cliente");
    setNotifications("Ativadas");
    setStatus("Sessão encerrada");
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.main}>
        <AppHeader />
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <UserIcon />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileTitle}>Meu Perfil</Text>
            <Text style={styles.profileSubtitle}>
              Gerencie suas informações e{"\n"}preferências de uso do Markaqui
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>
          <TextInput
            placeholder="Nome completo"
            style={styles.input}
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Cidade / Estado"
              style={[styles.input, styles.inputHalf]}
              placeholderTextColor="#555"
              value={cityState}
              onChangeText={setCityState}
            />
            <TextInput
              placeholder="Telefone"
              style={[styles.input, styles.inputHalf]}
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <Text style={styles.label}>Tipo de conta</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={styles.radioOption} onPress={() => setAccountType("Cliente")}>
              <View style={styles.radioButton}>
                {accountType === "Cliente" && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioOption} onPress={() => setAccountType("Profissional")}>
              <View style={styles.radioButton}>
                {accountType === "Profissional" && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>Profissional</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.label, styles.labelSpacing]}>Notificações</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity style={styles.radioOption} onPress={() => setNotifications("Ativadas")}>
              <View style={styles.radioButton}>
                {notifications === "Ativadas" && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>Ativadas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioOption} onPress={() => setNotifications("Desativadas")}>
              <View style={styles.radioButton}>
                {notifications === "Desativadas" && <View style={styles.radioButtonSelected} />}
              </View>
              <Text style={styles.radioLabel}>Desativadas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.button, !isValid && styles.buttonDisabled]} onPress={saveProfile}>
          <Text style={styles.buttonText}>{isValid ? "Salvar alterações" : "Preencha os campos"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton} onPress={exitProfile}>
          <Text style={styles.exitButtonText}>Sair</Text>
        </TouchableOpacity>
        {status ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

        <View style={styles.actionsBox}>
          <Text style={styles.actionsTitle}>O que deseja fazer?</Text>
          {accountType === "Profissional" ? (
            <Link href="/profissional" asChild>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>Oferecer serviços</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <Link href="/cliente" asChild>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>Contratar serviços</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>

        {accountType === 'Cliente' ? (
          <View style={styles.listBox}>
            <Text style={styles.listTitle}>Serviços contratados</Text>
            {meusAgendamentos.length === 0 ? (
              <Text style={styles.empty}>Nenhum serviço contratado</Text>
            ) : (
              meusAgendamentos.map((it) => (
                <View key={it.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{it.servico}</Text>
                  <Text style={styles.cardLine}>Data: {it.data}</Text>
                  <Text style={styles.cardLine}>Hora: {it.hora}</Text>
                  {it.observacoes ? <Text style={styles.cardLine}>Obs: {it.observacoes}</Text> : null}
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeAgendamento(it.id)}>
                    <Text style={styles.removeText}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d8ecf5" },
  navbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#d8ecf5",
  },
  spacer: { flex: 1 },
  brandContainer: { flex: 1, alignItems: "center" },
  logoText: { fontSize: 22, fontWeight: "bold", color: "#000" },
  menu: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  menuItem: { marginLeft: 24, fontSize: 16, fontWeight: "600", color: "#000" },
  active: { textDecorationLine: "underline" },
  scrollView: { flex: 1 },
  main: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 20 },
  profileHeader: { flexDirection: "row", alignItems: "center", marginBottom: 30, width: "90%" },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1e3a56",
    marginRight: 20,
  },
  userIconContainer: { alignItems: "center", justifyContent: "center" },
  userIconHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#1e3a56", marginBottom: 4 },
  userIconBody: { width: 40, height: 26, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#1e3a56" },
  profileInfo: { flex: 1 },
  profileTitle: { fontSize: 24, fontWeight: "bold", color: "#000", marginBottom: 5 },
  profileSubtitle: { fontSize: 13, color: "#555", lineHeight: 18 },
  section: { width: "90%", marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#000", marginBottom: 15 },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#1e3a56",
  },
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  inputHalf: { width: "48%" },
  label: { fontSize: 15, fontWeight: "600", color: "#000", marginBottom: 10, marginTop: 5 },
  labelSpacing: { marginTop: 15 },
  radioGroup: { flexDirection: "row", marginBottom: 10 },
  radioOption: { flexDirection: "row", alignItems: "center", marginRight: 30 },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#1e3a56", justifyContent: "center", alignItems: "center", marginRight: 8 },
  radioButtonSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#1e3a56" },
  radioLabel: { fontSize: 15, color: "#000" },
  button: { backgroundColor: "#1e3a56", borderRadius: 30, paddingVertical: 12, width: "90%", alignItems: "center", marginTop: 20, marginBottom: 15 },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  exitButton: { marginBottom: 30 },
  exitButtonText: { color: "#1e3a56", fontSize: 16, fontWeight: "600" },
  statusBox: { width: "90%", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: "#cbd5e1" },
  statusText: { color: "#0f172a", fontSize: 14 },
  actionsBox: { width: "90%", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: "#cbd5e1", marginTop: 16 },
  actionsTitle: { fontSize: 16, fontWeight: "700", color: "#0D2136", marginBottom: 8 },
  actionBtn: { backgroundColor: "#1e3a56", borderRadius: 30, paddingVertical: 12, alignItems: "center" },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  listBox: { width: "90%", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: "#cbd5e1", marginTop: 16 },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#0D2136", marginBottom: 8 },
  empty: { color: "#475569", fontSize: 14 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0D2136", marginBottom: 4 },
  cardLine: { fontSize: 14, color: "#0f172a" },
  removeBtn: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#dc2626", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  removeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  
});