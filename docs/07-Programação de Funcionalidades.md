# Programação de Funcionalidades

<span style="color:red">Pré-requisitos: <a href="02-Especificação do Projeto.md"> Especificação do Projeto</a></span>, <a href="04-Projeto de Interface.md"> Projeto de Interface</a>, <a href="03-Metodologia.md"> Metodologia</a>, <a href="04-Projeto de Interface.md"> Projeto de Interface</a>, <a href="05-Arquitetura da Solução.md"> Arquitetura da Solução</a>

Implementação da versão 2.0 (outubro de 2026), relacionando cada requisito ao código. Como rodar: [README do código](../src/Markaki/README.md).

| Requisito | Funcionalidade | Telas (app) | API | Testes |
|---|---|---|---|---|
| RF-004 | Cadastro de paciente, login, sessão expirada, trocar senha, sair | `telas/conexao/*`, `telas/comum/Perfil.js`, `TrocarSenha.js` | `routes/auth.js`, `services/auth.js` | `backend/test/auth.test.js` |
| RF-001 | Escolher médico, dia e hora; confirmar; sucesso | `telas/paciente/Profissionais.js`, `DetalheProfissional.js`, `ConfirmarAgendamento.js`, `AgendamentoConcluido.js` | `POST /api/agendamentos` | `backend/test/agendamentos.test.js` |
| RF-001 | Minhas consultas (próximas e histórico) e cancelamento | `telas/comum/Consultas.js`, `DetalheConsulta.js` | `GET /api/agendamentos`, `PATCH .../cancelar` | `agendamentos.test.js` |
| RF-002 | Agenda por médico: bloquear, desbloquear, remover, abrir horários em lote | `telas/gestor/Agenda.js`, `NovosHorarios.js` | `routes/horarios.js` | `backend/test/horarios.test.js` |
| RF-002 | Médicos: cadastrar, editar, remover | `telas/gestor/Medicos.js`, `MedicoForm.js` | `routes/medicos.js` | `backend/test/medicos.test.js` |
| RF-005 | Painel da clínica | `telas/gestor/Painel.js` | `GET /api/painel` | `agendamentos.test.js` (painel) |
| RNF-003 | Identidade, componentes e estados | `src/tema/*`, `src/componentes/*` | | `src/tema/contraste.test.mjs` |

## Estruturas de dados

Tabelas `usuarios`, `medicos`, `horarios` e `agendamentos` no SQLite; ver [Arquitetura da Solução](05-Arquitetura%20da%20Solução.md#modelo-de-dados).

Exemplo de agendamento devolvido pela API:

```json
{
  "id": "6f0c2c1e-...",
  "horario_id": "demo-medico-1-2026-10-05-10:00",
  "medico_nome": "Dra. Helena Duarte",
  "medico_especialidade": "Cardiologia",
  "paciente_nome": "Marina Albuquerque",
  "data": "2026-10-05",
  "hora": "10:00",
  "status": "agendado",
  "situacao": "agendado",
  "criado_em": "2026-10-04T18:13:20.000Z",
  "cancelado_em": null,
  "cancelado_por": null
}
```
