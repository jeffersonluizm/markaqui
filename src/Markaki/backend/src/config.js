const path = require('path');

const caminhoBanco = (env = process.env) => env.DB_FILE || path.join(__dirname, '..', 'dados', 'markaqui.db');

// Variável inteira do ambiente: vazia usa o padrão; texto, fração ou valor fora da
// faixa param a partida com mensagem clara (um teto "abc" viraria NaN e desligaria
// a proteção em silêncio).
function inteiro(env, nome, padrao, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const bruto = env[nome];
  if (bruto === undefined || String(bruto).trim() === '') return padrao;
  const texto = String(bruto).trim();
  const valor = Number(texto);
  if (!/^-?\d+$/.test(texto) || valor < min || valor > max) {
    throw new Error(`${nome} precisa ser um número inteiro entre ${min} e ${max} (recebido: "${bruto}").`);
  }
  return valor;
}

// Modo demonstração: desligado por padrão. Ligado (DEMO_ENABLED=true), a API cria
// um gestor de demonstração e expõe GET /api/demo e POST /api/demo/entrar para o
// app mostrar "Entrar como paciente / clínica". Não existe senha: cada "Entrar
// como paciente" cria uma paciente efêmera, e a clínica é um gestor compartilhado.
function lerDemo(env) {
  return {
    ativo: env.DEMO_ENABLED === 'true',
    // Minutos entre os resets dos dados (0 = só na partida).
    resetMinutos: inteiro(env, 'DEMO_RESET_MINUTOS', 0),
    // Pacientes efêmeras ao mesmo tempo; passando disso, a mais antiga sai...
    maxVisitantes: inteiro(env, 'DEMO_MAX_VISITANTES', 50, { min: 1 }),
    // Contas temporárias vivas por IP: passando disso, o mesmo IP perde a própria
    // mais antiga (um IP sozinho não enche a demo nem toma as vagas que abrem).
    visitantesPorIp: inteiro(env, 'DEMO_VISITANTES_POR_IP', 3, { min: 1 }),
    // ...desde que tenha pelo menos esta idade (senão a demo responde "cheia", 503).
    vidaMinimaMinutos: inteiro(env, 'DEMO_VIDA_MINIMA_MINUTOS', 15),
    // Tetos do que os visitantes criam como clínica: médicos (o cenário conta) e
    // horários criados (os do cenário não contam), só dentro de janelaDias.
    maxMedicos: inteiro(env, 'DEMO_MAX_MEDICOS', 20, { min: 1 }),
    maxHorarios: inteiro(env, 'DEMO_MAX_HORARIOS', 500, { min: 1 }),
    // Horários criados por IP: o gestor demo é compartilhado, então um IP não esgota o teto geral.
    horariosPorIp: inteiro(env, 'DEMO_HORARIOS_POR_IP', 100, { min: 1 }),
    janelaDias: inteiro(env, 'DEMO_JANELA_DIAS', 60, { min: 1 }),
    // Horários do cenário bloqueados ao mesmo tempo.
    maxBloqueados: inteiro(env, 'DEMO_MAX_BLOQUEADOS', 20),
    // "Entrar como" e cadastros por IP por minuto.
    entradasPorMinuto: inteiro(env, 'DEMO_ENTRADAS_POR_MINUTO', 10, { min: 1 }),
    contas: {
      paciente: { papel: 'paciente', nome: 'Marina Albuquerque' },
      gestor: {
        papel: 'gestor',
        nome: 'Gestão Clínica Markaqui',
        email: (env.DEMO_GESTOR_EMAIL || 'gestor@markaqui.demo').toLowerCase(),
      },
    },
  };
}

// Configuração lida do ambiente (arquivo .env ao lado do server.js; modelo em
// .env.example). Sem JWT_SECRET forte a API não sobe.
function lerConfig(env = process.env) {
  const segredo = env.JWT_SECRET || '';
  if (segredo.length < 32) {
    throw new Error(
      'Defina JWT_SECRET com pelo menos 32 caracteres no arquivo .env do backend ' +
        '(veja .env.example; o iniciar.bat cria um automaticamente).'
    );
  }
  return {
    porta: inteiro(env, 'PORT', 3000, { min: 1, max: 65535 }),
    // Só a própria máquina por padrão. Para o celular na mesma rede, HOST=0.0.0.0
    // (o iniciar.bat faz isso), sabendo que a API fica visível para a rede local.
    host: env.HOST || '127.0.0.1',
    arquivoBanco: caminhoBanco(env),
    jwtSegredo: segredo,
    jwtValidade: env.JWT_VALIDADE || '8h',
    bcryptCusto: inteiro(env, 'BCRYPT_CUSTO', 10, { min: 4, max: 15 }),
    corsOrigens: (env.CORS_ORIGENS || 'http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    // Tentativas de login/cadastro por IP por minuto; e requisições por IP por minuto (0 desliga).
    limiteAuthMax: inteiro(env, 'LIMITE_AUTH_POR_MINUTO', 5, { min: 1 }),
    limiteGlobalMax: inteiro(env, 'LIMITE_GLOBAL_POR_MINUTO', 300),
    // Consultas futuras ativas por paciente (uma conta não reserva a agenda toda).
    limiteConsultasAtivas: inteiro(env, 'LIMITE_CONSULTAS_ATIVAS', 3, { min: 1 }),
    // Itens por listagem (horários, consultas, médicos): uma resposta nunca cresce sem fim.
    limiteListagem: inteiro(env, 'LIMITE_LISTAGEM', 500, { min: 1 }),
    // Proxies na frente da API (1 no Render): o limite por IP passa a usar o IP do visitante.
    trustProxy: inteiro(env, 'TRUST_PROXY', 0),
    demo: lerDemo(env),
    relogio: () => new Date(),
  };
}

module.exports = { lerConfig, caminhoBanco };
