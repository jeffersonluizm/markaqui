# ADR 0004: Modo demonstração sem senha no código

Data: 2026-10-04 · Situação: aceita

## Contexto
Quem avalia o portfólio precisa entrar e testar os dois papéis em segundos, sem cadastro. Senhas de demonstração escritas no código ou no README viram credenciais públicas de qualquer instalação.

## Decisão
- Flag `DEMO_ENABLED` (padrão `false`). Ligada, a API cria uma paciente e um gestor de demonstração com senhas vindas do `.env` ou **geradas a cada partida**.
- `GET /api/demo` (sem login) devolve essas contas; com o modo desligado, responde 404. O app mostra o cartão "Explore a demonstração" com "Entrar como paciente / clínica".
- Contas demo são protegidas: não trocam senha nem perfil.
- O cenário (médicos, agenda, consultas e histórico) é recriado quando o banco está vazio e, com `DEMO_RESET_MINUTOS`, de tempos em tempos. O modo só deve ser ligado com um banco exclusivo de demonstração.

## Consequências
- Nenhuma senha conhecida no repositório; o teste `demo.test.js` falha se uma voltar.
- Qualquer visitante da demo pode bagunçar os dados; o reset periódico devolve o cenário original.
