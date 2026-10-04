import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import {
  buscarMedicos,
  buscarHorarios,
  agendarConsulta,
} from '../services/api';
import { horariosDisponiveisDoMedico } from '../services/horarios';
import { criarControleUltimaRequisicao } from '../services/requisicoes';

export default function AgendarConsulta() {
  const [medicos, setMedicos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [nomePaciente, setNomePaciente] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarMedicos, setMostrarMedicos] = useState(false);
  const [mostrarHorarios, setMostrarHorarios] = useState(false);
  // Só a resposta do último pedido de horários entra na tela (troca rápida de médico).
  const controleHorarios = useRef(null);
  if (!controleHorarios.current) {
    controleHorarios.current = criarControleUltimaRequisicao();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    // Vira o pedido atual: descarta horários em andamento e, se um médico for
    // escolhido enquanto a lista carrega, a resposta dele prevalece sobre esta.
    const pedido = controleHorarios.current.nova();
    setHorarios([]);
    try {
      setLoading(true);
      const medicosData = await buscarMedicos();
      setMedicos(medicosData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      if (controleHorarios.current.ehAtual(pedido)) {
        setLoading(false);
      }
    }
  };

  // Cada médico tem a própria agenda: ao escolher o médico, busca só os horários dele.
  const carregarHorariosDoMedico = async (medicoId) => {
    const pedido = controleHorarios.current.nova();
    try {
      setLoading(true);
      const dados = await buscarHorarios(medicoId);
      if (controleHorarios.current.ehAtual(pedido)) {
        setHorarios(dados);
      }
    } catch (error) {
      if (controleHorarios.current.ehAtual(pedido)) {
        setHorarios([]);
        Alert.alert('Erro', 'Não foi possível carregar os horários do médico');
      }
    } finally {
      if (controleHorarios.current.ehAtual(pedido)) {
        setLoading(false);
      }
    }
  };

  const selecionarMedico = (medico) => {
    if (medicoSelecionado?.id !== medico.id) {
      setHorarioSelecionado(null);
    }
    setMedicoSelecionado(medico);
    setMostrarMedicos(false);
    carregarHorariosDoMedico(medico.id);
  };

  const horariosDisponiveis = horariosDisponiveisDoMedico(
    horarios,
    medicoSelecionado?.id
  );

  const textoBotaoHorario = !medicoSelecionado
    ? 'Selecione o médico primeiro'
    : horariosDisponiveis.length > 0
    ? 'Selecionar Horário'
    : 'Nenhum horário disponível para este médico';

  const confirmarAgendamento = async () => {
    if (!medicoSelecionado) {
      Alert.alert('Atenção', 'Selecione um médico');
      return;
    }

    if (!horarioSelecionado) {
      Alert.alert('Atenção', 'Selecione um horário');
      return;
    }

    if (!nomePaciente.trim()) {
      Alert.alert('Atenção', 'Digite seu nome');
      return;
    }

    Alert.alert(
      'Confirmar Agendamento',
      `Confirmar consulta com ${medicoSelecionado.nome} em ${horarioSelecionado.data} às ${horarioSelecionado.hora}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: async () => {
            let falhou = false;
            try {
              setLoading(true);

              const agendamento = {
                horario_id: horarioSelecionado.id,
                medico_id: medicoSelecionado.id,
                paciente_nome: nomePaciente,
              };

              await agendarConsulta(agendamento);

              Alert.alert(
                'Sucesso!',
                'Consulta agendada com sucesso!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setMedicoSelecionado(null);
                      setHorarioSelecionado(null);
                      setNomePaciente('');
                      carregarDados();
                    },
                  },
                ]
              );
            } catch (error) {
              // O horário pode ter sido ocupado ou removido: limpa a escolha e
              // recarrega a agenda do médico para mostrar o que ainda está livre.
              falhou = true;
              setHorarioSelecionado(null);
              Alert.alert('Erro', error.message || 'Erro ao agendar consulta');
            } finally {
              setLoading(false);
            }
            if (falhou) {
              carregarHorariosDoMedico(medicoSelecionado.id);
            }
          },
        },
      ]
    );
  };

  const renderMedico = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.medicoCard,
        medicoSelecionado?.id === item.id && styles.medicoSelecionado,
      ]}
      onPress={() => selecionarMedico(item)}>
      <Image source={{ uri: item.imagem }} style={styles.medicoImagem} />
      <View style={styles.medicoInfo}>
        <Text style={styles.medicoNome}>{item.nome}</Text>
        <Text style={styles.medicoEspecialidade}>{item.especialidade}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHorario = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.horarioCard,
        horarioSelecionado?.id === item.id && styles.horarioSelecionado,
      ]}
      onPress={() => {
        setHorarioSelecionado(item);
        setMostrarHorarios(false);
      }}>
      <Text style={styles.horarioData}>{item.data}</Text>
      <Text style={styles.horarioHora}>{item.hora}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.titulo}>Agendar Nova Consulta</Text>

        {/* Seleção de Médico */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>1. Selecione o Médico</Text>
            {medicoSelecionado ? (
              <View style={styles.selecionadoContainer}>
                <Image
                  source={{ uri: medicoSelecionado.imagem }}
                  style={styles.miniImagem}
                />
                <View style={styles.selecionadoInfo}>
                  <Text style={styles.selecionadoNome}>
                    {medicoSelecionado.nome}
                  </Text>
                  <Text style={styles.selecionadoDetalhe}>
                    {medicoSelecionado.especialidade}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMostrarMedicos(true)}
                  style={styles.btnTrocar}>
                  <Text style={styles.btnTrocarTexto}>Trocar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setMostrarMedicos(true)}
                style={styles.btnSelecionar}
                icon="doctor">
                Selecionar Médico
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Seleção de Horário */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>2. Selecione o Horário</Text>
            {horarioSelecionado ? (
              <View style={styles.selecionadoContainer}>
                <View style={styles.selecionadoInfo}>
                  <Text style={styles.selecionadoNome}>
                    {horarioSelecionado.data}
                  </Text>
                  <Text style={styles.selecionadoDetalhe}>
                    {horarioSelecionado.hora}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMostrarHorarios(true)}
                  style={styles.btnTrocar}>
                  <Text style={styles.btnTrocarTexto}>Trocar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                mode="outlined"
                onPress={() => setMostrarHorarios(true)}
                style={styles.btnSelecionar}
                icon="clock-outline"
                disabled={loading || horariosDisponiveis.length === 0}>
                {textoBotaoHorario}
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Nome do Paciente */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>3. Seu Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome completo"
              value={nomePaciente}
              onChangeText={setNomePaciente}
              editable={!loading}
            />
          </Card.Content>
        </Card>

        {/* Botão de Confirmar */}
        <Button
          mode="contained"
          onPress={confirmarAgendamento}
          style={styles.btnConfirmar}
          disabled={loading || !medicoSelecionado || !horarioSelecionado || !nomePaciente.trim()}
          loading={loading}>
          Confirmar Agendamento
        </Button>
      </View>

      {/* Modal de Seleção de Médicos */}
      <Modal
        visible={mostrarMedicos}
        animationType="slide"
        onRequestClose={() => setMostrarMedicos(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Selecione o Médico</Text>
            <TouchableOpacity onPress={() => setMostrarMedicos(false)}>
              <Text style={styles.modalFechar}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={medicos}
            keyExtractor={(item) => item.id}
            renderItem={renderMedico}
            ListEmptyComponent={
              <Text style={styles.listaVazia}>Nenhum médico cadastrado</Text>
            }
          />
        </View>
      </Modal>

      {/* Modal de Seleção de Horários */}
      <Modal
        visible={mostrarHorarios}
        animationType="slide"
        onRequestClose={() => setMostrarHorarios(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>
              Horários de {medicoSelecionado?.nome}
            </Text>
            <TouchableOpacity onPress={() => setMostrarHorarios(false)}>
              <Text style={styles.modalFechar}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={horariosDisponiveis}
            keyExtractor={(item) => item.id}
            renderItem={renderHorario}
            ListEmptyComponent={
              <Text style={styles.listaVazia}>
                Nenhum horário disponível para este médico
              </Text>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  btnSelecionar: {
    marginTop: 8,
  },
  selecionadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  miniImagem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  selecionadoInfo: {
    flex: 1,
  },
  selecionadoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selecionadoDetalhe: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  btnTrocar: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  btnTrocarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
  },
  btnConfirmar: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalFechar: {
    fontSize: 24,
    color: '#666',
  },
  medicoCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  medicoSelecionado: {
    backgroundColor: '#e3f2fd',
  },
  medicoImagem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  medicoInfo: {
    flex: 1,
  },
  medicoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  medicoEspecialidade: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  horarioCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  horarioSelecionado: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
    borderWidth: 2,
  },
  horarioData: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  horarioHora: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listaVazia: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
    color: '#999',
  },
});
