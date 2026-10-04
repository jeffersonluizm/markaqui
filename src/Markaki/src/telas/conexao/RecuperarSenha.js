// Recuperar senha, de forma honesta: o Markaqui ainda não envia e-mail, então a
// tela explica o caminho real em vez de fingir um envio.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { BotaoPrincipal } from '../../componentes/Formulario';
import { cores, espaco, raio } from '../../tema/tokens';

const PASSOS = [
  'Fale com a recepção da clínica pelo telefone ou pessoalmente.',
  'Confirme seus dados (nome e e-mail do cadastro).',
  'A administração do sistema redefine o seu acesso. Depois, troque a senha em Perfil, Trocar senha.',
];

export default function RecuperarSenha({ navigation }) {
  return (
    <Tela>
      <TituloTela titulo="Esqueceu a senha?" />
      <View style={estilos.aviso}>
        <Icon source="email-off-outline" size={28} color={cores.aviso} />
        <Text variant="bodyMedium" style={estilos.textoAviso}>
          Esta versão do Markaqui ainda não envia e-mails. Por isso não existe um link automático de recuperação.
        </Text>
      </View>
      <Text variant="titleMedium" style={estilos.subtitulo} accessibilityRole="header">
        Como recuperar o acesso
      </Text>
      {PASSOS.map((passo, i) => (
        <View key={passo} style={estilos.passo}>
          <View style={estilos.numero}>
            <Text style={estilos.textoNumero}>{i + 1}</Text>
          </View>
          <Text variant="bodyMedium" style={estilos.textoPasso}>
            {passo}
          </Text>
        </View>
      ))}
      <Text variant="bodySmall" style={estilos.nota}>
        Lembrou a senha e quer trocá-la? Entre e use Perfil, Trocar senha.
      </Text>
      <BotaoPrincipal onPress={() => navigation.navigate('Entrar')} style={estilos.botao}>
        Voltar para o login
      </BotaoPrincipal>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  aviso: { flexDirection: 'row', gap: espaco.sm, padding: espaco.md, backgroundColor: cores.avisoFundo, borderRadius: raio.cartao, alignItems: 'center' },
  textoAviso: { flex: 1, color: cores.aviso },
  subtitulo: { color: cores.marinhoEscuro },
  passo: { flexDirection: 'row', gap: espaco.sm, alignItems: 'center' },
  numero: { width: 32, height: 32, borderRadius: 16, backgroundColor: cores.marinho, alignItems: 'center', justifyContent: 'center' },
  textoNumero: { color: '#ffffff', fontWeight: '700' },
  textoPasso: { flex: 1, color: cores.texto },
  nota: { color: cores.textoSecundario },
  botao: { marginTop: 'auto' },
});
