// Campos e botões com rótulo visível, mensagem de erro anunciada pelo leitor de
// tela e alvo de toque de pelo menos 48 dp.
import React, { forwardRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';
import { cores, espaco, raio, ALVO_MINIMO } from '../tema/tokens';

export const Campo = forwardRef(function Campo({ rotulo, erro, ajuda, style, ...props }, ref) {
  return (
    <View>
      <TextInput
        ref={ref}
        mode="outlined"
        label={rotulo}
        accessibilityLabel={rotulo}
        error={Boolean(erro)}
        outlineStyle={estilos.contorno}
        style={[estilos.campo, style]}
        outlineColor={cores.borda}
        activeOutlineColor={cores.marinho}
        {...props}
      />
      {erro || ajuda ? (
        <HelperText type={erro ? 'error' : 'info'} visible accessibilityLiveRegion="polite" role={erro ? 'alert' : undefined}>
          {erro || ajuda}
        </HelperText>
      ) : null}
    </View>
  );
});

export const CampoSenha = forwardRef(function CampoSenha(props, ref) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Campo
      ref={ref}
      secureTextEntry={!visivel}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      right={
        <TextInput.Icon
          icon={visivel ? 'eye-off-outline' : 'eye-outline'}
          onPress={() => setVisivel((v) => !v)}
          accessibilityLabel={visivel ? 'Esconder senha' : 'Mostrar senha'}
          forceTextInputFocus={false}
        />
      }
      {...props}
    />
  );
});

export function BotaoPrincipal({ children, style, ...props }) {
  return (
    <Button mode="contained" style={[estilos.botao, style]} contentStyle={estilos.conteudoBotao} labelStyle={estilos.rotulo} {...props}>
      {children}
    </Button>
  );
}

export function BotaoSecundario({ children, style, ...props }) {
  return (
    <Button
      mode="outlined"
      style={[estilos.botao, estilos.botaoSecundario, style]}
      contentStyle={estilos.conteudoBotao}
      labelStyle={estilos.rotulo}
      {...props}
    >
      {children}
    </Button>
  );
}

export function BotaoTexto({ children, style, ...props }) {
  return (
    <Button mode="text" style={style} contentStyle={estilos.conteudoTexto} {...props}>
      {children}
    </Button>
  );
}

const estilos = StyleSheet.create({
  campo: { backgroundColor: cores.superficie },
  contorno: { borderRadius: raio.campo },
  botao: { borderRadius: raio.pilula },
  botaoSecundario: { borderColor: cores.marinho, borderWidth: 1.5 },
  conteudoBotao: { minHeight: ALVO_MINIMO + 4, paddingHorizontal: espaco.sm },
  conteudoTexto: { minHeight: ALVO_MINIMO },
  rotulo: { fontSize: 16, letterSpacing: 0.2 },
});
