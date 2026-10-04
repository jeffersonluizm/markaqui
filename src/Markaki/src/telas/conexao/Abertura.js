// Splash do app: aparece enquanto a sessão guardada é conferida com a API.
// Sem conexão, oferece tentar de novo (o token continua guardado).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Marca } from '../../componentes/Logo';
import { EstadoErro } from '../../componentes/Estados';
import { useSessao } from '../../contexto/Sessao';
import { cores, espaco, fontes } from '../../tema/tokens';

export default function Abertura() {
  const { erroInicial, tentarDeNovo } = useSessao();
  return (
    <View style={estilos.raiz}>
      <Marca tamanho={96} />
      <Text style={estilos.nome} accessibilityRole="header">
        Markaqui
      </Text>
      {erroInicial ? (
        <View style={estilos.erro}>
          <EstadoErro erro={erroInicial} aoTentarDeNovo={tentarDeNovo} />
        </View>
      ) : (
        <ActivityIndicator color={cores.marinho} accessibilityLabel="Abrindo o Markaqui" />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md, backgroundColor: cores.gelo, padding: espaco.lg },
  nome: { fontFamily: fontes.negrito, fontSize: 32, color: cores.marinhoEscuro, letterSpacing: -0.5 },
  erro: { maxWidth: 480, width: '100%' },
});
