# ADR 0001: Clínica médica em vez do agendamento B2B genérico

Data: 2026-10-04 · Situação: aceita

## Contexto
A proposta acadêmica (docs/01 e docs/02) descrevia um app de agendamento B2B para empresas prestadoras de serviço, com serviços com preço, notificações push e painel de receita. O código entregue no semestre, porém, sempre foi de clínica: médicos, especialidades, horários por médico e consultas. Documentação e código contavam histórias diferentes.

## Decisão
A versão 2.0 assume o domínio de **clínica médica** com dois papéis: paciente (agenda para si) e gestor da clínica (administra médicos, agenda e consultas). Médico faz o papel do "profissional" e especialidade, o do "serviço". A proposta original fica nos docs como registro histórico, com a situação de cada requisito.

## Consequências
- O produto ficou coerente de ponta a ponta (README, telas, API e docs falam a mesma língua).
- Saem do escopo serviços com preço, receita e várias empresas (multi-inquilino).
- Agendamento ganha regras próprias de clínica: uma consulta ativa por horário, nada no passado, limite de consultas por paciente.
