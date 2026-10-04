// Endereço da API usado quando EXPO_PUBLIC_API_URL não foi definida (ver .env.example).
// Serve para o navegador e o emulador iOS na mesma máquina; celular físico e emulador
// Android precisam da variável.
export const API_URL_PADRAO = 'http://localhost:3000/api';

export function resolverApiUrl(valor) {
  const url = typeof valor === 'string' ? valor.trim().replace(/\/+$/, '') : '';
  return url || API_URL_PADRAO;
}

// Erro com o status HTTP, para a tela distinguir um conflito (409) de uma falha.
export function erroDaApi(status, corpo, mensagemPadrao) {
  const erro = new Error((corpo && corpo.erro) || mensagemPadrao);
  erro.status = status;
  return erro;
}
