import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { buscarAgendamentos, cancelarAgendamento } from '../services/api';

export default function MeusAgendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const dados = await buscarAgendamentos();
      // Ordenar por data mais recente
      const ordenados = dados.sort((a, b) => {
        return new Date(b.criado_em) - new Date(a.criado_em);
      });
      setAgendamentos(ordenados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await carregarAgendamentos();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a lista');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelarAgendamento = (agendamento) => {
    Alert.alert(
      'Cancelar Consulta',
      `Deseja realmente cancelar a consulta com ${agendamento.medico_nome} em ${agendamento.data} às ${agendamento.hora}?`,
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelarAgendamento(agendamento.id);
              setAgendamentos((prev) =>
                prev.filter((a) => a.id !== agendamento.id)
              );
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso!');
            } catch (error) {
              Alert.alert('Erro', error.message || 'Erro ao cancelar consulta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatarData = (dataISO) => {
    try {
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Data inválida';
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <Chip
              style={[
                styles.statusChip,
                item.status === 'agendado'
                  ? styles.statusAgendado
                  : styles.statusCancelado,
              ]}
              textStyle={styles.statusTexto}>
              {item.status === 'agendado' ? '✓ Agendado' : '✗ Cancelado'}
            </Chip>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👨‍⚕️ Médico:</Text>
            <Text style={styles.infoValor}>{item.medico_nome}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏥 Especialidade:</Text>
            <Text style={styles.infoValor}>{item.medico_especialidade}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Paciente:</Text>
            <Text style={styles.infoValor}>{item.paciente_nome}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Data:</Text>
            <Text style={styles.infoValor}>{item.data}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🕐 Horário:</Text>
            <Text style={styles.infoValor}>{item.hora}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabelSmall}>Agendado em:</Text>
            <Text style={styles.infoValorSmall}>
              {formatarData(item.criado_em)}
            </Text>
          </View>
        </View>

        {item.status === 'agendado' && (
          <TouchableOpacity
            style={styles.btnCancelar}
            onPress={() => handleCancelarAgendamento(item)}
            disabled={loading}>
            <Text style={styles.btnCancelarTexto}>Cancelar Consulta</Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📅</Text>
      <Text style={styles.emptyText}>Nenhum agendamento encontrado</Text>
      <Text style={styles.emptySubtext}>
        Suas consultas agendadas aparecerão aqui
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.titulo}>Meus Agendamentos</Text>
        <Text style={styles.subtitulo}>
          {agendamentos.length}{' '}
          {agendamentos.length === 1 ? 'consulta' : 'consultas'}
        </Text>
      </View>

      <FlatList
        data={agendamentos}
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
        contentContainerStyle={
          agendamentos.length === 0 && styles.listEmpty
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
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
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusAgendado: {
    backgroundColor: '#d4edda',
  },
  statusCancelado: {
    backgroundColor: '#f8d7da',
  },
  statusTexto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValor: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  infoLabelSmall: {
    fontSize: 12,
    color: '#999',
  },
  infoValorSmall: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  btnCancelar: {
    marginTop: 16,
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listEmpty: {
    flex: 1,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
