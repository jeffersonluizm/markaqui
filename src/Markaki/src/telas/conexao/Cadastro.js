// Cadastro de paciente (a única conta que se cria pelo app).
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Checkbox, Icon, Text } from 'react-native-paper';
import { Tela, TituloTela } from '../../componentes/Tela';
import { Campo, CampoSenha, BotaoPrincipal, BotaoTexto } from '../../componentes/Formulario';
import { useSessao } from '../../contexto/Sessao';
import { validarCadastro, semErros } from '../../servicos/validacao';
import { cores, espaco, ALVO_MINIMO } from '../../tema/tokens';

export default function Cadastro({ navigation }) {
  const { cadastrar } = useSessao();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', confirmacao: '', aceite: false });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  async function enviar() {
    const encontrados = validarCadastro(form);
    setErros(encontrados);
    setErroGeral(null);
    if (!semErros(encontrados)) return;
    setEnviando(true);
    try {
      await cadastrar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone,
        senha: form.senha,
        aceite_termos: form.aceite,
      });
    } catch (erro) {
      setErroGeral(erro.message);
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <TituloTela titulo="Criar conta de paciente" subtitulo="Leva menos de um minuto." />
      <Campo
        rotulo="Nome completo"
        value={form.nome}
        onChangeText={mudar('nome')}
        erro={erros.nome}
        autoComplete="name"
        textContentType="name"
      />
      <Campo
        rotulo="E-mail"
        value={form.email}
        onChangeText={mudar('email')}
        erro={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Campo
        rotulo="Celular com DDD (opcional)"
        value={form.telefone}
        onChangeText={mudar('telefone')}
        erro={erros.telefone}
        keyboardType="phone-pad"
        autoComplete="tel"
        ajuda="A clínica usa para avisar sobre a consulta."
      />
      <CampoSenha
        rotulo="Senha"
        value={form.senha}
        onChangeText={mudar('senha')}
        erro={erros.senha}
        ajuda="Pelo menos 8 caracteres, com letras e números."
        autoComplete="new-password"
      />
      <CampoSenha
        rotulo="Repita a senha"
        value={form.confirmacao}
        onChangeText={mudar('confirmacao')}
        erro={erros.confirmacao}
        autoComplete="new-password"
      />

      <View>
        <Pressable
          style={estilos.aceite}
          onPress={() => mudar('aceite')(!form.aceite)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.aceite }}
          accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
        >
          <Checkbox.Android status={form.aceite ? 'checked' : 'unchecked'} color={cores.marinho} />
          <Text style={estilos.textoAceite}>Li e aceito os termos de uso e a política de privacidade</Text>
        </Pressable>
        <BotaoTexto onPress={() => navigation.navigate('Termos')} style={estilos.linkTermos}>
          Ler os termos
        </BotaoTexto>
        {erros.aceite ? (
          <Text style={estilos.erro} accessibilityRole="alert">
            {erros.aceite}
          </Text>
        ) : null}
      </View>

      {erroGeral ? (
        <View style={estilos.faixaErro} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Icon source="alert-circle-outline" size={20} color={cores.erro} />
          <Text style={estilos.erro}>{erroGeral}</Text>
        </View>
      ) : null}

      <BotaoPrincipal onPress={enviar} loading={enviando} disabled={enviando}>
        Criar conta
      </BotaoPrincipal>
      <BotaoTexto onPress={() => navigation.navigate('Entrar')}>Já tenho conta</BotaoTexto>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  aceite: { flexDirection: 'row', alignItems: 'center', minHeight: ALVO_MINIMO, gap: 4 },
  textoAceite: { flex: 1, color: cores.texto },
  linkTermos: { alignSelf: 'flex-start' },
  erro: { color: cores.erro, flex: 1 },
  faixaErro: {
    flexDirection: 'row',
    gap: espaco.xs,
    alignItems: 'center',
    padding: espaco.sm,
    borderRadius: 12,
    backgroundColor: cores.erroFundo,
  },
});
