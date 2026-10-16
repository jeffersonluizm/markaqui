// Sucesso do agendamento, com o resumo e os próximos passos. Recebe o id da
// consulta e busca o resumo (vale também ao recarregar /agendado no navegador).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela } from '../../componentes/Tela';
import { ConteudoRemoto, EstadoVazio } from '../../componentes/Estados';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { BotaoPrincipal, BotaoSecundario } from '../../componentes/Formulario';
import { dataPorExtenso } from '../../servicos/formatacao';
import { cores, espaco, fontes, raio } from '../../tema/tokens';

export default function AgendamentoConcluido({ navigation, route }) {
  const consultaId = route.params?.consultaId;
  const recurso = useRecurso(
    () => (consultaId ? api.agendamentos.buscar(consultaId) : Promise.resolve(null)),
    [consultaId]
  );
  const irPara = (aba) => navigation.navigate('Abas', { screen: aba });
  if (!consultaId) {
    return (
      <Tela>
        <EstadoVazio
          icone="calendar-check"
          titulo="Nada para mostrar aqui"
          acao="Ver minhas consultas"
          aoAgir={() => irPara('Consultas')}
        />
      </Tela>
    );
  }
  return (
    <Tela fundo={cores.gelo}>
      <ConteudoRemoto recurso={recurso}>
        {(consulta) => (
          <View style={estilos.centro} accessibilityLiveRegion="polite">
            <View style={estilos.selo}>
              <Icon source="check-bold" size={48} color="#ffffff" />
            </View>
            <Text style={estilos.titulo} accessibilityRole="header">
              Consulta agendada!
            </Text>
            <Text variant="bodyLarge" style={estilos.texto}>
              {consulta.medico_nome} ({consulta.medico_especialidade})
            </Text>
            <Text variant="titleMedium" style={estilos.quando}>
              {dataPorExtenso(consulta.data)}, às {consulta.hora}
            </Text>
          </View>
        )}
      </ConteudoRemoto>
      <View style={estilos.acoes}>
        <BotaoPrincipal onPress={() => irPara('Consultas')}>Ver minhas consultas</BotaoPrincipal>
        <BotaoSecundario onPress={() => irPara('Inicio')}>Voltar ao início</BotaoSecundario>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    gap: espaco.sm,
    marginTop: espaco.xl,
    backgroundColor: cores.superficie,
    borderRadius: raio.cartao,
    padding: espaco.lg,
  },
  selo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: cores.sucesso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fontes.negrito, fontSize: 26, color: cores.marinhoEscuro },
  texto: { color: cores.textoSecundario, textAlign: 'center' },
  quando: { color: cores.marinho, textAlign: 'center' },
  acoes: { gap: espaco.sm, marginTop: 'auto' },
});
