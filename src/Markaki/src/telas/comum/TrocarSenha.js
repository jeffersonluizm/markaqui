import React, { useState } from 'react';
import { Tela, TituloTela } from '../../componentes/Tela';
import { CampoSenha, BotaoPrincipal } from '../../componentes/Formulario';
import { useAvisos } from '../../contexto/Avisos';
import { useSessao } from '../../contexto/Sessao';
import { api } from '../../servicos/api';
import { validarTrocaDeSenha, semErros } from '../../servicos/validacao';

export default function TrocarSenha({ navigation }) {
  const { mostrar } = useAvisos();
  const { renovarToken } = useSessao();
  const [form, setForm] = useState({ atual: '', nova: '', confirmacao: '' });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const mudar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar() {
    const encontrados = validarTrocaDeSenha(form);
    setErros(encontrados);
    if (!semErros(encontrados)) return;
    setEnviando(true);
    try {
      const { token } = await api.auth.trocarSenha(form.atual, form.nova);
      await renovarToken(token);
      mostrar('Senha alterada. As outras sessões foram encerradas.');
      navigation.goBack();
    } catch (erro) {
      if (erro.status === 400) setErros({ atual: erro.message });
      else mostrar(erro.message, 'erro');
      setEnviando(false);
    }
  }

  return (
    <Tela>
      <TituloTela titulo="Trocar senha" subtitulo="Use pelo menos 8 caracteres, com letras e números." />
      <CampoSenha rotulo="Senha atual" value={form.atual} onChangeText={mudar('atual')} erro={erros.atual} autoComplete="current-password" />
      <CampoSenha rotulo="Nova senha" value={form.nova} onChangeText={mudar('nova')} erro={erros.nova} autoComplete="new-password" />
      <CampoSenha rotulo="Repita a nova senha" value={form.confirmacao} onChangeText={mudar('confirmacao')} erro={erros.confirmacao} autoComplete="new-password" />
      <BotaoPrincipal onPress={enviar} loading={enviando} disabled={enviando}>
        Salvar nova senha
      </BotaoPrincipal>
    </Tela>
  );
}
