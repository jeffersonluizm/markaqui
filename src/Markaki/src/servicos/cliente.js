// Cliente HTTP da API: põe o token, aplica timeout, transforma erro da API em
// Error com status e avisa quando a sessão acabou (401 com token).
import { erroDaApi } from './http.js';

const TIMEOUT_PADRAO_MS = 10000;

function erroDeConexao(mensagem) {
  const erro = new Error(mensagem);
  erro.conexao = true;
  return erro;
}

export const ehErroDeConexao = (erro) => Boolean(erro && erro.conexao);

export function criarCliente({ baseUrl, obterToken, aoPerderSessao = () => {}, timeoutMs = TIMEOUT_PADRAO_MS, fetch = globalThis.fetch }) {
  async function requisitar(metodo, caminho, dados) {
    const token = obterToken();
    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (dados !== undefined) headers['Content-Type'] = 'application/json';

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), timeoutMs);
    let resposta;
    try {
      resposta = await fetch(`${baseUrl}${caminho}`, {
        method: metodo,
        headers,
        body: dados === undefined ? undefined : JSON.stringify(dados),
        signal: controle.signal,
      });
    } catch (erro) {
      throw erro.name === 'AbortError'
        ? erroDeConexao('O servidor demorou para responder. Tente de novo.')
        : erroDeConexao('Não foi possível falar com o servidor. Confira sua conexão.');
    } finally {
      clearTimeout(relogio);
    }

    const corpo = await resposta.json().catch(() => null);
    if (!resposta.ok) {
      const erro = erroDaApi(resposta.status, corpo, 'Algo deu errado. Tente de novo.');
      if (resposta.status === 401 && token) aoPerderSessao(erro.message);
      throw erro;
    }
    return corpo;
  }

  return {
    get: (caminho) => requisitar('GET', caminho),
    post: (caminho, dados = {}) => requisitar('POST', caminho, dados),
    put: (caminho, dados = {}) => requisitar('PUT', caminho, dados),
    patch: (caminho, dados = {}) => requisitar('PATCH', caminho, dados),
    delete: (caminho) => requisitar('DELETE', caminho),
  };
}
