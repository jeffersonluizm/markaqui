// Agenda da clínica por médico: livre, bloqueado ou com consulta. Bloquear e
// desbloquear de verdade (o botão que faltava na versão anterior).
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, IconButton, Text } from 'react-native-paper';
import { Tela, TituloSecao } from '../../componentes/Tela';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { ChipsFiltro } from '../../componentes/Seletores';
import { useAvisos } from '../../contexto/Avisos';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { agruparPorDia } from '../../servicos/agenda';
import { dataPorExtenso } from '../../servicos/formatacao';
import { cores, espaco, fontes, raio } from '../../tema/tokens';

function estadoDoHorario(h) {
  if (h.agendado) return { rotulo: h.paciente_nome, cor: cores.marinho, fundo: cores.gelo, icone: 'account' };
  if (h.bloqueado) return { rotulo: 'Bloqueado', cor: cores.aviso, fundo: cores.avisoFundo, icone: 'lock' };
  return { rotulo: 'Livre', cor: cores.sucesso, fundo: cores.sucessoFundo, icone: 'check' };
}

function LinhaHorario({ horario, aoBloquear, aoRemover, ocupado }) {
  const estado = estadoDoHorario(horario);
  return (
    <View style={estilos.linha} accessible={false}>
      <Text style={estilos.hora}>{horario.hora}</Text>
      <View style={[estilos.situacao, { backgroundColor: estado.fundo }]}>
        <Text variant="labelMedium" style={{ color: estado.cor }} numberOfLines={1}>
          {estado.rotulo}
        </Text>
      </View>
      <IconButton
        icon={horario.bloqueado ? 'lock-open-variant-outline' : 'lock-outline'}
        onPress={aoBloquear}
        disabled={horario.agendado || ocupado}
        accessibilityLabel={`${horario.bloqueado ? 'Desbloquear' : 'Bloquear'} ${horario.hora}`}
        size={22}
        iconColor={cores.marinho}
        style={estilos.botao}
      />
      <IconButton
        icon="trash-can-outline"
        onPress={aoRemover}
        disabled={horario.agendado || ocupado}
        accessibilityLabel={`Remover horário das ${horario.hora}`}
        size={22}
        iconColor={cores.erro}
        style={estilos.botao}
      />
    </View>
  );
}

export default function Agenda({ navigation }) {
  const { mostrar, confirmar } = useAvisos();
  const medicos = useRecurso(() => api.medicos.listar());
  const [medicoId, setMedicoId] = useState(null);
  const agenda = useRecurso(() => (medicoId ? api.horarios.listar(medicoId) : Promise.resolve([])), [medicoId]);
  const [ocupado, setOcupado] = useState(null);

  useEffect(() => {
    const lista = medicos.dados || [];
    if (!lista.some((m) => m.id === medicoId)) setMedicoId(lista[0]?.id ?? null);
  }, [medicos.dados, medicoId]);

  async function alternarBloqueio(h) {
    setOcupado(h.id);
    try {
      await api.horarios.bloquear(h.id, !h.bloqueado);
      mostrar(h.bloqueado ? `Horário das ${h.hora} liberado.` : `Horário das ${h.hora} bloqueado.`);
      agenda.atualizar();
    } catch (erro) {
      mostrar(erro.message, 'erro');
    } finally {
      setOcupado(null);
    }
  }

  async function remover(h) {
    const ok = await confirmar({
      titulo: 'Remover horário?',
      mensagem: `${dataPorExtenso(h.data)}, às ${h.hora}. Ele deixa de aparecer para os pacientes.`,
      confirmar: 'Remover',
      destrutivo: true,
    });
    if (!ok) return;
    setOcupado(h.id);
    try {
      await api.horarios.remover(h.id);
      mostrar('Horário removido.');
      agenda.atualizar();
    } catch (erro) {
      mostrar(erro.message, 'erro');
    } finally {
      setOcupado(null);
    }
  }

  return (
    <View style={estilos.raiz}>
      <Tela atualizando={agenda.atualizando} aoAtualizar={agenda.recarregar}>
        <ConteudoRemoto
          recurso={medicos}
          vazio={{ icone: 'doctor', titulo: 'Cadastre um médico primeiro', descricao: 'Cada horário pertence à agenda de um médico.', acao: 'Novo médico', aoAgir: () => navigation.navigate('MedicoForm', {}) }}
        >
          {(lista) => (
            <>
              <ChipsFiltro
                rotulo="Escolher médico"
                selecionada={medicoId}
                aoSelecionar={setMedicoId}
                opcoes={lista.map((m) => ({ valor: m.id, rotulo: m.nome }))}
              />
              <ConteudoRemoto
                recurso={agenda}
                mensagemCarregando="Abrindo a agenda..."
                vazio={{
                  icone: 'calendar-blank-outline',
                  titulo: 'Agenda vazia',
                  descricao: 'Abra horários para este médico com o botão "Abrir horários".',
                }}
              >
                {(horarios) =>
                  agruparPorDia(horarios).map((grupo) => (
                    <View key={grupo.data} style={estilos.dia}>
                      <TituloSecao>{dataPorExtenso(grupo.data)}</TituloSecao>
                      {grupo.horarios.map((h) => (
                        <LinhaHorario
                          key={h.id}
                          horario={h}
                          ocupado={ocupado === h.id}
                          aoBloquear={() => alternarBloqueio(h)}
                          aoRemover={() => remover(h)}
                        />
                      ))}
                    </View>
                  ))
                }
              </ConteudoRemoto>
              <View style={estilos.respiro} />
            </>
          )}
        </ConteudoRemoto>
      </Tela>
      {medicoId ? (
        <FAB
          icon="calendar-plus"
          label="Abrir horários"
          style={estilos.fab}
          color="#ffffff"
          onPress={() => navigation.navigate('NovosHorarios', { medicoId })}
          accessibilityLabel="Abrir novos horários para este médico"
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  dia: { gap: espaco.xs },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    backgroundColor: cores.superficie,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    paddingLeft: espaco.md,
    minHeight: 56,
  },
  hora: { fontFamily: fontes.negrito, fontSize: 16, color: cores.marinhoEscuro, width: 56 },
  situacao: { flex: 1, borderRadius: raio.chip, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center' },
  botao: { margin: 0, width: 48, height: 48 },
  fab: { position: 'absolute', right: espaco.md, bottom: espaco.md, backgroundColor: cores.marinho },
  respiro: { height: 72 },
});
