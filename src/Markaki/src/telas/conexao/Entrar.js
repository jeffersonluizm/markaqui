// Login. Mostra o aviso de sessão expirada quando a API encerrou a sessão.
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { Campo, CampoSenha, BotaoPrincipal, BotaoTexto } from '../../componentes/Formulario';
import { Logo } from '../../componentes/Logo';
import { useSessao } from '../../contexto/Sessao';
import { validarEntrada, semErros } from '../../servicos/validacao';
import { cores, espaco, raio } from '../../tema/tokens';

// Contas de demonstração do "npm run semear" (valores do backend/.env.example).
// Só aparecem em desenvolvimento.
const DEMO = [
  { rotulo: 'Paciente', email: 'paciente@markaqui.demo', senha: 'Paciente2026' },
  { rotulo: 'Clínica', email: 'gestor@markaqui.demo', senha: 'Gestor2026' },
];

export default function Entrar({ navigation, route }) {
  const { entrar, aviso, limparAviso } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const campoSenha = useRef(null);
  const daClinica = route.params?.perfil === 'clinica';

  async function enviar() {
    const encontrados = validarEntrada({ email, senha });
    setErros(encontrados);
    setErroGeral(null);
    if (!semErros(encontrados)) return;
    setEnviando(true);
    try {
      limparAviso();
      await entrar(email.trim(), senha);
    } catch (erro) {
      setErroGeral(erro.message);
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <View style={estilos.logo}>
        <Logo tamanho={36} />
      </View>
      <TituloTela
        titulo={daClinica ? 'Entrar como clínica' : 'Entrar'}
        subtitulo={daClinica ? 'Use a conta criada pela administração.' : 'Que bom ter você de volta.'}
      />

      {aviso ? (
        <View style={[estilos.faixa, estilos.faixaAviso]} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Icon source="clock-alert-outline" size={20} color={cores.aviso} />
          <Text style={estilos.textoAviso}>{aviso}</Text>
        </View>
      ) : null}

      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => campoSenha.current?.focus()}
      />
      <CampoSenha
        ref={campoSenha}
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />

      {erroGeral ? (
        <View style={[estilos.faixa, estilos.faixaErro]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Icon source="alert-circle-outline" size={20} color={cores.erro} />
          <Text style={estilos.textoErro}>{erroGeral}</Text>
        </View>
      ) : null}

      <BotaoPrincipal onPress={enviar} loading={enviando} disabled={enviando}>
        Entrar
      </BotaoPrincipal>
      <View style={estilos.links}>
        <BotaoTexto onPress={() => navigation.navigate('RecuperarSenha')}>Esqueci minha senha</BotaoTexto>
        {!daClinica ? <BotaoTexto onPress={() => navigation.navigate('Cadastro')}>Criar conta</BotaoTexto> : null}
      </View>

      {__DEV__ ? (
        <View style={estilos.demo}>
          <Text variant="labelLarge" style={estilos.tituloDemo}>
            Contas de demonstração
          </Text>
          <View style={estilos.linhaDemo}>
            {DEMO.map((conta) => (
              <BotaoTexto
                key={conta.email}
                icon="account-arrow-right-outline"
                onPress={() => {
                  setEmail(conta.email);
                  setSenha(conta.senha);
                }}
                accessibilityHint={`Preenche o login com a conta de demonstração ${conta.rotulo}`}
              >
                {conta.rotulo}
              </BotaoTexto>
            ))}
          </View>
        </View>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  logo: { alignItems: 'center', marginVertical: espaco.md },
  faixa: { flexDirection: 'row', gap: espaco.xs, alignItems: 'center', padding: espaco.sm, borderRadius: 12 },
  faixaAviso: { backgroundColor: cores.avisoFundo },
  faixaErro: { backgroundColor: cores.erroFundo },
  textoAviso: { color: cores.aviso, flex: 1 },
  textoErro: { color: cores.erro, flex: 1 },
  links: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  demo: { borderWidth: 1, borderStyle: 'dashed', borderColor: cores.borda, borderRadius: raio.campo, padding: espaco.sm, gap: 4 },
  tituloDemo: { color: cores.textoSecundario },
  linhaDemo: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
});
