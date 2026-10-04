// Termos de uso e privacidade (texto do protótipo "contrato", completado com o
// que o app realmente guarda).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { cores, espaco } from '../../tema/tokens';

const SECOES = [
  {
    titulo: 'Uso do serviço',
    texto:
      'O Markaqui permite agendar, acompanhar e cancelar consultas na clínica. Ao criar a conta, você concorda em usar o aplicativo de acordo com as leis aplicáveis e com estes termos.',
  },
  {
    titulo: 'Dados que guardamos',
    texto:
      'Nome, e-mail, telefone (opcional) e o histórico das suas consultas. A senha é guardada só como hash (bcrypt): ninguém da clínica consegue lê-la.',
  },
  {
    titulo: 'Quem vê seus dados',
    texto:
      'Você vê apenas as suas consultas. A equipe da clínica vê os agendamentos para organizar a agenda. Outros pacientes nunca veem seus dados.',
  },
  {
    titulo: 'Cancelamento',
    texto:
      'Você pode cancelar uma consulta até o horário marcado. O cancelamento fica registrado no histórico, com data e quem cancelou.',
  },
  {
    titulo: 'Seus direitos (LGPD)',
    texto:
      'Você pode pedir à clínica acesso, correção ou exclusão dos seus dados. Podemos atualizar estes termos e avisaremos sobre mudanças importantes.',
  },
];

export default function Termos() {
  return (
    <Tela>
      <TituloTela titulo="Termos de uso e privacidade" subtitulo="Versão 2.0, outubro de 2026." />
      {SECOES.map((s) => (
        <View key={s.titulo} style={estilos.secao}>
          <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
            {s.titulo}
          </Text>
          <Text variant="bodyMedium" style={estilos.texto}>
            {s.texto}
          </Text>
        </View>
      ))}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  secao: { gap: espaco.xxs },
  titulo: { color: cores.marinhoEscuro },
  texto: { color: cores.textoSecundario, lineHeight: 22 },
});
