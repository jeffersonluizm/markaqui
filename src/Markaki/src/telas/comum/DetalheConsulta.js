// Detalhe de uma consulta, com cancelamento (confirmação própria, não Alert).
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { AvatarIniciais, ChipSituacao } from '../../componentes/Cartoes';
import { ConteudoRemoto } from '../../componentes/Estados';
import { BotaoSecundario } from '../../componentes/Formulario';
import { useSessao } from '../../contexto/Sessao';
import { useAvisos } from '../../contexto/Avisos';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { dataPorExtenso, telefoneFormatado } from '../../servicos/formatacao';
import { cores, espaco, raio } from '../../tema/tokens';

function Item({ icone, rotulo, valor }) {
  return (
    <View style={estilos.item} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
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

export default function DetalheConsulta({ route }) {
  const { id } = route.params;
  const { usuario } = useSessao();
  const { mostrar, confirmar } = useAvisos();
  const recurso = useRecurso(() => api.agendamentos.buscar(id), [id]);
  const [cancelando, setCancelando] = useState(false);
  const daClinica = usuario.papel === 'gestor';

  async function cancelar(consulta) {
    const ok = await confirmar({
      titulo: 'Cancelar consulta?',
      mensagem: `${consulta.medico_nome}, ${dataPorExtenso(consulta.data)} às ${consulta.hora}. O horário volta a ficar livre para outras pessoas.`,
      confirmar: 'Cancelar consulta',
      cancelar: 'Manter',
      destrutivo: true,
    });
    if (!ok) return;
    setCancelando(true);
    try {
      await api.agendamentos.cancelar(consulta.id);
      mostrar('Consulta cancelada.');
      recurso.recarregar();
    } catch (erro) {
      mostrar(erro.message, 'erro');
    } finally {
      setCancelando(false);
    }
  }

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <ConteudoRemoto recurso={recurso} mensagemCarregando="Abrindo a consulta...">
        {(consulta) => (
          <>
            <View style={estilos.cabecalho}>
              <AvatarIniciais nome={daClinica ? consulta.paciente_nome : consulta.medico_nome} tamanho={56} />
              <View style={estilos.expande}>
                <Text variant="titleLarge" style={estilos.valor} accessibilityRole="header">
                  {daClinica ? consulta.paciente_nome : consulta.medico_nome}
                </Text>
                <Text variant="bodyMedium" style={estilos.rotulo}>
                  {daClinica ? `Paciente de ${consulta.medico_nome}` : consulta.medico_especialidade}
                </Text>
              </View>
              <ChipSituacao situacao={consulta.situacao} />
            </View>
            <View style={estilos.cartao}>
              <Item icone="calendar" rotulo="Dia" valor={dataPorExtenso(consulta.data)} />
              <Item icone="clock-outline" rotulo="Horário" valor={consulta.hora} />
              <Item icone="doctor" rotulo="Médico" valor={`${consulta.medico_nome} (${consulta.medico_especialidade})`} />
              {daClinica ? <Item icone="account-outline" rotulo="Paciente" valor={consulta.paciente_nome} /> : null}
              <Item icone="calendar-plus" rotulo="Agendada em" valor={new Date(consulta.criado_em).toLocaleString('pt-BR')} />
              {consulta.situacao === 'cancelado' ? (
                <Item
                  icone="close-circle-outline"
                  rotulo="Cancelada"
                  valor={`${new Date(consulta.cancelado_em).toLocaleString('pt-BR')}, pela ${consulta.cancelado_por === 'gestor' ? 'clínica' : 'paciente'}`}
                />
              ) : null}
            </View>
            {consulta.situacao === 'agendado' ? (
              <BotaoSecundario
                icon="calendar-remove"
                onPress={() => cancelar(consulta)}
                loading={cancelando}
                disabled={cancelando}
                textColor={cores.erro}
                style={estilos.botaoCancelar}
              >
                Cancelar consulta
              </BotaoSecundario>
            ) : null}
            {!daClinica && usuario.telefone ? (
              <Text variant="bodySmall" style={estilos.rotulo}>
                A clínica pode falar com você pelo {telefoneFormatado(usuario.telefone)}.
              </Text>
            ) : null}
          </>
        )}
      </ConteudoRemoto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  expande: { flex: 1 },
  cartao: { backgroundColor: cores.superficie, borderRadius: raio.cartao, borderWidth: 1, borderColor: cores.bordaSuave, padding: espaco.md, gap: espaco.md },
  item: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center' },
  rotulo: { color: cores.textoSecundario },
  valor: { color: cores.marinhoEscuro },
  botaoCancelar: { borderColor: cores.erro },
});
