import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estaAgendado } from './horarios.js';

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
