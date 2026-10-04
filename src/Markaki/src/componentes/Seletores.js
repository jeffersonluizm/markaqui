// Seletores sem teclado: dia (faixa rolável), horas (grade) e filtros (chips).
// Substituem os campos de texto livre de data e hora.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { diaCurto, dataPorExtenso } from '../servicos/formatacao';
import { cores, espaco, fontes, raio, ALVO_MINIMO } from '../tema/tokens';

function Opcao({ selecionada, aoTocar, rotulo, rotuloAcessivel, desativada, largura }) {
  return (
    <Pressable
      onPress={aoTocar}
      disabled={desativada}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionada, disabled: desativada }}
      aria-selected={selecionada}
      aria-disabled={desativada}
      accessibilityLabel={rotuloAcessivel || rotulo}
      style={({ pressed }) => [
        estilos.opcao,
        largura && { minWidth: largura },
        selecionada && estilos.opcaoSelecionada,
        desativada && estilos.opcaoDesativada,
        pressed && !selecionada && estilos.opcaoPressionada,
      ]}
    >
      <Text style={[estilos.textoOpcao, selecionada && estilos.textoSelecionado]}>{rotulo}</Text>
    </Pressable>
  );
}

export function SeletorDia({ dias, selecionado, aoSelecionar, rotulo = 'Dia' }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.rolagem} contentContainerStyle={estilos.faixa}>
        {dias.map((dia) => (
          <Opcao
            key={dia}
            selecionada={dia === selecionado}
            aoTocar={() => aoSelecionar(dia)}
            rotulo={diaCurto(dia)}
            rotuloAcessivel={dataPorExtenso(dia)}
            largura={84}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// `selecionadas` pode ser uma hora (escolha única) ou uma lista (várias).
export function GradeHoras({ horas, selecionadas, aoAlternar, indisponiveis = [], rotulo = 'Horários' }) {
  const marcada = (h) => (Array.isArray(selecionadas) ? selecionadas.includes(h) : selecionadas === h);
  return (
    <View style={estilos.grade} accessibilityLabel={rotulo}>
      {horas.map((hora) => (
        <Opcao
          key={hora}
          selecionada={marcada(hora)}
          desativada={indisponiveis.includes(hora)}
          aoTocar={() => aoAlternar(hora)}
          rotulo={hora}
          rotuloAcessivel={indisponiveis.includes(hora) ? `${hora}, já existe` : hora}
          largura={76}
        />
      ))}
    </View>
  );
}

export function ChipsFiltro({ opcoes, selecionada, aoSelecionar, rotulo = 'Filtro' }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.rolagem} contentContainerStyle={estilos.faixa} accessibilityLabel={rotulo}>
      {opcoes.map((opcao) => (
        <Opcao key={opcao.valor} selecionada={opcao.valor === selecionada} aoTocar={() => aoSelecionar(opcao.valor)} rotulo={opcao.rotulo} />
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  // Faixa horizontal não cresce na vertical dentro de uma coluna flexível.
  rolagem: { flexGrow: 0 },
  faixa: { gap: espaco.xs, paddingVertical: 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
  opcao: {
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.md,
    borderRadius: raio.chip,
    borderWidth: 1.5,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoSelecionada: { backgroundColor: cores.marinho, borderColor: cores.marinho },
  opcaoDesativada: { opacity: 0.4 },
  opcaoPressionada: { backgroundColor: cores.selecionado },
  textoOpcao: { fontFamily: fontes.media, color: cores.marinhoEscuro, fontSize: 15 },
  textoSelecionado: { color: '#ffffff', fontFamily: fontes.seminegrito },
});
