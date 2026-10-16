// Página de erro genérico: se uma tela quebrar, a pessoa vê uma mensagem e um
// botão para recomeçar, em vez da tela branca.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Marca } from './Logo';
import { BotaoPrincipal } from './Formulario';
import { cores, espaco } from '../tema/tokens';

export class ErroGlobal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error('Erro na tela:', erro, info?.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <View style={estilos.raiz} accessibilityLiveRegion="assertive">
        <Marca tamanho={72} />
        <Text variant="headlineSmall" style={estilos.titulo} accessibilityRole="header">
          Algo deu errado
        </Text>
        <Text variant="bodyMedium" style={estilos.texto}>
          O Markaqui encontrou um problema inesperado. Seus dados estão salvos no servidor.
        </Text>
        <BotaoPrincipal icon="restart" onPress={() => this.setState({ erro: null })}>
          Recomeçar
        </BotaoPrincipal>
      </View>
    );
  }
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.xl,
    gap: espaco.md,
    backgroundColor: cores.gelo,
  },
  titulo: { color: cores.marinhoEscuro, textAlign: 'center' },
  texto: { color: cores.textoSecundario, textAlign: 'center', maxWidth: 420 },
});
