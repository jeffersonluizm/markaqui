import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estaAgendado, horariosDisponiveisDoMedico, rotuloMedico } from './horarios.js';

// Formato dos horários gravados por backend/server.js (POST /api/horarios e POST /api/agendamentos)
const livre = { id: '1', data: '10/10/2025', hora: '09:00', disponivel: true, paciente_nome: '', medico_id: null, medico_nome: '' };
const bloqueado = { ...livre, disponivel: false };
const agendado = { ...livre, disponivel: false, paciente_nome: 'Ana', medico_id: '7', medico_nome: 'Dr. João' };

test('horário livre não está agendado', () => {
  assert.equal(estaAgendado(livre), false);
});

test('horário marcado como indisponível à mão não está agendado (pode voltar a ficar disponível)', () => {
  assert.equal(estaAgendado(bloqueado), false);
});

test('horário com paciente está agendado (só libera cancelando o agendamento)', () => {
  assert.equal(estaAgendado(agendado), true);
});

// Agenda por médico: cada horário pertence a um médico (medico_id).
const daAna = { ...livre, id: 'a1', medico_id: 'm1', medico_nome: 'Dra. Ana' };
const daAnaBloqueado = { ...daAna, id: 'a2', disponivel: false };
const daAnaAgendado = { ...daAna, id: 'a3', disponivel: false, paciente_nome: 'Rui' };
const doBeto = { ...livre, id: 'b1', medico_id: 'm2', medico_nome: 'Dr. Beto' };

test('horariosDisponiveisDoMedico devolve só os horários livres do médico escolhido', () => {
  const todos = [daAna, daAnaBloqueado, daAnaAgendado, doBeto, livre];
  assert.deepEqual(horariosDisponiveisDoMedico(todos, 'm1').map((h) => h.id), ['a1']);
  assert.deepEqual(horariosDisponiveisDoMedico(todos, 'm2').map((h) => h.id), ['b1']);
});

test('horariosDisponiveisDoMedico sem médico escolhido não devolve nada', () => {
  assert.deepEqual(horariosDisponiveisDoMedico([daAna, doBeto], null), []);
});

test('rotuloMedico usa o nome atual do médico e avisa quando o horário não tem médico', () => {
  const medicos = [{ id: 'm1', nome: 'Dra. Ana Souza' }];
  assert.equal(rotuloMedico(daAna, medicos), 'Dra. Ana Souza');
  assert.equal(rotuloMedico(doBeto, medicos), 'Dr. Beto');
  assert.equal(rotuloMedico(livre, medicos), 'Sem médico (cadastro antigo)');
});
