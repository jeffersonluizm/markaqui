// Avisos de sucesso/erro (Snackbar) e diálogo de confirmação próprio, no lugar
// de Alert.alert (que não funciona no navegador e não segue a identidade).
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Snackbar, Text } from 'react-native-paper';
import { cores, fontes } from '../tema/tokens';

const ContextoAvisos = createContext(null);

export function ProvedorAvisos({ children }) {
  const [aviso, setAviso] = useState(null);
  const [dialogo, setDialogo] = useState(null);
  const resolverDialogo = useRef(null);

  const mostrar = useCallback((mensagem, tipo = 'sucesso') => setAviso({ mensagem, tipo, chave: Date.now() }), []);

  // confirmar({ titulo, mensagem, confirmar, cancelar, destrutivo }) => Promise<boolean>
  const confirmar = useCallback(
    (opcoes) =>
      new Promise((resolve) => {
        // Um diálogo novo responde "não" ao que estava aberto (nenhuma promessa fica pendurada).
        resolverDialogo.current?.(false);
        resolverDialogo.current = resolve;
        setDialogo(opcoes);
      }),
    []
  );

  const fecharDialogo = (resposta) => {
    setDialogo(null);
    resolverDialogo.current?.(resposta);
    resolverDialogo.current = null;
  };

  const valor = useMemo(() => ({ mostrar, confirmar }), [mostrar, confirmar]);
  const erro = aviso?.tipo === 'erro';

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <Portal>
        <Dialog visible={Boolean(dialogo)} onDismiss={() => fecharDialogo(false)} style={estilos.dialogo}>
          {dialogo && (
            <>
              <Dialog.Title style={estilos.tituloDialogo} accessibilityRole="header">
                {dialogo.titulo}
              </Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={estilos.textoDialogo}>
                  {dialogo.mensagem}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => fecharDialogo(false)} contentStyle={estilos.botao}>
                  {dialogo.cancelar || 'Voltar'}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => fecharDialogo(true)}
                  buttonColor={dialogo.destrutivo ? cores.erro : cores.marinho}
                  contentStyle={estilos.botao}
                >
                  {dialogo.confirmar || 'Confirmar'}
                </Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>
        <Snackbar
          key={aviso?.chave}
          visible={Boolean(aviso)}
          onDismiss={() => setAviso(null)}
          duration={erro ? 6000 : 3500}
          style={[estilos.snackbar, erro && estilos.snackbarErro]}
          action={{ label: 'Fechar', textColor: cores.gelo, onPress: () => setAviso(null) }}
          accessibilityLiveRegion="polite"
          role="alert"
        >
          {aviso?.mensagem}
        </Snackbar>
      </Portal>
    </ContextoAvisos.Provider>
  );
}

export function useAvisos() {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) throw new Error('useAvisos precisa estar dentro de ProvedorAvisos');
  return contexto;
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: cores.superficie, borderRadius: 18, maxWidth: 480, width: '90%', alignSelf: 'center' },
  tituloDialogo: { fontFamily: fontes.seminegrito, color: cores.marinhoEscuro },
  textoDialogo: { color: cores.textoSecundario, lineHeight: 22 },
  botao: { minHeight: 44, paddingHorizontal: 8 },
  snackbar: { backgroundColor: cores.marinhoEscuro, borderRadius: 12, marginBottom: 16 },
  snackbarErro: { backgroundColor: cores.erro },
});
