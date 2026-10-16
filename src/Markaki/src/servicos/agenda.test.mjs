import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparPorDia, separarConsultas, proximosDias, gradeDeHoras, especialidades } from './agenda.js';

test('agruparPorDia mantém a ordem e junta os horários do mesmo dia', () => {
  const grupos = agruparPorDia([
    { id: 'a', data: '2030-02-01', hora: '09:00' },
    { id: 'b', data: '2030-02-01', hora: '10:00' },
    { id: 'c', data: '2030-02-03', hora: '08:00' },
  ]);
  assert.deepEqual(
    grupos.map((g) => [g.data, g.horarios.map((h) => h.id)]),
    [
      ['2030-02-01', ['a', 'b']],
      ['2030-02-03', ['c']],
    ]
  );
});

test('separarConsultas: próximas em ordem crescente, histórico do mais recente', () => {
  const { proximas, historico } = separarConsultas([
    { id: '1', data: '2030-01-05', hora: '09:00', situacao: 'realizado' },
    { id: '2', data: '2030-02-01', hora: '10:00', situacao: 'agendado' },
    { id: '3', data: '2030-01-20', hora: '08:00', situacao: 'agendado' },
    { id: '4', data: '2030-01-25', hora: '08:00', situacao: 'cancelado' },
  ]);
  assert.deepEqual(
    proximas.map((c) => c.id),
    ['3', '2']
  );
  assert.deepEqual(
    historico.map((c) => c.id),
    ['4', '1']
  );
});

test('proximosDias devolve datas AAAA-MM-DD a partir de amanhã', () => {
  assert.deepEqual(proximosDias(3, new Date(2030, 0, 30)), ['2030-01-31', '2030-02-01', '2030-02-02']);
});

test('gradeDeHoras de meia em meia hora no expediente', () => {
  const grade = gradeDeHoras({ inicio: '08:00', fim: '10:00', passoMin: 30 });
  assert.deepEqual(grade, ['08:00', '08:30', '09:00', '09:30']);
});

test('especialidades distintas e em ordem alfabética', () => {
  assert.deepEqual(
    especialidades([{ especialidade: 'Pediatria' }, { especialidade: 'Cardiologia' }, { especialidade: 'Pediatria' }]),
    ['Cardiologia', 'Pediatria']
  );
});
