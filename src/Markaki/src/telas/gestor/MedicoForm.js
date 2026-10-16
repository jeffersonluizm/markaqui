// Cadastrar ou editar médico (editar faltava na versão anterior) e remover.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Tela, TituloSecao } from '../../componentes/Tela';
import { Campo, BotaoPrincipal, BotaoSecundario } from '../../componentes/Formulario';
import { ChipsFiltro } from '../../componentes/Seletores';
import { EstadoCarregando, EstadoErro } from '../../componentes/Estados';
import { useAvisos } from '../../contexto/Avisos';
import { api } from '../../servicos/api';
import { especialidades } from '../../servicos/agenda';
import { validarMedico, semErros } from '../../servicos/validacao';
import { cores, espaco, raio } from '../../tema/tokens';

export default function MedicoForm({ navigation, route }) {
  const id = route.params?.id;
  const { mostrar, confirmar } = useAvisos();
  const [form, setForm] = useState({ nome: '', especialidade: '' });
  const [sugestoes, setSugestoes] = useState([]);
  const [erros, setErros] = useState({});
  const [estado, setEstado] = useState({ carregando: true, erro: null });
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setEstado({ carregando: true, erro: null });
    try {
      const medicos = await api.medicos.listar();
      setSugestoes(especialidades(medicos));
      if (id) {
        const medico = medicos.find((m) => m.id === id) || (await api.medicos.buscar(id));
        setForm({ nome: medico.nome, especialidade: medico.especialidade });
      }
      setEstado({ carregando: false, erro: null });
    } catch (erro) {
      setEstado({ carregando: false, erro });
    }
  }

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Editar médico' : 'Novo médico' });
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function salvar() {
    const encontrados = validarMedico(form);
    setErros(encontrados);
    if (!semErros(encontrados)) return;
    setSalvando(true);
    try {
      const dados = { nome: form.nome.trim(), especialidade: form.especialidade.trim() };
      if (id) await api.medicos.atualizar(id, dados);
      else await api.medicos.cadastrar(dados);
      mostrar(id ? 'Médico atualizado.' : 'Médico cadastrado.');
      navigation.goBack();
    } catch (erro) {
      mostrar(erro.message, 'erro');
      setSalvando(false);
    }
  }

  async function remover() {
    const ok = await confirmar({
      titulo: `Remover ${form.nome}?`,
      mensagem:
        'A agenda dele sai junto. O histórico de consultas continua. Médico com consulta marcada não pode ser removido.',
      confirmar: 'Remover médico',
      destrutivo: true,
    });
    if (!ok) return;
    try {
      const resultado = await api.medicos.remover(id);
      mostrar(`Médico removido (${resultado.horarios_removidos} horário(s) da agenda).`);
      navigation.goBack();
    } catch (erro) {
      mostrar(erro.message, 'erro');
    }
  }

  if (estado.carregando) return <EstadoCarregando />;
  if (estado.erro) return <EstadoErro erro={estado.erro} aoTentarDeNovo={carregar} />;

  return (
    <Tela>
      <Campo
        rotulo="Nome completo"
        value={form.nome}
        onChangeText={(nome) => setForm({ ...form, nome })}
        erro={erros.nome}
        placeholder="Ex.: Dra. Helena Duarte"
      />
      <Campo
        rotulo="Especialidade"
        value={form.especialidade}
        onChangeText={(especialidade) => setForm({ ...form, especialidade })}
        erro={erros.especialidade}
        placeholder="Ex.: Cardiologia"
      />
      {sugestoes.length ? (
        <>
          <Text variant="labelMedium" style={estilos.rotulo}>
            Especialidades já usadas
          </Text>
          <ChipsFiltro
            rotulo="Especialidades já usadas"
            selecionada={form.especialidade}
            aoSelecionar={(especialidade) => setForm({ ...form, especialidade })}
            opcoes={sugestoes.map((e) => ({ valor: e, rotulo: e }))}
          />
        </>
      ) : null}
      <BotaoPrincipal onPress={salvar} loading={salvando} disabled={salvando}>
        {id ? 'Salvar alterações' : 'Cadastrar médico'}
      </BotaoPrincipal>
      {id ? (
        <View style={estilos.perigo}>
          <TituloSecao>Zona de remoção</TituloSecao>
          <BotaoSecundario
            icon="trash-can-outline"
            onPress={remover}
            textColor={cores.erro}
            style={estilos.botaoRemover}
          >
            Remover médico
          </BotaoSecundario>
        </View>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  rotulo: { color: cores.textoSecundario },
  perigo: {
    marginTop: espaco.lg,
    padding: espaco.md,
    borderRadius: raio.cartao,
    backgroundColor: cores.erroFundo,
    gap: espaco.sm,
  },
  botaoRemover: { borderColor: cores.erro, backgroundColor: cores.superficie },
});
