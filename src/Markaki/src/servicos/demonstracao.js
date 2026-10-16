// "Entrar como paciente / clínica" (POST /api/demo/entrar). Se a API responde 401
// (a demonstração acabou de ser recriada, por exemplo), recarrega GET /api/demo e
// tenta mais uma vez, só se o papel continua disponível. Nunca mais de uma vez.
// Com a demonstração cheia (503), explica e não insiste.
export const MSG_DEMO_CHEIA =
  'A demonstração está cheia agora, com muitas visitas ao mesmo tempo. Tente de novo em alguns minutos.';

export function mensagemAmigavel(erro) {
  if (erro && erro.status === 503) {
    return Object.assign(new Error(MSG_DEMO_CHEIA), { status: 503 });
  }
  return erro;
}

export async function entrarNaDemonstracao(papel, { entrar, recarregar }) {
  try {
    return await entrar(papel);
  } catch (erro) {
    if (erro.status !== 401) throw mensagemAmigavel(erro);
    const contas = await recarregar();
    if (!contas.some((c) => c.papel === papel)) throw erro;
    return entrar(papel).catch((e) => {
      throw mensagemAmigavel(e);
    });
  }
}
