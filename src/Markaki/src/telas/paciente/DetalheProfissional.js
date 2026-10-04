// Agenda de um médico: escolha o dia e o horário livre.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Tela, TituloSecao } from '../../componentes/Tela';
import { AvatarIniciais } from '../../componentes/Cartoes';
import { ConteudoRemoto } from '../../componentes/Estados';
import { SeletorDia, GradeHoras } from '../../componentes/Seletores';
import { BotaoPrincipal } from '../../componentes/Formulario';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { agruparPorDia } from '../../servicos/agenda';
import { dataPorExtenso } from '../../servicos/formatacao';
import { cores, espaco, raio } from '../../tema/tokens';

export default function DetalheProfissional({ navigation, route }) {
  const { id } = route.params;
  const recurso = useRecurso(async () => {
    const [medico, horarios] = await Promise.all([api.medicos.buscar(id), api.horarios.listar(id)]);
    return { medico, dias: agruparPorDia(horarios) };
  }, [id]);
  const [dia, setDia] = useState(null);
  const [horarioId, setHorarioId] = useState(null);

  // Mantém o dia escolhido se ele ainda tem horários; senão, vai para o primeiro.
  useEffect(() => {
    const dias = recurso.dados?.dias || [];
    if (!dias.some((d) => d.data === dia)) setDia(dias[0]?.data ?? null);
  }, [recurso.dados, dia]);

  useEffect(() => {
    if (recurso.dados?.medico) navigation.setOptions({ title: recurso.dados.medico.nome });
  }, [recurso.dados?.medico, navigation]);

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <ConteudoRemoto recurso={recurso} mensagemCarregando="Buscando horários livres...">
        {({ medico, dias }) => {
          const doDia = dias.find((d) => d.data === dia)?.horarios || [];
          const escolhido = doDia.find((h) => h.id === horarioId);
          return (
            <>
              <View style={estilos.cabecalho}>
                <AvatarIniciais nome={medico.nome} tamanho={64} />
                <View style={estilos.expande}>
                  <Text variant="titleLarge" style={estilos.nome} accessibilityRole="header">
                    {medico.nome}
                  </Text>
                  <Text variant="bodyMedium" style={estilos.secundario}>
                    {medico.especialidade}
                  </Text>
                </View>
              </View>

              {dias.length === 0 ? (
                <View style={estilos.semHorario}>
                  <Text variant="titleMedium" style={estilos.nome}>
                    Sem horários livres no momento
                  </Text>
                  <Text variant="bodyMedium" style={estilos.secundario}>
                    A agenda deste médico está cheia. Veja outro profissional da mesma especialidade ou volte mais tarde.
                  </Text>
                </View>
              ) : (
                <>
                  <TituloSecao>1. Escolha o dia</TituloSecao>
                  <SeletorDia
                    dias={dias.map((d) => d.data)}
                    selecionado={dia}
                    aoSelecionar={(novo) => {
                      setDia(novo);
                      setHorarioId(null);
                    }}
                  />
                  <TituloSecao>2. Escolha o horário</TituloSecao>
                  {dia ? (
                    <Text variant="bodyMedium" style={estilos.secundario}>
                      {dataPorExtenso(dia)}
                    </Text>
                  ) : null}
                  <GradeHoras
                    horas={doDia.map((h) => h.hora)}
                    selecionadas={escolhido?.hora}
                    aoAlternar={(hora) => setHorarioId(doDia.find((h) => h.hora === hora)?.id)}
                  />
                  <BotaoPrincipal
                    disabled={!escolhido}
                    onPress={() => navigation.navigate('ConfirmarAgendamento', { horarioId: escolhido.id })}
                    style={estilos.botao}
                  >
                    {escolhido ? `Continuar com ${escolhido.hora}` : 'Escolha um horário'}
                  </BotaoPrincipal>
                </>
              )}
            </>
          );
        }}
      </ConteudoRemoto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', gap: espaco.md, alignItems: 'center', backgroundColor: cores.superficie, padding: espaco.md, borderRadius: raio.cartao },
  expande: { flex: 1 },
  nome: { color: cores.marinhoEscuro },
  secundario: { color: cores.textoSecundario },
  semHorario: { backgroundColor: cores.superficie, borderRadius: raio.cartao, padding: espaco.lg, gap: espaco.xs },
  botao: { marginTop: espaco.sm },
});
