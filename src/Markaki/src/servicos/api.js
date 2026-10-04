// Endpoints da API. O endereço vem de EXPO_PUBLIC_API_URL (.env desta pasta; o
// Expo só substitui a variável lida exatamente assim). O token fica em memória
// aqui e guardado no armazenamento seguro pelo contexto de sessão.
import { resolverApiUrl } from './http.js';
import { criarCliente } from './cliente.js';

export const API_URL = resolverApiUrl(process.env.EXPO_PUBLIC_API_URL);

let tokenAtual = null;
let avisarPerdaDeSessao = () => {};

export const sessaoHttp = {
  definirToken(token) {
    tokenAtual = token;
  },
  aoPerderSessao(funcao) {
    avisarPerdaDeSessao = funcao;
  },
};

const http = criarCliente({
  baseUrl: API_URL,
  obterToken: () => tokenAtual,
  aoPerderSessao: (mensagem) => avisarPerdaDeSessao(mensagem),
});

const id = encodeURIComponent;

export const api = {
  saude: () => http.get('/saude'),
  demo: () => http.get('/demo'),

  auth: {
    entrar: (email, senha) => http.post('/auth/login', { email, senha }),
    cadastrar: (dados) => http.post('/auth/cadastro', dados),
    eu: () => http.get('/auth/eu'),
    atualizarPerfil: (dados) => http.put('/auth/eu', dados),
    trocarSenha: (senhaAtual, novaSenha) => http.put('/auth/senha', { senha_atual: senhaAtual, nova_senha: novaSenha }),
  },

  medicos: {
    listar: () => http.get('/medicos'),
    buscar: (medicoId) => http.get(`/medicos/${id(medicoId)}`),
    cadastrar: (dados) => http.post('/medicos', dados),
    atualizar: (medicoId, dados) => http.put(`/medicos/${id(medicoId)}`, dados),
    remover: (medicoId) => http.delete(`/medicos/${id(medicoId)}`),
  },

  horarios: {
    listar: (medicoId) => http.get(medicoId ? `/horarios?medico_id=${id(medicoId)}` : '/horarios'),
    buscar: (horarioId) => http.get(`/horarios/${id(horarioId)}`),
    cadastrar: (dados) => http.post('/horarios', dados),
    bloquear: (horarioId, bloqueado) => http.put(`/horarios/${id(horarioId)}`, { bloqueado }),
    remover: (horarioId) => http.delete(`/horarios/${id(horarioId)}`),
  },

  agendamentos: {
    listar: () => http.get('/agendamentos'),
    buscar: (agendamentoId) => http.get(`/agendamentos/${id(agendamentoId)}`),
    agendar: (horarioId, medicoId) => http.post('/agendamentos', { horario_id: horarioId, medico_id: medicoId }),
    cancelar: (agendamentoId) => http.patch(`/agendamentos/${id(agendamentoId)}/cancelar`),
  },

  painel: () => http.get('/painel'),
};
