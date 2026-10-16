// Proteções do modo demonstração. O gestor de demonstração é o mesmo para todos os
// visitantes: o cenário de exemplo (ids que começam com "demo-") não pode ser
// apagado nem desfigurado, e o que os visitantes criam tem teto. Fora do modo
// demonstração nada disto vale.
const crypto = require('crypto');
const { semPermissao, conflito, requisicaoInvalida } = require('../erros');
const { momentoLocal, somarDias } = require('../dominio/tempo');

const MENSAGENS = {
  medico:
    'Na demonstração, os médicos de exemplo não podem ser removidos nem editados. Cadastre um médico novo para testar.',
  horario:
    'Na demonstração, os horários de exemplo não podem ser removidos nem mudar de data. Você pode bloquear e liberar, ou abrir horários novos.',
  consulta:
    'Na demonstração, as consultas de exemplo não podem ser canceladas pela clínica. Entre como paciente para testar o cancelamento.',
  visitante:
    'Na demonstração, a clínica não cancela consultas de visitantes. Quem agendou pode cancelar pela própria conta.',
};

const emDemonstracao = (ctx) => Boolean(ctx.config && ctx.config.demo && ctx.config.demo.ativo);
const ehDoCenario = (id) => typeof id === 'string' && id.startsWith('demo-');

// Hash do IP (HMAC com o segredo da API): permite contar por visitante sem guardar
// o IP. Sem segredo (testes de unidade), cai num hash simples.
function hashDoIp(config, ip) {
  return crypto
    .createHmac('sha256', String(config.jwtSegredo || 'markaqui'))
    .update(String(ip || 'desconhecido'))
    .digest('hex')
    .slice(0, 32);
}

// Horários criados por um mesmo IP com o gestor demo compartilhado: no máximo horariosPorIp.
function limitarHorariosPorIp(ctx, r) {
  if (!emDemonstracao(ctx)) return null;
  const ipHash = hashDoIp(ctx.config, ctx.ip);
  const maximo = ctx.config.demo.horariosPorIp;
  if (r.horarios.contarCriadosPorIp(ipHash) >= maximo) {
    throw conflito(
      `A demonstração aceita até ${maximo} horários por visitante. Remova um que você criou ou aguarde a próxima recriação dos dados.`
    );
  }
  return ipHash;
}

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

// Horários novos (ou com data mudada) só nos próximos janelaDias dias: o teto não
// se esgota com datas como 2099.
function limitarJanela(ctx, data) {
  if (!emDemonstracao(ctx)) return;
  const dias = ctx.config.demo.janelaDias;
  if (data > somarDias(momentoLocal(ctx.agora).data, dias)) {
    throw requisicaoInvalida(`Na demonstração, abra horários para os próximos ${dias} dias.`);
  }
}

// Bloquear um horário do cenário: no máximo maxBloqueados ao mesmo tempo.
function limitarBloqueio(ctx, r, horario, campos) {
  if (!emDemonstracao(ctx) || campos.bloqueado !== true || horario.bloqueado || !ehDoCenario(horario.id)) return;
  const maximo = ctx.config.demo.maxBloqueados;
  if (r.horarios.contarBloqueadosDoCenario() >= maximo) {
    throw conflito(
      `Na demonstração, no máximo ${maximo} horários de exemplo ficam bloqueados ao mesmo tempo. Libere um antes de bloquear outro.`
    );
  }
}

// A clínica (gestor compartilhado) não cancela consulta de uma visitante efêmera.
function protegerConsultaDeVisitante(ctx, r, agendamento) {
  if (!emDemonstracao(ctx) || ctx.usuario.papel !== 'gestor') return;
  const paciente = r.usuarios.buscar(agendamento.paciente_id);
  if (paciente && paciente.demo) throw semPermissao(MENSAGENS.visitante);
}

module.exports = {
  protegerCenario,
  respeitarTeto,
  emDemonstracao,
  limitarJanela,
  limitarBloqueio,
  protegerConsultaDeVisitante,
  hashDoIp,
  limitarHorariosPorIp,
};
