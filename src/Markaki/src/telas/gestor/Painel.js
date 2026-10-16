// Painel da clínica: números do dia e da semana e a agenda de hoje.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Tela, TituloSecao } from '../../componentes/Tela';
import { CartaoConsulta, Estatistica } from '../../componentes/Cartoes';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { BotaoSecundario } from '../../componentes/Formulario';
import { useSessao } from '../../contexto/Sessao';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { saudacao, dataPorExtenso } from '../../servicos/formatacao';
import { cores, espaco, fontes, raio } from '../../tema/tokens';

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Painel({ navigation }) {
  const { usuario } = useSessao();
  const recurso = useRecurso(() => api.painel());

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <View style={estilos.boasVindas}>
        <Text style={estilos.ola}>{saudacao()},</Text>
        <Text style={estilos.nome} accessibilityRole="header">
          {usuario.nome}
        </Text>
        <Text variant="bodyMedium" style={estilos.data}>
          {dataPorExtenso(hoje())}
        </Text>
      </View>
      <ConteudoRemoto recurso={recurso} mensagemCarregando="Montando o painel...">
        {(painel) => (
          <>
            <View style={estilos.grade}>
              <Estatistica icone="calendar-today" valor={painel.consultas_hoje} rotulo="consultas hoje" />
              <Estatistica icone="calendar-week" valor={painel.consultas_7_dias} rotulo="nos próximos 7 dias" />
              <Estatistica icone="calendar-check-outline" valor={painel.horarios_livres} rotulo="horários livres" />
              <Estatistica icone="doctor" valor={painel.medicos} rotulo="médicos" />
            </View>
            <TituloSecao>Agenda de hoje</TituloSecao>
            {painel.agenda_de_hoje.length === 0 ? (
              <EstadoVazio
                icone="coffee-outline"
                titulo="Nenhuma consulta hoje"
                descricao="As consultas marcadas para hoje aparecem aqui."
              />
            ) : (
              painel.agenda_de_hoje.map((c) => (
                <CartaoConsulta
                  key={c.id}
                  consulta={c}
                  mostrarPaciente
                  aoTocar={() => navigation.navigate('DetalheConsulta', { id: c.id })}
                />
              ))
            )}
            <View style={estilos.atalhos}>
              <BotaoSecundario
                icon="calendar-plus"
                onPress={() => navigation.navigate('NovosHorarios', {})}
                style={estilos.atalho}
              >
                Abrir horários
              </BotaoSecundario>
              <BotaoSecundario
                icon="account-plus-outline"
                onPress={() => navigation.navigate('MedicoForm', {})}
                style={estilos.atalho}
              >
                Novo médico
              </BotaoSecundario>
            </View>
          </>
        )}
      </ConteudoRemoto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  boasVindas: { backgroundColor: cores.marinho, borderRadius: raio.cartao, padding: espaco.lg },
  ola: { fontFamily: fontes.media, fontSize: 18, color: cores.gelo },
  nome: { fontFamily: fontes.negrito, fontSize: 24, color: '#ffffff' },
  data: { color: cores.gelo, marginTop: 4 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  atalho: { flexGrow: 1 },
});
