// Proteções do modo demonstração. O gestor de demonstração é o mesmo para todos os
// visitantes: o cenário de exemplo (ids que começam com "demo-") não pode ser
// apagado nem desfigurado, e o que os visitantes criam tem teto. Fora do modo
// demonstração nada disto vale.
const { semPermissao, conflito } = require('../erros');

const MENSAGENS = {
  medico:
    'Na demonstração, os médicos de exemplo não podem ser removidos nem editados. Cadastre um médico novo para testar.',
  horario:
    'Na demonstração, os horários de exemplo não podem ser removidos nem mudar de data. Você pode bloquear e liberar, ou abrir horários novos.',
  consulta:
    'Na demonstração, as consultas de exemplo não podem ser canceladas pela clínica. Entre como paciente para testar o cancelamento.',
};

const emDemonstracao = (ctx) => Boolean(ctx.config && ctx.config.demo && ctx.config.demo.ativo);
const ehDoCenario = (id) => typeof id === 'string' && id.startsWith('demo-');

// 403 com mensagem amigável quando o registro é do cenário de exemplo.
function protegerCenario(ctx, tipo, id) {
  if (emDemonstracao(ctx) && ehDoCenario(id)) throw semPermissao(MENSAGENS[tipo]);
}

// 409 quando o visitante chega ao teto (ex.: 20 médicos, 500 horários).
function respeitarTeto(ctx, { atual, chave, rotulo }) {
  if (!emDemonstracao(ctx)) return;
  const maximo = ctx.config.demo[chave];
  if (maximo > 0 && atual >= maximo) {
    throw conflito(
      `A demonstração aceita até ${maximo} ${rotulo}. Remova um que você criou ou aguarde a próxima recriação dos dados.`
    );
  }
}

module.exports = { protegerCenario, respeitarTeto, emDemonstracao };
