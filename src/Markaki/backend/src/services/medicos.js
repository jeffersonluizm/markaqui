// Regras de médicos. Recebem os repositórios (r) de uma leitura ou escrita.
const { gerarId } = require('../infra/ids');
const { naoEncontrado, requisicaoInvalida, conflito } = require('../erros');

const IMAGEM_PADRAO = 'https://via.placeholder.com/80';

function listar(r) {
  return r.medicos.listar();
}

function buscar(r, id) {
  const medico = r.medicos.buscar(id);
  if (!medico) throw naoEncontrado('Médico não encontrado');
  return medico;
}

function validarNovo({ nome, especialidade }) {
  if (!nome || !especialidade) {
    throw requisicaoInvalida('Nome e especialidade são obrigatórios');
  }
}

function cadastrar(r, { nome, especialidade, imagem }) {
  return r.medicos.inserir({
    id: gerarId(),
    nome,
    especialidade,
    imagem: imagem || IMAGEM_PADRAO,
  });
}

function atualizar(r, id, { nome, especialidade, imagem }) {
  const atual = buscar(r, id);
  return r.medicos.atualizar(id, {
    nome: nome || atual.nome,
    especialidade: especialidade || atual.especialidade,
    imagem: imagem || atual.imagem,
  });
}

// Com consulta marcada o médico não sai: os agendamentos ficariam órfãos. Sem
// agendamentos, os horários que sobram (livres ou bloqueados) saem junto.
function remover(r, id) {
  buscar(r, id);
  const agendamentos = r.agendamentos.contarDoMedico(id);
  if (agendamentos > 0) {
    throw conflito(
      `Este médico tem ${agendamentos} agendamento(s). Cancele os agendamentos primeiro.`
    );
  }
  const horariosRemovidos = r.horarios.removerDoMedico(id);
  r.medicos.remover(id);
  return { mensagem: 'Médico removido com sucesso', horarios_removidos: horariosRemovidos };
}

module.exports = { listar, buscar, validarNovo, cadastrar, atualizar, remover };
