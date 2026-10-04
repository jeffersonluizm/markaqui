// Modo demonstração: dados de exemplo (médicos, agenda e consultas fictícias) e
// as contas "Entrar como paciente / gestor". As senhas vêm da configuração
// (.env ou geradas na partida); nada de senha no código.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { gerarId } = require('../infra/ids');

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
  const dia = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
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

// Cria ou atualiza as contas de demonstração (idempotente). Não toca em conta real.
function prepararDemonstracao(armazenamento, config) {
  if (!config.demo.ativo) return;
  const contas = Object.values(config.demo.contas);
  const hashes = contas.map((c) => bcrypt.hashSync(c.senha, config.bcryptCusto));
  armazenamento.escritaSincrona((r) => {
    contas.forEach((conta, i) => {
      const existente = r.usuarios.buscarPorEmail(conta.email);
      if (existente && !existente.demo) {
        throw new Error(`O e-mail de demonstração ${conta.email} já pertence a uma conta real. Troque DEMO_${conta.papel.toUpperCase()}_EMAIL.`);
      }
      if (existente) {
        r.usuarios.atualizar(existente.id, { senha_hash: hashes[i], versao_token: (existente.versao_token || 0) + 1 });
      } else {
        r.usuarios.inserir({ id: gerarId(), nome: conta.nome, email: conta.email, papel: conta.papel, senha_hash: hashes[i], demo: true });
      }
    });
  });
}

// Apaga tudo e recria o cenário de demonstração (banco exclusivo da demo).
function resetarDemonstracao(armazenamento, config, agora = new Date()) {
  const { medicos, horarios } = dadosDeDemonstracao({ hoje: agora });
  const medico = (id) => MEDICOS.find((m) => m.id === id);
  const dias = proximosDiasUteis(DIAS_UTEIS, agora);
  const [ultimoDiaUtil] = diasUteis(1, agora, -1);
  const contaPaciente = config.demo.contas.paciente;

  const usuarios = [
    ...FICTICIAS.map((p) => ({ ...p, email: `${p.id}@exemplo.invalid`, papel: 'paciente', senha_hash: hashInutilizavel() })),
    { id: 'demo-paciente', nome: contaPaciente.nome, email: contaPaciente.email, telefone: '31988887777', papel: 'paciente', senha_hash: hashInutilizavel(), demo: true },
  ];

  // Um horário que já passou, para o histórico ter uma consulta realizada.
  const passado = { id: `demo-medico-2-${ultimoDiaUtil}-10:00`, medico_id: 'demo-medico-2', data: ultimoDiaUtil, hora: '10:00' };
  const todosHorarios = [...horarios, passado];

  const consulta = (pacienteId, medicoId, data, hora, extra = {}) => {
    const m = medico(medicoId);
    const paciente = usuarios.find((u) => u.id === pacienteId);
    return {
      id: gerarId(),
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
    consulta('demo-paciente', 'demo-medico-1', dias[0], '09:00'),
    consulta('demo-paciente', 'demo-medico-3', dias[2], '14:00'),
    consulta('demo-paciente', 'demo-medico-4', dias[1], '10:00', { status: 'cancelado', cancelado_em: agora.toISOString(), cancelado_por: 'paciente' }),
    consulta('demo-paciente', 'demo-medico-2', ultimoDiaUtil, '10:00'),
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
  prepararDemonstracao(armazenamento, config);
}

module.exports = { MEDICOS, dadosDeDemonstracao, proximosDiasUteis, prepararDemonstracao, resetarDemonstracao };
