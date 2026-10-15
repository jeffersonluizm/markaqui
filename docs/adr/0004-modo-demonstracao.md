# ADR 0004: Modo demonstração sem senha

Data: 2026-10-04 · Revisada em 2026-10-14 · Situação: aceita

## Contexto
Quem avalia o portfólio precisa entrar e testar os dois papéis em segundos, sem cadastro. Senhas de demonstração escritas no código ou no README viram credenciais públicas de qualquer instalação.

A primeira versão desta decisão gerava senhas a cada partida e as entregava em `GET /api/demo`. A revisão final apontou dois problemas: a senha continuava publicada (só não estava no código) e a paciente de demonstração era **uma só para todo mundo**. Como a API limita cada paciente a 3 consultas futuras, bastavam alguns visitantes agendando para todos os seguintes receberem 409 ("Você já tem 3 consultas marcadas").

## Decisão
- Flag `DEMO_ENABLED` (padrão `false`). Desligada, as rotas `/api/demo` não existem (404).
- `GET /api/demo` (sem login) lista só os papéis disponíveis e os nomes de exibição; nenhum e-mail, nenhuma senha.
- `POST /api/demo/entrar { papel }` devolve uma sessão pronta (o mesmo formato do login):
  - **paciente:** cria uma **paciente efêmera** só para quem clicou, com uma consulta futura, uma cancelada e uma realizada. O limite de 3 consultas vale por visitante, então ninguém herda a agenda nem o limite de outro. Há um teto (`DEMO_MAX_VISITANTES`, padrão 50): passando dele, a visitante mais antiga sai junto com as consultas dela. O reset apaga todas.
  - **clínica:** entra no gestor de demonstração, compartilhado, que não tem senha utilizável (só se entra nele por esta rota).
- A rota tem limite próprio por IP (`DEMO_ENTRADAS_POR_MINUTO`, padrão 10), porque cada entrada de paciente cria uma conta.
- Contas demo são protegidas: não trocam senha nem perfil e não entram por e-mail e senha.
- O cenário (médicos, agenda, consultas e histórico) é recriado quando o banco está vazio e, com `DEMO_RESET_MINUTOS`, de tempos em tempos. O modo só sobe com um banco exclusivo de demonstração (a API se recusa a ligá-lo num banco com dados reais).

Alternativa considerada e descartada: manter a paciente compartilhada, semear só uma consulta futura e subir o limite de consultas no modo demo. É mais simples, mas o limite continua sendo dividido por todos os visitantes (só demora mais para estourar) e a regra de negócio testada na demo deixaria de ser a mesma da instalação real.

## Consequências
- Nenhuma senha de demonstração existe, nem no código nem em resposta da API; o teste `demo.test.js` falha se uma voltar.
- Cada visitante vê a experiência completa da paciente, com a mesma regra de limite da instalação real.
- Quem entra como clínica divide o gestor com os outros visitantes; o que proteger nesse papel está na ADR 0005 e em `docs/deploy.md`, e o reset periódico devolve o cenário original.
