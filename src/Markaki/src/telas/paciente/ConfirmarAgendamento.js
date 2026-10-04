// Confirmação: revisão do que vai ser marcado antes de gravar.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { BotaoPrincipal, BotaoTexto } from '../../componentes/Formulario';
import { useSessao } from '../../contexto/Sessao';
import { useAvisos } from '../../contexto/Avisos';
import { api } from '../../servicos/api';
import { dataPorExtenso } from '../../servicos/formatacao';
import { cores, espaco, raio } from '../../tema/tokens';

function Linha({ icone, rotulo, valor }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Icon source={icone} size={22} color={cores.marinho} />
      <View style={estilos.expande}>
        <Text variant="labelMedium" style={estilos.rotulo}>
          {rotulo}
        </Text>
        <Text variant="bodyLarge" style={estilos.valor}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

export default function ConfirmarAgendamento({ navigation, route }) {
  const { horario } = route.params;
  const { usuario } = useSessao();
  const { mostrar } = useAvisos();
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    try {
      const consulta = await api.agendamentos.agendar(horario.id, horario.medico_id);
      navigation.replace('AgendamentoConcluido', { consulta });
    } catch (erro) {
      setEnviando(false);
      mostrar(erro.message, 'erro');
      // Horário ocupado por outra pessoa: volta para a agenda, que recarrega ao focar.
      if (erro.status === 409 || erro.status === 404) navigation.goBack();
    }
  }

  return (
    <Tela>
      <TituloTela titulo="Confirme sua consulta" subtitulo="Revise os dados antes de agendar." />
      <View style={estilos.cartao}>
        <Linha icone="doctor" rotulo="Médico" valor={horario.medico_nome} />
        <Linha icone="stethoscope" rotulo="Especialidade" valor={horario.medico_especialidade} />
        <Linha icone="calendar" rotulo="Dia" valor={dataPorExtenso(horario.data)} />
        <Linha icone="clock-outline" rotulo="Horário" valor={horario.hora} />
        <Linha icone="account-outline" rotulo="Paciente" valor={usuario.nome} />
      </View>
      <View style={estilos.nota}>
        <Icon source="information-outline" size={20} color={cores.marinho} />
        <Text variant="bodySmall" style={estilos.textoNota}>
          Você pode cancelar até o horário da consulta, em Consultas.
        </Text>
      </View>
      <BotaoPrincipal onPress={confirmar} loading={enviando} disabled={enviando} icon="check">
        Confirmar agendamento
      </BotaoPrincipal>
      <BotaoTexto onPress={() => navigation.goBack()} disabled={enviando}>
        Escolher outro horário
      </BotaoTexto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.cartao, borderWidth: 1, borderColor: cores.bordaSuave, padding: espaco.md, gap: espaco.md },
  linha: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center' },
  expande: { flex: 1 },
  rotulo: { color: cores.textoSecundario },
  valor: { color: cores.marinhoEscuro },
  nota: { flexDirection: 'row', gap: espaco.xs, alignItems: 'center', backgroundColor: cores.gelo, padding: espaco.sm, borderRadius: 12 },
  textoNota: { flex: 1, color: cores.marinhoEscuro },
});
