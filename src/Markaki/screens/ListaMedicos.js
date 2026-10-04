import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { buscarMedicos, cadastrarMedico, removerMedico } from '../services/api';

export default function ListaMedicos() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [novoNome, setNovoNome] = useState('');
  const [novaEspecialidade, setNovaEspecialidade] = useState('');
  const [novaImagem, setNovaImagem] = useState('');

  const [medicos, setMedicos] = useState([]);

  const filtros = [
    'Todos',
    'Psicólogo',
    'Cardiologista',
    'Ortopedista',
    'Psiquiatria infantil',
    'Clínico Geral',
  ];

  useEffect(() => {
    carregarMedicos();
  }, []);

  const carregarMedicos = async () => {
    try {
      setLoading(true);
      const dados = await buscarMedicos();
      setMedicos(dados);
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível carregar os médicos. Verifique se o backend está rodando.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const dados = await buscarMedicos();
      setMedicos(dados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a lista');
    } finally {
      setRefreshing(false);
    }
  };

  const adicionarMedico = async () => {
    if (!novoNome.trim() || !novaEspecialidade.trim()) {
      Alert.alert('Erro', 'Por favor, preencha nome e especialidade');
      return;
    }

    try {
      setLoading(true);

      const novoMedico = {
        nome: novoNome,
        especialidade: novaEspecialidade,
        imagem: novaImagem || 'https://via.placeholder.com/80',
      };

      const medicoCadastrado = await cadastrarMedico(novoMedico);
      setMedicos([...medicos, medicoCadastrado]);

      setNovoNome('');
      setNovaEspecialidade('');
      setNovaImagem('');
      setModalVisible(false);

      Alert.alert('Sucesso', 'Médico cadastrado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar médico');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverMedico = (id, nome) => {
    Alert.alert('Confirmar remoção', `Deseja realmente remover ${nome}?`, [
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
            const resultado = await removerMedico(id);
            setMedicos((prevData) => prevData.filter((item) => item.id !== id));
            const removidos = resultado?.horarios_removidos || 0;
            Alert.alert(
              'Sucesso',
              removidos > 0
                ? `Médico removido com sucesso! ${removidos} horário(s) livre(s) dele também foram removidos.`
                : 'Médico removido com sucesso!'
            );
          } catch (error) {
            if (error.status === 409) {
              // Médico com consultas marcadas: a API pede para cancelar antes.
              Alert.alert('Atenção', error.message);
              return;
            }
            Alert.alert('Erro', error.message || 'Erro ao remover médico');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const filteredData = medicos.filter((item) => {
    const matchNome = item.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFiltro =
      selectedFilter === 'Todos' ||
      item.especialidade.toLowerCase() === selectedFilter.toLowerCase();
    return matchNome && matchFiltro;
  });

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image style={styles.logo} source={{ uri: item.imagem }} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.nome}</Text>
        <Text style={styles.description}>{item.especialidade}</Text>
      </View>
      <TouchableOpacity
        style={styles.btnRemover}
        onPress={() => handleRemoverMedico(item.id, item.nome)}
        disabled={loading}>
        <Text style={styles.btnRemoverTexto}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery || selectedFilter !== 'Todos'
          ? 'Nenhum médico encontrado com os filtros aplicados'
          : 'Nenhum médico cadastrado ainda.\nClique no botão + para adicionar'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        style={styles.searchBar}
        placeholder="Pesquisar"
        onChangeText={setSearchQuery}
        value={searchQuery}
      />

      <View style={styles.filtrosContainer}>
        {filtros.map((filtro) => {
          const ativo = selectedFilter === filtro;
          return (
            <TouchableOpacity
              key={filtro}
              onPress={() => setSelectedFilter(filtro)}
              style={[styles.filtroButton, ativo && styles.filtroAtivo]}>
              <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>
                {filtro}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
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
            <Text style={styles.modalTitle}>Cadastrar Novo Médico</Text>

            <Text style={styles.inputLabel}>Nome completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Dr. João Silva"
              value={novoNome}
              onChangeText={setNovoNome}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Especialidade *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cardiologista"
              value={novaEspecialidade}
              onChangeText={setNovaEspecialidade}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>URL da imagem (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://exemplo.com/imagem.jpg"
              value={novaImagem}
              onChangeText={setNovaImagem}
              editable={!loading}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btnModal, styles.btnCancelar]}
                onPress={() => {
                  setModalVisible(false);
                  setNovoNome('');
                  setNovaEspecialidade('');
                  setNovaImagem('');
                }}
                disabled={loading}>
                <Text style={styles.btnTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnModal, styles.btnSalvar]}
                onPress={adicionarMedico}
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
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    marginBottom: 10,
    borderRadius: 9999,
  },
  filtrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  filtroButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  filtroAtivo: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filtroTexto: {
    fontSize: 14,
    color: '#333',
  },
  filtroTextoAtivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  btnRemover: {
    backgroundColor: '#ff4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
