// Moldura das telas: fundo da identidade, largura máxima confortável no navegador
// e teclado que não cobre os campos.
import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { cores, espaco, fontes } from '../tema/tokens';

export function Tela({
  children,
  rolavel = true,
  fundo = cores.fundo,
  semCabecalho = false,
  atualizando,
  aoAtualizar,
  estilo,
}) {
  const conteudo = <View style={[estilos.coluna, estilo]}>{children}</View>;
  const corpo = rolavel ? (
    <ScrollView
      contentContainerStyle={estilos.rolagem}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        aoAtualizar ? (
          <RefreshControl
            refreshing={Boolean(atualizando)}
            onRefresh={aoAtualizar}
            colors={[cores.marinho]}
            tintColor={cores.marinho}
          />
        ) : undefined
      }
    >
      {conteudo}
    </ScrollView>
  ) : (
    conteudo
  );
  return (
    <SafeAreaView
      style={[estilos.raiz, { backgroundColor: fundo }]}
      edges={semCabecalho ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {corpo}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Título de seção acessível (lido como cabeçalho pelo leitor de tela).
export function TituloSecao({ children, acao }) {
  return (
    <View style={estilos.tituloSecao}>
      <Text variant="titleMedium" accessibilityRole="header" style={estilos.textoTituloSecao}>
        {children}
      </Text>
      {acao}
    </View>
  );
}

export function TituloTela({ titulo, subtitulo }) {
  return (
    <View style={estilos.tituloTela}>
      <Text variant="headlineSmall" accessibilityRole="header" style={estilos.textoTituloTela}>
        {titulo}
      </Text>
      {subtitulo ? (
        <Text variant="bodyMedium" style={estilos.subtitulo}>
          {subtitulo}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1 },
  rolagem: { flexGrow: 1 },
  coluna: { flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: espaco.md, gap: espaco.md },
  tituloSecao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: espaco.xs },
  textoTituloSecao: { color: cores.marinhoEscuro, fontFamily: fontes.seminegrito },
  tituloTela: { gap: espaco.xxs },
  textoTituloTela: { color: cores.marinhoEscuro },
  subtitulo: { color: cores.textoSecundario },
});
