// Médicos da clínica: lista, busca, cadastrar e editar.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { CartaoMedico } from '../../componentes/Cartoes';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { cores, espaco, raio } from '../../tema/tokens';

export default function Medicos({ navigation }) {
  const recurso = useRecurso(() => api.medicos.listar());
  const [busca, setBusca] = useState('');

  return (
    <View style={estilos.raiz}>
      <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
        <Searchbar
          placeholder="Buscar médico"
          value={busca}
          onChangeText={setBusca}
          style={estilos.busca}
          accessibilityLabel="Buscar médico por nome ou especialidade"
        />
        <ConteudoRemoto
          recurso={recurso}
          vazio={{
            icone: 'doctor',
            titulo: 'Nenhum médico cadastrado',
            descricao: 'Cadastre o primeiro médico para abrir a agenda.',
            acao: 'Novo médico',
            aoAgir: () => navigation.navigate('MedicoForm', {}),
          }}
        >
          {(medicos) => {
            const termo = busca.trim().toLowerCase();
            const visiveis = medicos.filter(
              (m) => !termo || `${m.nome} ${m.especialidade}`.toLowerCase().includes(termo)
            );
            if (visiveis.length === 0)
              return <EstadoVazio icone="account-search-outline" titulo="Nenhum médico encontrado" />;
            return visiveis.map((medico) => (
              <CartaoMedico
                key={medico.id}
                medico={medico}
                aoTocar={() => navigation.navigate('MedicoForm', { id: medico.id })}
              />
            ));
          }}
        </ConteudoRemoto>
        <View style={estilos.respiro} />
      </Tela>
      <FAB
        icon="plus"
        label="Novo médico"
        color="#ffffff"
        style={estilos.fab}
        onPress={() => navigation.navigate('MedicoForm', {})}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  busca: {
    backgroundColor: cores.superficie,
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  fab: { position: 'absolute', right: espaco.md, bottom: espaco.md, backgroundColor: cores.marinho },
  respiro: { height: 72 },
});
