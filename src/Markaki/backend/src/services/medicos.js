// Regras de médicos. Recebem os repositórios (r) de uma leitura ou escrita e dados
// já validados (validators/medico.js).
const { gerarId } = require('../infra/ids');
const { naoEncontrado, conflito } = require('../erros');

const IMAGEM_PADRAO = 'https://via.placeholder.com/80';

function buscar(r, id) {
  const medico = r.medicos.buscar(id);
  if (!medico) throw naoEncontrado('Médico não encontrado');
  return medico;
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

module.exports = { buscar, cadastrar, atualizar, remover };
