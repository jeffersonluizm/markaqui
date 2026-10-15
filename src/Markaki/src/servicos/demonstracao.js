// "Entrar como paciente / clínica" (POST /api/demo/entrar). Se a API responde 401
// (a demonstração acabou de ser recriada, por exemplo), recarrega GET /api/demo e
// tenta mais uma vez, só se o papel continua disponível. Nunca mais de uma vez.
export async function entrarNaDemonstracao(papel, { entrar, recarregar }) {
  try {
    return await entrar(papel);
  } catch (erro) {
    if (erro.status !== 401) throw erro;
    const contas = await recarregar();
    if (!contas.some((c) => c.papel === papel)) throw erro;
    return entrar(papel);
  }
}
