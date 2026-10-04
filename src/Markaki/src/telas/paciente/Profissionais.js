// Lista de médicos com busca e filtro por especialidade (filtros vêm dos dados,
// não de uma lista fixa).
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { CartaoMedico } from '../../componentes/Cartoes';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { ChipsFiltro } from '../../componentes/Seletores';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { especialidades } from '../../servicos/agenda';
import { cores, raio } from '../../tema/tokens';

const TODAS = '__todas__';

export default function Profissionais({ navigation, route }) {
  const recurso = useRecurso(() => api.medicos.listar());
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState(route.params?.especialidade || TODAS);

  // `em` muda a cada toque no atalho do Início, mesmo repetindo a especialidade.
  useEffect(() => {
    if (route.params?.especialidade) setFiltro(route.params.especialidade);
  }, [route.params?.especialidade, route.params?.em]);

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <Searchbar
        placeholder="Buscar por nome ou especialidade"
        value={busca}
        onChangeText={setBusca}
        style={estilos.busca}
        inputStyle={estilos.textoBusca}
        accessibilityLabel="Buscar médico por nome ou especialidade"
      />
      <ConteudoRemoto
        recurso={recurso}
        mensagemCarregando="Buscando médicos..."
        vazio={{ icone: 'doctor', titulo: 'Nenhum médico cadastrado', descricao: 'A clínica ainda não publicou a agenda.' }}
      >
        {(medicos) => {
          const termo = busca.trim().toLowerCase();
          const visiveis = medicos.filter(
            (m) =>
              (filtro === TODAS || m.especialidade === filtro) &&
              (!termo || m.nome.toLowerCase().includes(termo) || m.especialidade.toLowerCase().includes(termo))
          );
          return (
            <>
              <ChipsFiltro
                rotulo="Filtrar por especialidade"
                selecionada={filtro}
                aoSelecionar={setFiltro}
                opcoes={[{ valor: TODAS, rotulo: 'Todas' }, ...especialidades(medicos).map((e) => ({ valor: e, rotulo: e }))]}
              />
              {visiveis.length === 0 ? (
                <EstadoVazio
                  icone="account-search-outline"
                  titulo="Nenhum médico encontrado"
                  descricao="Tente outro nome ou limpe o filtro."
                  acao="Limpar busca"
                  aoAgir={() => {
                    setBusca('');
                    setFiltro(TODAS);
                  }}
                />
              ) : (
                visiveis.map((medico) => (
                  <CartaoMedico key={medico.id} medico={medico} aoTocar={() => navigation.navigate('DetalheProfissional', { id: medico.id })} />
                ))
              )}
            </>
          );
        }}
      </ConteudoRemoto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  busca: { backgroundColor: cores.superficie, borderRadius: raio.pilula, borderWidth: 1, borderColor: cores.bordaSuave },
  textoBusca: { minHeight: 48 },
});
