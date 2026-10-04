// Estados de toda lista ou tela que depende da API: carregando, vazio, erro
// (sem conexão, sem permissão, não encontrado ou falha genérica).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';
import { ehErroDeConexao } from '../servicos/cliente';
import { API_URL } from '../servicos/api';
import { cores, espaco, raio, ALVO_MINIMO } from '../tema/tokens';

export function EstadoCarregando({ mensagem = 'Carregando...' }) {
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite" accessibilityLabel={mensagem}>
      <ActivityIndicator size="large" color={cores.marinho} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensagem}
      </Text>
    </View>
  );
}

export function EstadoVazio({ icone = 'calendar-blank-outline', titulo, descricao, acao, aoAgir }) {
  return (
    <View style={estilos.centro}>
      <View style={estilos.bolha}>
        <Icon source={icone} size={40} color={cores.marinho} />
      </View>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {descricao ? (
        <Text variant="bodyMedium" style={estilos.texto}>
          {descricao}
        </Text>
      ) : null}
      {acao ? (
        <Button mode="contained" onPress={aoAgir} style={estilos.botao} contentStyle={estilos.conteudoBotao}>
          {acao}
        </Button>
      ) : null}
    </View>
  );
}

function descreverErro(erro) {
  if (ehErroDeConexao(erro)) {
    return {
      icone: 'wifi-off',
      titulo: 'Sem conexão com o servidor',
      descricao: __DEV__
        ? `${erro.message} O app procura a API em ${API_URL}. Confira se ela está rodando e o EXPO_PUBLIC_API_URL do .env.`
        : erro.message,
    };
  }
  if (erro?.status === 403) {
    return { icone: 'lock-outline', titulo: 'Sem permissão', descricao: 'Esta área é de outro tipo de conta.' };
  }
  if (erro?.status === 404) {
    return { icone: 'file-question-outline', titulo: 'Não encontrado', descricao: erro.message };
  }
  return { icone: 'alert-circle-outline', titulo: 'Algo deu errado', descricao: erro?.message || 'Tente de novo em instantes.' };
}

export function EstadoErro({ erro, aoTentarDeNovo }) {
  const { icone, titulo, descricao } = descreverErro(erro);
  return (
    <View style={estilos.centro} accessibilityLiveRegion="assertive">
      <View style={[estilos.bolha, estilos.bolhaErro]}>
        <Icon source={icone} size={40} color={cores.erro} />
      </View>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        {descricao}
      </Text>
      {aoTentarDeNovo ? (
        <Button mode="contained" icon="refresh" onPress={aoTentarDeNovo} style={estilos.botao} contentStyle={estilos.conteudoBotao}>
          Tentar de novo
        </Button>
      ) : null}
    </View>
  );
}

// Escolhe o estado certo para um recurso de useRecurso; com dados, desenha os filhos.
export function ConteudoRemoto({ recurso, vazio, mensagemCarregando, children }) {
  if (recurso.carregando && !recurso.dados) return <EstadoCarregando mensagem={mensagemCarregando} />;
  if (recurso.erro && !recurso.dados) return <EstadoErro erro={recurso.erro} aoTentarDeNovo={recurso.recarregar} />;
  if (!recurso.dados) return null;
  const estaVazio = Array.isArray(recurso.dados) && recurso.dados.length === 0;
  const conteudo = estaVazio && vazio ? <EstadoVazio {...vazio} /> : children(recurso.dados);
  if (!recurso.erro) return conteudo;
  // Falhou ao atualizar, mas há dados anteriores: mostra os dados e avisa.
  return (
    <>
      <View style={estilos.faixa} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Icon source="cloud-alert" size={20} color={cores.aviso} />
        <Text variant="bodySmall" style={estilos.textoFaixa}>
          Não foi possível atualizar. Mostrando os últimos dados.
        </Text>
        <Button compact onPress={recurso.recarregar} textColor={cores.aviso}>
          Tentar
        </Button>
      </View>
      {conteudo}
    </>
  );
}

const estilos = StyleSheet.create({
  centro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.xl, gap: espaco.sm },
  bolha: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: cores.gelo,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco.xs,
  },
  bolhaErro: { backgroundColor: cores.erroFundo },
  titulo: { color: cores.marinhoEscuro, textAlign: 'center' },
  texto: { color: cores.textoSecundario, textAlign: 'center', maxWidth: 420 },
  botao: { marginTop: espaco.sm, borderRadius: raio.pilula },
  conteudoBotao: { minHeight: ALVO_MINIMO, paddingHorizontal: espaco.sm },
  faixa: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, backgroundColor: cores.avisoFundo, borderRadius: 12, paddingLeft: espaco.sm },
  textoFaixa: { flex: 1, color: cores.aviso },
});
