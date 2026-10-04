// Primeira tela (onboarding): o que é o Markaqui, missão, visão e valores dos
// protótipos da equipe, e o caminho para começar.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Logo } from '../../componentes/Logo';
import { Tela } from '../../componentes/Tela';
import { BotaoPrincipal, BotaoSecundario, BotaoTexto } from '../../componentes/Formulario';
import { cores, espaco, fontes, raio } from '../../tema/tokens';

const PILARES = [
  { icone: 'handshake-outline', titulo: 'Nossa missão', texto: 'Simplificar a gestão de horários e conectar pacientes e clínica sem conflitos.' },
  { icone: 'calendar-clock-outline', titulo: 'Nossa visão', texto: 'Cada agendamento simples, com o tempo de todos valorizado e bem aproveitado.' },
  { icone: 'shield-check-outline', titulo: 'Nossos valores', texto: 'Praticidade, autonomia e transparência.' },
];

export default function BoasVindas({ navigation }) {
  return (
    <Tela fundo={cores.gelo} semCabecalho>
      <View style={estilos.topo}>
        <Logo tamanho={44} />
        <BotaoTexto onPress={() => navigation.navigate('Sobre')} accessibilityHint="Abre a página sobre o projeto">
          Sobre
        </BotaoTexto>
      </View>

      <View style={estilos.chamada}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Sua consulta marcada em poucos toques
        </Text>
        <Text variant="bodyLarge" style={estilos.subtitulo}>
          Veja os horários livres dos médicos da clínica, agende na hora e acompanhe tudo pelo celular.
        </Text>
      </View>

      <View style={estilos.pilares}>
        {PILARES.map((p) => (
          <View key={p.titulo} style={estilos.pilar} accessible accessibilityLabel={`${p.titulo}. ${p.texto}`}>
            <View style={estilos.icone}>
              <Icon source={p.icone} size={28} color={cores.marinho} />
            </View>
            <View style={estilos.textoPilar}>
              <Text variant="titleMedium" style={estilos.tituloPilar}>
                {p.titulo}
              </Text>
              <Text variant="bodyMedium" style={estilos.descricao}>
                {p.texto}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={estilos.acoes}>
        <BotaoPrincipal onPress={() => navigation.navigate('EscolhaPerfil')}>Começar</BotaoPrincipal>
        <BotaoSecundario onPress={() => navigation.navigate('Entrar')}>Já tenho conta</BotaoSecundario>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chamada: { gap: espaco.sm, marginTop: espaco.lg },
  titulo: { fontFamily: fontes.negrito, fontSize: 30, lineHeight: 36, color: cores.marinhoEscuro, letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSecundario, lineHeight: 24 },
  pilares: { gap: espaco.sm, marginTop: espaco.sm },
  pilar: {
    flexDirection: 'row',
    gap: espaco.md,
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: raio.cartao,
    borderWidth: 2,
    borderColor: cores.marinho,
    padding: espaco.md,
  },
  icone: { width: 52, height: 52, borderRadius: 26, backgroundColor: cores.gelo, alignItems: 'center', justifyContent: 'center' },
  textoPilar: { flex: 1, gap: 2 },
  tituloPilar: { color: cores.marinhoEscuro },
  descricao: { color: cores.textoSecundario },
  acoes: { gap: espaco.sm, marginTop: 'auto', paddingTop: espaco.lg },
});
