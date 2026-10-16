// "Como você quer usar o Markaqui?" (wireframe tipoperfil.png). Paciente cria a
// própria conta; a conta da clínica é criada pela administração, então a clínica
// só entra.
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { BotaoPrincipal } from '../../componentes/Formulario';
import { cores, espaco, raio } from '../../tema/tokens';

const PERFIS = [
  {
    valor: 'paciente',
    icone: 'account-heart-outline',
    titulo: 'Sou paciente',
    texto: 'Quero agendar e acompanhar minhas consultas.',
  },
  {
    valor: 'clinica',
    icone: 'hospital-building',
    titulo: 'Sou da clínica',
    texto: 'Quero administrar médicos, agenda e consultas.',
  },
];

export default function EscolhaPerfil({ navigation }) {
  const [perfil, setPerfil] = useState(null);
  const continuar = () =>
    perfil === 'paciente' ? navigation.navigate('Cadastro') : navigation.navigate('Entrar', { perfil: 'clinica' });

  return (
    <Tela fundo={cores.gelo}>
      <TituloTela titulo="Como você quer usar o Markaqui?" subtitulo="Escolha seu perfil para continuar." />
      <View style={estilos.lista} accessibilityRole="radiogroup">
        {PERFIS.map((p) => {
          const ativo = perfil === p.valor;
          return (
            <Pressable
              key={p.valor}
              onPress={() => setPerfil(p.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`${p.titulo}. ${p.texto}`}
              style={[estilos.cartao, ativo && estilos.cartaoAtivo]}
            >
              <View style={[estilos.icone, ativo && estilos.iconeAtivo]}>
                <Icon source={p.icone} size={32} color={ativo ? '#ffffff' : cores.marinho} />
              </View>
              <View style={estilos.texto}>
                <Text variant="titleLarge" style={estilos.titulo}>
                  {p.titulo}
                </Text>
                <Text variant="bodyMedium" style={estilos.descricao}>
                  {p.texto}
                </Text>
              </View>
              <Icon source={ativo ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={cores.marinho} />
            </Pressable>
          );
        })}
      </View>
      {perfil === 'clinica' ? (
        <Text variant="bodyMedium" style={estilos.nota}>
          Contas da clínica são criadas pela administração do sistema. Use o e-mail e a senha que você recebeu.
        </Text>
      ) : null}
      <BotaoPrincipal disabled={!perfil} onPress={continuar} style={estilos.botao}>
        Continuar
      </BotaoPrincipal>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.md, marginTop: espaco.sm },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    padding: espaco.md,
    borderRadius: raio.cartao,
    borderWidth: 2,
    borderColor: cores.marinho,
    backgroundColor: cores.superficie,
    minHeight: 96,
  },
  cartaoAtivo: { backgroundColor: cores.selecionado, borderColor: cores.marinhoEscuro, borderWidth: 3 },
  icone: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: cores.gelo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeAtivo: { backgroundColor: cores.marinho },
  texto: { flex: 1, gap: 2 },
  titulo: { color: cores.marinhoEscuro },
  descricao: { color: cores.textoSecundario },
  nota: { color: cores.textoSecundario, backgroundColor: cores.superficie, padding: espaco.md, borderRadius: 12 },
  botao: { marginTop: 'auto' },
});
