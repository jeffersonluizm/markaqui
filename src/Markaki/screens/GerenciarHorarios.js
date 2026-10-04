import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { FAB, Card, Chip } from 'react-native-paper';
import {
  buscarHorarios,
  cadastrarHorario,
  removerHorario,
  atualizarHorario,
} from '../services/api';
import { estaAgendado } from '../services/horarios';

export default function GerenciarHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');

  useEffect(() => {
    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
    try {
      setLoading(true);
      const dados = await buscarHorarios();
      setHorarios(dados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os horários');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const dados = await buscarHorarios();
      setHorarios(dados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a lista');
    } finally {
      setRefreshing(false);
    }
  };

  const adicionarHorario = async () => {
    if (!novaData.trim() || !novaHora.trim()) {
      Alert.alert('Erro', 'Por favor, preencha data e hora');
      return;
    }

    try {
      setLoading(true);

      const novoHorario = {
        data: novaData,
        hora: novaHora,
        disponivel: true,
      };

      const horarioCadastrado = await cadastrarHorario(novoHorario);
      setHorarios([...horarios, horarioCadastrado]);

      setNovaData('');
      setNovaHora('');
      setModalVisible(false);

      Alert.alert('Sucesso', 'Horário cadastrado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar horário');
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilidade = async (horario) => {
    if (estaAgendado(horario)) {
      Alert.alert(
        'Atenção',
        'Este horário está ocupado e não pode ser alterado aqui. Cancele o agendamento primeiro.'
      );
      return;
    }

    try {
      setLoading(true);
      // Envia só o campo alterado: uma cópia local desatualizada não pode apagar
      // paciente/médico de um agendamento feito depois que a lista foi carregada.
      const horarioAtualizado = await atualizarHorario(horario.id, {
        disponivel: !horario.disponivel,
      });

      setHorarios((prev) =>
        prev.map((h) => (h.id === horario.id ? horarioAtualizado : h))
      );
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar horário');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverHorario = (horario) => {
    if (estaAgendado(horario)) {
      Alert.alert(
        'Atenção',
        'Este horário está ocupado e não pode ser removido. Cancele o agendamento primeiro.'
      );
      return;
    }

    Alert.alert(
      'Confirmar remoção',
      `Deseja realmente remover o horário ${horario.data} às ${horario.hora}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removerHorario(horario.id);
              setHorarios((prev) => prev.filter((h) => h.id !== horario.id));
              Alert.alert('Sucesso', 'Horário removido com sucesso!');
            } catch (error) {
              Alert.alert('Erro', error.message || 'Erro ao remover horário');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.horarioHeader}>
          <View style={styles.horarioInfo}>
            <Text style={styles.horarioData}>📅 {item.data}</Text>
            <Text style={styles.horarioHora}>🕐 {item.hora}</Text>
            {item.paciente_nome && (
              <Text style={styles.horarioPaciente}>👤 {item.paciente_nome}</Text>
            )}
            {item.medico_nome && (
              <Text style={styles.horarioMedico}>👨‍⚕️ {item.medico_nome}</Text>
            )}
          </View>

          <View style={styles.horarioAcoes}>
            <Chip
              style={[
                styles.chip,
                item.disponivel ? styles.chipDisponivel : styles.chipOcupado,
              ]}
              textStyle={styles.chipText}>
              {item.disponivel ? 'Disponível' : estaAgendado(item) ? 'Ocupado' : 'Indisponível'}
            </Chip>

            <TouchableOpacity
              style={styles.btnRemover}
              onPress={() => handleRemoverHorario(item)}
              disabled={loading}>
              <Text style={styles.btnRemoverTexto}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Nenhum horário cadastrado ainda.{'\n'}Clique no botão + para adicionar
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Gerenciar Horários</Text>
        <Text style={styles.subtitulo}>
          {horarios.filter((h) => h.disponivel).length} horários disponíveis
        </Text>
      </View>

      <FlatList
        data={horarios}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
          />
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
        disabled={loading}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cadastrar Novo Horário</Text>

            <Text style={styles.inputLabel}>Data *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2025-11-25"
              value={novaData}
              onChangeText={setNovaData}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Horário *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 14:00 - 15:00"
              value={novaHora}
              onChangeText={setNovaHora}
              editable={!loading}
            />

            <Text style={styles.dica}>
              💡 Dica: Use o formato AAAA-MM-DD para a data
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => {
                  setModalVisible(false);
                  setNovaData('');
                  setNovaHora('');
                }}
                disabled={loading}>
                <Text style={styles.btnTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModal, styles.btnSalvar]}
                onPress={adicionarHorario}
                disabled={loading}>
                <Text style={styles.btnTexto}>{loading ? 'Salvando...' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  horarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  horarioInfo: {
    flex: 1,
  },
  horarioData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  horarioHora: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  horarioPaciente: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  horarioMedico: {
    fontSize: 14,
    color: '#28a745',
  },
  horarioAcoes: {
    alignItems: 'flex-end',
  },
  chip: {
    marginBottom: 8,
  },
  chipDisponivel: {
    backgroundColor: '#d4edda',
  },
  chipOcupado: {
    backgroundColor: '#f8d7da',
  },
  chipText: {
    fontSize: 12,
  },
  btnRemover: {
    backgroundColor: '#ff4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRemoverTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007bff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  dica: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  btnModal: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancelar: {
    backgroundColor: '#ccc',
  },
  btnSalvar: {
    backgroundColor: '#007bff',
  },
  btnTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
