// Modo demonstração: dados de exemplo (médicos, agenda e consultas fictícias) e
// "Entrar como paciente / clínica" sem senha nenhuma: paciente efêmera por visita
// e um gestor de demonstração compartilhado.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { gerarId } = require('../infra/ids');
const { emitirToken } = require('../infra/tokens');
const { naoAutenticado } = require('../erros');
const { momentoLocal } = require('../dominio/tempo');
const { usuarioPublico } = require('./apresentacao');

const MEDICOS = [
  { id: 'demo-medico-1', nome: 'Dra. Helena Duarte', especialidade: 'Cardiologia' },
  { id: 'demo-medico-2', nome: 'Dr. Rafael Moura', especialidade: 'Ortopedia' },
  { id: 'demo-medico-3', nome: 'Dra. Camila Nogueira', especialidade: 'Pediatria' },
  { id: 'demo-medico-4', nome: 'Dr. André Lacerda', especialidade: 'Clínica Geral' },
];
const HORAS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];
const DIAS_UTEIS = 10;

// Pacientes fictícias que ocupam alguns horários (não entram no sistema).
const FICTICIAS = [
  { id: 'demo-ficticia-1', nome: 'Paulo Ribeiro' },
  { id: 'demo-ficticia-2', nome: 'Lúcia Martins' },
  { id: 'demo-ficticia-3', nome: 'Tiago Fonseca' },
];

const dataTexto = (d) => d.toISOString().slice(0, 10);

function diasUteis(quantidade, hoje, sentido) {
  const dias = [];
  // "Hoje" no fuso da clínica, não no do servidor.
  const [a, m, d] = momentoLocal(hoje).data.split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d));
  while (dias.length < quantidade) {
    dia.setUTCDate(dia.getUTCDate() + sentido);
    const semana = dia.getUTCDay();
    if (semana !== 0 && semana !== 6) dias.push(dataTexto(dia));
  }
  return dias;
}

const proximosDiasUteis = (quantidade, hoje = new Date()) => diasUteis(quantidade, hoje, 1);

// Médicos e horários livres nos próximos dias úteis.
function dadosDeDemonstracao({ hoje = new Date() } = {}) {
  const horarios = [];
  for (const medico of MEDICOS) {
    for (const data of proximosDiasUteis(DIAS_UTEIS, hoje)) {
      for (const hora of HORAS) {
        horarios.push({ id: `${medico.id}-${data}-${hora}`, medico_id: medico.id, data, hora });
      }
    }
  }
  return { medicos: MEDICOS, horarios };
}

const hashInutilizavel = () => bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 4);

// Garante o gestor de demonstração (idempotente). Ele não tem senha utilizável:
// só se entra nele por POST /api/demo/entrar. Não toca em conta real.
function prepararDemonstracao(armazenamento, config) {
  if (!config.demo.ativo) return;
  const conta = config.demo.contas.gestor;
  armazenamento.escritaSincrona((r) => {
    const existente = r.usuarios.buscarPorEmail(conta.email);
    if (existente && !existente.demo) {
      throw new Error(
        `O e-mail de demonstração ${conta.email} já pertence a uma conta real. Troque DEMO_GESTOR_EMAIL.`
      );
    }
    if (!existente) {
      r.usuarios.inserir({
        id: 'demo-gestor',
        nome: conta.nome,
        email: conta.email,
        papel: 'gestor',
        senha_hash: hashInutilizavel(),
        demo: true,
      });
    }
  });
}

// Pacientes efêmeras: cada "Entrar como paciente" ganha uma conta própria, com uma
// consulta futura, uma cancelada e uma realizada. Assim o limite de consultas
// ativas vale por visitante, e ninguém herda a agenda (nem o limite) de outro.
function criarVisitante(r, config, agora) {
  // Teto: passando de maxVisitantes, a mais antiga sai junto com as consultas dela.
  const visitantes = r.usuarios.listarVisitantesDemo();
  const sobra = visitantes.length - Math.max(1, config.demo.maxVisitantes) + 1;
  for (const id of visitantes.slice(0, Math.max(0, sobra))) {
    r.agendamentos.removerDoPaciente(id);
    r.usuarios.remover(id);
  }

  const id = `demo-visitante-${gerarId()}`;
  const paciente = r.usuarios.inserir({
    id,
    nome: config.demo.contas.paciente.nome,
    email: `${id}@markaqui.demo`,
    telefone: '31988887777',
    papel: 'paciente',
    senha_hash: hashInutilizavel(),
    demo: true,
    criado_em: agora.toISOString(),
  });

  const consulta = (h, extra = {}) =>
    r.agendamentos.inserir({
      id: gerarId(),
      horario_id: h.id,
      medico_id: h.medico_id,
      medico_nome: h.medico_nome,
      medico_especialidade: h.medico_especialidade,
      paciente_id: id,
      paciente_nome: paciente.nome,
      data: h.data,
      hora: h.hora,
      criado_em: agora.toISOString(),
      ...extra,
    });
  // Sorteia entre os primeiros horários livres depois do primeiro dia com vaga (esse
  // dia fica inteiro para a visitante agendar), para as visitantes não disputarem
  // sempre o mesmo.
  const proximos = r.horarios.listarLivres(undefined, momentoLocal(agora), 200);
  const depoisDoPrimeiroDia = proximos.filter((h) => h.data !== proximos[0].data);
  const livres = (depoisDoPrimeiroDia.length > 0 ? depoisDoPrimeiroDia : proximos).slice(0, 24);
  if (livres.length > 0) {
    const [futura] = livres.splice(crypto.randomInt(livres.length), 1);
    consulta(futura);
  }
  if (livres.length > 0) {
    const cancelada = livres[crypto.randomInt(livres.length)];
    consulta(cancelada, { status: 'cancelado', cancelado_em: agora.toISOString(), cancelado_por: 'paciente' });
  }
  // Realizada no último dia útil (sem horário: a agenda passada não é reaproveitada).
  const [ultimoDiaUtil] = diasUteis(1, agora, -1);
  const medico = MEDICOS[1];
  consulta({
    id: null,
    medico_id: r.medicos.buscar(medico.id) ? medico.id : null,
    medico_nome: medico.nome,
    medico_especialidade: medico.especialidade,
    data: ultimoDiaUtil,
    hora: '10:00',
  });
  return paciente;
}

// "Entrar como paciente / clínica": devolve uma sessão como a do login.
async function entrarNaDemonstracao(armazenamento, config, papel) {
  const agora = config.relogio();
  const usuario = await armazenamento.escrita((r) => {
    if (papel === 'paciente') return criarVisitante(r, config, agora);
    const gestor = r.usuarios.buscarPorEmail(config.demo.contas.gestor.email);
    if (!gestor || !gestor.demo) throw naoAutenticado('A demonstração está sendo preparada. Tente de novo.');
    return gestor;
  });
  return {
    token: emitirToken(usuario, { segredo: config.jwtSegredo, validade: config.jwtValidade }),
    usuario: usuarioPublico(usuario),
  };
}

// Apaga tudo e recria o cenário de demonstração (banco exclusivo da demo).
function resetarDemonstracao(armazenamento, config, agora = new Date()) {
  const { medicos, horarios } = dadosDeDemonstracao({ hoje: agora });
  const medico = (id) => MEDICOS.find((m) => m.id === id);
  const dias = proximosDiasUteis(DIAS_UTEIS, agora);
  const [ultimoDiaUtil] = diasUteis(1, agora, -1);

  const usuarios = FICTICIAS.map((p) => ({
    ...p,
    email: `${p.id}@exemplo.invalid`,
    papel: 'paciente',
    senha_hash: hashInutilizavel(),
  }));

  // Um horário que já passou, para o histórico ter uma consulta realizada.
  const passado = {
    id: `demo-medico-2-${ultimoDiaUtil}-10:00`,
    medico_id: 'demo-medico-2',
    data: ultimoDiaUtil,
    hora: '10:00',
  };
  const todosHorarios = [...horarios, passado];

  let seq = 0;
  const consulta = (pacienteId, medicoId, data, hora, extra = {}) => {
    const m = medico(medicoId);
    const paciente = usuarios.find((u) => u.id === pacienteId);
    seq += 1;
    return {
      id: `demo-ag-${seq}`,
      horario_id: `${medicoId}-${data}-${hora}`,
      medico_id: medicoId,
      medico_nome: m.nome,
      medico_especialidade: m.especialidade,
      paciente_id: pacienteId,
      paciente_nome: paciente.nome,
      data,
      hora,
      status: 'agendado',
      criado_em: agora.toISOString(),
      ...extra,
    };
  };
  const agendamentos = [
    consulta('demo-ficticia-3', 'demo-medico-2', ultimoDiaUtil, '10:00'),
    consulta('demo-ficticia-2', 'demo-medico-4', dias[1], '10:00', {
      status: 'cancelado',
      cancelado_em: agora.toISOString(),
      cancelado_por: 'paciente',
    }),
    consulta('demo-ficticia-1', 'demo-medico-1', dias[0], '08:00'),
    consulta('demo-ficticia-2', 'demo-medico-1', dias[0], '10:00'),
    consulta('demo-ficticia-3', 'demo-medico-2', dias[0], '14:00'),
    consulta('demo-ficticia-1', 'demo-medico-4', dias[1], '15:00'),
    consulta('demo-ficticia-2', 'demo-medico-3', dias[3], '09:00'),
  ];
  // Um horário bloqueado, para a agenda da clínica mostrar os três estados.
  const bloqueado = todosHorarios.find((h) => h.id === `demo-medico-1-${dias[0]}-16:00`);
  bloqueado.bloqueado = true;

  armazenamento.substituirTudo({ usuarios, medicos, horarios: todosHorarios, agendamentos });
  armazenamento.marcarComoDemo();
  prepararDemonstracao(armazenamento, config);
}

// Só um banco totalmente vazio (ou já marcado como de demonstração) recebe o cenário.
function podeSemear(armazenamento) {
  if (armazenamento.ehBancoDemo()) return true;
  const { usuarios, medicos } = armazenamento.exportarTudo();
  return usuarios.length === 0 && medicos.length === 0;
}

// Partida com DEMO_ENABLED=true. Banco vazio vira banco de demonstração; banco já
// marcado só recebe as senhas desta partida; banco com dados reais faz a API parar,
// para nunca publicar uma senha de gestor nem apagar dados reais.
function iniciarDemonstracao(armazenamento, config) {
  if (!config.demo.ativo) return;
  if (armazenamento.ehBancoDemo()) {
    prepararDemonstracao(armazenamento, config);
  } else if (podeSemear(armazenamento)) {
    resetarDemonstracao(armazenamento, config);
  } else {
    throw new Error(
      'DEMO_ENABLED=true só funciona com um banco de demonstração (vazio ou criado pelo modo demo). ' +
        'Este banco tem dados reais: desligue o modo demo ou aponte DB_FILE para outro arquivo.'
    );
  }
}

module.exports = {
  MEDICOS,
  dadosDeDemonstracao,
  proximosDiasUteis,
  prepararDemonstracao,
  resetarDemonstracao,
  entrarNaDemonstracao,
  podeSemear,
  iniciarDemonstracao,
};
