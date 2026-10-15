// Endereço da API usado quando EXPO_PUBLIC_API_URL não foi definida (ver .env.example).
// Serve para o navegador e o emulador iOS na mesma máquina; celular físico e emulador
// Android precisam da variável.
export const API_URL_PADRAO = 'http://localhost:3000/api';

export function resolverApiUrl(valor) {
  const url = typeof valor === 'string' ? valor.trim().replace(/\/+$/, '') : '';
  return url || API_URL_PADRAO;
}

// Build de publicação (Vercel): o endereço é obrigatório, em https e fora da
// própria máquina. Devolve o problema em texto, ou null quando está tudo certo.
export function problemaNaApiUrlDePublicacao(valor) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) {
    return 'EXPO_PUBLIC_API_URL não foi definida. Sem ela o app publicado procuraria a API em http://localhost:3000.';
  }
  let url;
  try {
    url = new URL(texto);
  } catch {
    return `EXPO_PUBLIC_API_URL não é um endereço válido: "${texto}".`;
  }
  if (['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(url.hostname)) {
    return `EXPO_PUBLIC_API_URL aponta para localhost (${texto}); o app publicado precisa da URL da API hospedada.`;
  }
  if (url.protocol !== 'https:') {
    return `EXPO_PUBLIC_API_URL precisa usar https (${texto}).`;
  }
  return null;
}

// Erro com o status HTTP, para a tela distinguir um conflito (409) de uma falha.
export function erroDaApi(status, corpo, mensagemPadrao) {
  const erro = new Error((corpo && corpo.erro) || mensagemPadrao);
  erro.status = status;
  return erro;
}
