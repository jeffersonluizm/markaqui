// Logo do Markaqui: calendário com "check" sobre o quadrado marinho. A mesma
// geometria gera os ícones PNG (scripts/gerar-icones.js).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { cores, fontes } from '../tema/tokens';

export function Marca({ tamanho = 64 }) {
  return (
    <View aria-hidden style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 1024 1024">
        <Rect x="0" y="0" width="1024" height="1024" rx="224" fill={cores.marinho} />
        <Rect x="260" y="316" width="504" height="464" rx="52" fill="none" stroke="#ffffff" strokeWidth="56" />
        <Path d="M232 368a80 80 0 0 1 80-80h400a80 80 0 0 1 80 80v52H232z" fill="#ffffff" />
        <Rect x="352" y="220" width="64" height="120" rx="32" fill={cores.gelo} />
        <Rect x="608" y="220" width="64" height="120" rx="32" fill={cores.gelo} />
        <Path d="M372 610 478 708 668 500" fill="none" stroke={cores.gelo} strokeWidth="68" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// Marca + nome. `claro` para usar sobre fundo marinho.
export function Logo({ tamanho = 40, mostrarNome = true, claro = false }) {
  return (
    <View style={estilos.linha} accessible accessibilityRole="image" accessibilityLabel="Markaqui">
      <Marca tamanho={tamanho} />
      {mostrarNome && (
        <Text style={[estilos.nome, { fontSize: tamanho * 0.55, color: claro ? '#ffffff' : cores.marinhoEscuro }]}>
          Markaqui
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nome: { fontFamily: fontes.negrito, letterSpacing: -0.5 },
});
