import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarCadastro, validarEntrada, validarNovaSenha, validarMedico, semErros } from './validacao.js';

const valido = { nome: 'Carla Souza', email: 'carla@teste.dev', telefone: '', senha: 'Senha123', confirmacao: 'Senha123', aceite: true };

test('cadastro válido não tem erros', () => {
  assert.ok(semErros(validarCadastro(valido)));
});

test('cadastro aponta o erro de cada campo com mensagem para a pessoa', () => {
  const erros = validarCadastro({ nome: 'C', email: 'carla', telefone: '123', senha: 'abc', confirmacao: 'xyz', aceite: false });
  assert.match(erros.nome, /3 caracteres/);
  assert.match(erros.email, /e-mail válido/);
  assert.match(erros.telefone, /DDD/);
  assert.match(erros.senha, /8/);
  assert.match(erros.confirmacao, /não conferem/);
  assert.match(erros.aceite, /termos/);
});

test('senha precisa de letras e números', () => {
  assert.match(validarNovaSenha('somenteletras'), /letras e números/);
  assert.match(validarNovaSenha('12345678'), /letras e números/);
  assert.equal(validarNovaSenha('Senha123'), undefined);
});

test('entrada exige e-mail e senha', () => {
  assert.deepEqual(Object.keys(validarEntrada({ email: '', senha: '' })).sort(), ['email', 'senha']);
  assert.ok(semErros(validarEntrada({ email: 'a@b.co', senha: 'x' })));
});

test('médico exige nome e especialidade com tamanho mínimo', () => {
  const erros = validarMedico({ nome: 'Dr', especialidade: '' });
  assert.ok(erros.nome && erros.especialidade);
  assert.ok(semErros(validarMedico({ nome: 'Dra. Ana', especialidade: 'Cardiologia' })));
});
