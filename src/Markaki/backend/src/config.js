const path = require('path');

const caminhoBanco = (env = process.env) => env.DB_FILE || path.join(__dirname, '..', 'dados', 'markaqui.db');
const numero = (valor, padrao) => (valor === undefined || valor === '' ? padrao : Number(valor));

// Modo demonstração: desligado por padrão. Ligado (DEMO_ENABLED=true), a API cria
// um gestor de demonstração e expõe GET /api/demo e POST /api/demo/entrar para o
// app mostrar "Entrar como paciente / clínica". Não existe senha: cada "Entrar
// como paciente" cria uma paciente efêmera, e a clínica é um gestor compartilhado.
function lerDemo(env) {
  return {
    ativo: env.DEMO_ENABLED === 'true',
    // Minutos entre os resets dos dados (0 = só na partida).
    resetMinutos: numero(env.DEMO_RESET_MINUTOS, 0),
    // Pacientes efêmeras ao mesmo tempo; passando disso, a mais antiga sai.
    maxVisitantes: numero(env.DEMO_MAX_VISITANTES, 50),
    // "Entrar como" por IP por minuto.
    entradasPorMinuto: numero(env.DEMO_ENTRADAS_POR_MINUTO, 10),
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
    porta: numero(env.PORT, 3000),
    // Só a própria máquina por padrão. Para o celular na mesma rede, HOST=0.0.0.0
    // (o iniciar.bat faz isso), sabendo que a API fica visível para a rede local.
    host: env.HOST || '127.0.0.1',
    arquivoBanco: caminhoBanco(env),
    jwtSegredo: segredo,
    jwtValidade: env.JWT_VALIDADE || '8h',
    bcryptCusto: numero(env.BCRYPT_CUSTO, 10),
    corsOrigens: (env.CORS_ORIGENS || 'http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    // Tentativas de login/cadastro por IP por minuto; e requisições por IP por minuto (0 desliga).
    limiteAuthMax: numero(env.LIMITE_AUTH_POR_MINUTO, 5),
    limiteGlobalMax: numero(env.LIMITE_GLOBAL_POR_MINUTO, 300),
    // Consultas futuras ativas por paciente (uma conta não reserva a agenda toda).
    limiteConsultasAtivas: numero(env.LIMITE_CONSULTAS_ATIVAS, 3),
    // Proxies na frente da API (1 no Render): o limite por IP passa a usar o IP do visitante.
    trustProxy: numero(env.TRUST_PROXY, 0),
    demo: lerDemo(env),
    relogio: () => new Date(),
  };
}

module.exports = { lerConfig, caminhoBanco };
