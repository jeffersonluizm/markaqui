// Raiz do app: fontes da marca, tema, sessão, avisos e navegação por papel.
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { tema, temaNavegacao } from './src/tema/tema';
import { cores } from './src/tema/tokens';
import { ProvedorSessao, useSessao } from './src/contexto/Sessao';
import { ProvedorAvisos } from './src/contexto/Avisos';
import { ErroGlobal } from './src/componentes/ErroGlobal';
import Navegacao, { linking } from './src/navegacao/Navegacao';
import Abertura from './src/telas/conexao/Abertura';

SplashScreen.preventAutoHideAsync().catch(() => {});

const temaNav = temaNavegacao(DefaultTheme);
const tituloDaAba = (opcoes, rota) => `${opcoes?.title || rota?.name || 'Markaqui'} · Markaqui`;

// A navegação só monta depois de conferir a sessão: assim o endereço aberto no
// navegador (ex.: /entrar) é aplicado à pilha certa, e não à tela de abertura.
function Conteudo() {
  const { carregando, erroInicial } = useSessao();
  if (carregando || erroInicial) return <Abertura />;
  return (
    <NavigationContainer theme={temaNav} linking={linking} documentTitle={{ formatter: tituloDaAba }}>
      <Navegacao />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontesProntas, erroFontes] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const pronto = fontesProntas || Boolean(erroFontes);

  const aoDesenhar = useCallback(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  if (!pronto) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={tema}>
        <View style={{ flex: 1, backgroundColor: cores.fundo }} onLayout={aoDesenhar}>
          <ErroGlobal>
            <ProvedorSessao>
              <ProvedorAvisos>
                <Conteudo />
              </ProvedorAvisos>
            </ProvedorSessao>
          </ErroGlobal>
          <StatusBar style="dark" />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
