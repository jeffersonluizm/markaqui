// Apoio dos testes: cada arquivo de teste cria um ambiente com banco SQLite
// temporário, relógio fixo e usuários prontos (gestor e duas pacientes).
const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { criarApp } = require('../src/app');
const { criarArmazenamentoSqlite } = require('../src/infra/sqlite/armazenamento');
const { emitirToken } = require('../src/infra/tokens');

const SEGREDO = 'segredo-dos-testes-com-mais-de-32-caracteres';
const SENHA = 'Senha123';
const HASH = bcrypt.hashSync(SENHA, 4);

// "Agora" dos testes: 2030-01-10 às 12:00 (horário local).
const AGORA = new Date(2030, 0, 10, 12, 0, 0);

const usuarios = {
  gestor: { id: 'u-gestor', nome: 'Gestora Lia', email: 'gestor@teste.dev', telefone: '', papel: 'gestor' },
  ana: { id: 'u-ana', nome: 'Ana Paciente', email: 'ana@teste.dev', telefone: '11999990000', papel: 'paciente' },
  bia: { id: 'u-bia', nome: 'Bia Paciente', email: 'bia@teste.dev', telefone: '', papel: 'paciente' },
};

const medicosBase = [
  { id: 'm1', nome: 'Dra. Ana Lima', especialidade: 'Cardiologia' },
  { id: 'm2', nome: 'Dr. Beto Reis', especialidade: 'Ortopedia' },
];

// Horário livre no futuro (em relação a AGORA).
function horario(id, medicoId = 'm1', extra = {}) {
  return { id, medico_id: medicoId, data: '2030-02-01', hora: '09:00', bloqueado: false, ...extra };
}

function agendamento(id, horarioId, pacienteId = 'u-ana', extra = {}) {
  return {
    id,
    horario_id: horarioId,
    medico_id: 'm1',
    medico_nome: 'Dra. Ana Lima',
    medico_especialidade: 'Cardiologia',
    paciente_id: pacienteId,
    paciente_nome: pacienteId === 'u-bia' ? 'Bia Paciente' : 'Ana Paciente',
    data: '2030-02-01',
    hora: '09:00',
    status: 'agendado',
    criado_em: '2030-01-05T10:00:00.000Z',
    ...extra,
  };
}

function criarAmbiente(opcoes = {}) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'markaqui-teste-'));
  const armazenamento = criarArmazenamentoSqlite(path.join(pasta, 'markaqui.db'));
  const config = {
    jwtSegredo: SEGREDO,
    jwtValidade: '8h',
    bcryptCusto: 4,
    corsOrigens: ['http://localhost:8081'],
    limiteAuthMax: 1000,
    limiteGlobalMax: 0,
    limiteConsultasAtivas: 3,
    relogio: () => AGORA,
    ...opcoes,
  };
  const app = criarApp({ armazenamento, config });

  const ambiente = {
    app,
    armazenamento,
    // Substitui o banco inteiro; usuários padrão entram sempre.
    semear(dados = {}) {
      armazenamento.substituirTudo({
        usuarios: Object.values(usuarios).map((u) => ({ ...u, senha_hash: HASH, criado_em: '2030-01-01T00:00:00.000Z' })),
        medicos: medicosBase,
        horarios: [],
        agendamentos: [],
        ...dados,
      });
    },
    dados: () => armazenamento.exportarTudo(),
    token: (usuario) => emitirToken(usuario, { segredo: SEGREDO, validade: '8h' }),
    // Requisição já autenticada como o usuário dado (ou sem login com null).
    como(usuario) {
      const auth = usuario ? { Authorization: `Bearer ${ambiente.token(usuario)}` } : {};
      const http = request(app);
      const com = (metodo) => (url) => http[metodo](url).set(auth);
      return { get: com('get'), post: com('post'), put: com('put'), patch: com('patch'), delete: com('delete') };
    },
    fechar() {
      armazenamento.fechar();
      fs.rmSync(pasta, { recursive: true, force: true });
    },
  };
  return ambiente;
}

module.exports = { criarAmbiente, usuarios, medicosBase, horario, agendamento, SENHA, AGORA, SEGREDO };
