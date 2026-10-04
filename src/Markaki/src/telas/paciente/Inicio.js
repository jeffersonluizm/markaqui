// Início da paciente: saudação, próxima consulta e atalhos por especialidade.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Tela, TituloSecao } from '../../componentes/Tela';
import { CartaoConsulta } from '../../componentes/Cartoes';
import { EstadoErro, EstadoCarregando } from '../../componentes/Estados';
import { BotaoPrincipal } from '../../componentes/Formulario';
import { ChipsFiltro } from '../../componentes/Seletores';
import { useSessao } from '../../contexto/Sessao';
import { useRecurso } from '../../hooks/useRecurso';
import { api } from '../../servicos/api';
import { separarConsultas, especialidades } from '../../servicos/agenda';
import { saudacao } from '../../servicos/formatacao';
import { cores, espaco, fontes, raio } from '../../tema/tokens';

export default function Inicio({ navigation }) {
  const { usuario } = useSessao();
  const recurso = useRecurso(async () => {
    const [consultas, medicos] = await Promise.all([api.agendamentos.listar(), api.medicos.listar()]);
    return { consultas, medicos };
  });
  const primeiroNome = usuario.nome.split(' ')[0];

  let conteudo;
  if (recurso.carregando) conteudo = <EstadoCarregando mensagem="Buscando suas consultas..." />;
  else if (recurso.erro && !recurso.dados) conteudo = <EstadoErro erro={recurso.erro} aoTentarDeNovo={recurso.recarregar} />;
  else if (recurso.dados) {
    const { proximas } = separarConsultas(recurso.dados.consultas);
    const proxima = proximas[0];
    conteudo = (
      <>
        <TituloSecao>Sua próxima consulta</TituloSecao>
        {proxima ? (
          <>
            <CartaoConsulta consulta={proxima} aoTocar={() => navigation.navigate('DetalheConsulta', { id: proxima.id })} />
            {proximas.length > 1 ? (
              <Text variant="bodySmall" style={estilos.secundario}>
                E mais {proximas.length - 1} consulta(s) marcada(s) em Consultas.
              </Text>
            ) : null}
          </>
        ) : (
          <View style={estilos.vazio}>
            <Text variant="bodyMedium" style={estilos.secundario}>
              Você não tem consultas marcadas.
            </Text>
          </View>
        )}
        <BotaoPrincipal icon="calendar-plus" onPress={() => navigation.navigate('Profissionais')}>
          Agendar consulta
        </BotaoPrincipal>

        <TituloSecao>Especialidades</TituloSecao>
        <ChipsFiltro
          rotulo="Especialidades"
          opcoes={especialidades(recurso.dados.medicos).map((e) => ({ valor: e, rotulo: e }))}
          aoSelecionar={(especialidade) => navigation.navigate('Profissionais', { especialidade })}
        />
      </>
    );
  }

  return (
    <Tela atualizando={recurso.atualizando} aoAtualizar={recurso.recarregar}>
      <View style={estilos.boasVindas}>
        <Text style={estilos.ola}>{saudacao()},</Text>
        <Text style={estilos.nome} accessibilityRole="header">
          {primeiroNome}
        </Text>
      </View>
      {conteudo}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  boasVindas: { backgroundColor: cores.gelo, borderRadius: raio.cartao, padding: espaco.lg },
  ola: { fontFamily: fontes.media, fontSize: 18, color: cores.marinho },
  nome: { fontFamily: fontes.negrito, fontSize: 28, color: cores.marinhoEscuro },
  vazio: { backgroundColor: cores.superficie, borderRadius: raio.cartao, borderWidth: 1, borderColor: cores.bordaSuave, padding: espaco.md },
  secundario: { color: cores.textoSecundario },
});
