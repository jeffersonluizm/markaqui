// Estado da sessão: quem está logado, com qual papel. Restaura o token guardado
// ao abrir o app e sai sozinho quando a API diz que a sessão acabou.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, sessaoHttp } from '../servicos/api';
import { guardaToken } from '../servicos/guardaToken';

const ContextoSessao = createContext(null);
const INICIAL = { carregando: true, usuario: null, aviso: null, erroInicial: null };

export function ProvedorSessao({ children }) {
  const [estado, setEstado] = useState(INICIAL);

  const encerrar = useCallback(async (aviso = null) => {
    sessaoHttp.definirToken(null);
    await guardaToken.apagar();
    setEstado({ ...INICIAL, carregando: false, aviso });
  }, []);

  const iniciarSessao = useCallback(async ({ token, usuario }) => {
    sessaoHttp.definirToken(token);
    await guardaToken.gravar(token);
    setEstado({ ...INICIAL, carregando: false, usuario });
  }, []);

  // Ao abrir: se há token guardado, confere com a API quem é o usuário. Sem
  // conexão, o token fica guardado e a tela inicial oferece "tentar de novo".
  const restaurar = useCallback(async () => {
    setEstado(INICIAL);
    const token = await guardaToken.ler();
    if (!token) {
      setEstado({ ...INICIAL, carregando: false });
      return;
    }
    sessaoHttp.definirToken(token);
    try {
      const usuario = await api.auth.eu();
      setEstado({ ...INICIAL, carregando: false, usuario });
    } catch (erro) {
      if (erro.status === 401) await encerrar('Sua sessão expirou. Entre novamente.');
      else setEstado({ ...INICIAL, carregando: false, erroInicial: erro });
    }
  }, [encerrar]);

  useEffect(() => {
    sessaoHttp.aoPerderSessao((mensagem) => encerrar(mensagem));
    restaurar();
  }, [encerrar, restaurar]);

  const valor = useMemo(
    () => ({
      ...estado,
      entrar: async (email, senha) => iniciarSessao(await api.auth.entrar(email, senha)),
      cadastrar: async (dados) => iniciarSessao(await api.auth.cadastrar(dados)),
      sair: () => encerrar(null),
      // Depois de trocar a senha a API devolve um token novo (os antigos deixam de valer).
      renovarToken: async (token) => {
        sessaoHttp.definirToken(token);
        await guardaToken.gravar(token);
      },
      tentarDeNovo: restaurar,
      atualizarUsuario: (usuario) => setEstado((atual) => ({ ...atual, usuario })),
      limparAviso: () => setEstado((atual) => ({ ...atual, aviso: null })),
    }),
    [estado, iniciarSessao, encerrar, restaurar]
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao() {
  const contexto = useContext(ContextoSessao);
  if (!contexto) throw new Error('useSessao precisa estar dentro de ProvedorSessao');
  return contexto;
}
