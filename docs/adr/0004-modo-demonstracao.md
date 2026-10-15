# ADR 0004: Modo demonstração sem senha

Data: 2026-10-04 · Revisada em 2026-10-14 · Situação: aceita

## Contexto
Quem avalia o portfólio precisa entrar e testar os dois papéis em segundos, sem cadastro. Senhas de demonstração escritas no código ou no README viram credenciais públicas de qualquer instalação.

A primeira versão desta decisão gerava senhas a cada partida e as entregava em `GET /api/demo`. A revisão final apontou dois problemas: a senha continuava publicada (só não estava no código) e a paciente de demonstração era **uma só para todo mundo**. Como a API limita cada paciente a 3 consultas futuras, bastavam alguns visitantes agendando para todos os seguintes receberem 409 ("Você já tem 3 consultas marcadas").

## Decisão
- Flag `DEMO_ENABLED` (padrão `false`). Desligada, as rotas `/api/demo` não existem (404).
- `GET /api/demo` (sem login) lista só os papéis disponíveis e os nomes de exibição; nenhum e-mail, nenhuma senha.
- `POST /api/demo/entrar { papel }` devolve uma sessão pronta (o mesmo formato do login):
  - **paciente:** cria uma **paciente efêmera** só para quem clicou, com uma consulta futura, uma cancelada e uma realizada. O limite de 3 consultas vale por visitante, então ninguém herda a agenda nem o limite de outro. Há um teto (`DEMO_MAX_VISITANTES`, padrão 50): passando dele, a visitante mais antiga sai junto com as consultas dela, **desde que tenha pelo menos `DEMO_VIDA_MINIMA_MINUTOS` (padrão 15)**. Se todas são mais novas que isso, a API responde 503 "A demonstração está cheia" com `Retry-After`, e o app mostra a mensagem: assim, quem clica muitas vezes (ou de vários IPs) não derruba as visitas em andamento. O reset apaga todas.
  - **clínica:** entra no gestor de demonstração, compartilhado, que não tem senha utilizável (só se entra nele por esta rota).
- A rota tem limite próprio por IP (`DEMO_ENTRADAS_POR_MINUTO`, padrão 10), porque cada entrada de paciente cria uma conta.
- **Cadastro na demonstração:** a tela de cadastro continua funcionando (faz parte do que o avaliador vê), mas com o modo ligado a conta criada é **temporária**: marcada como demo, entra no mesmo teto e na mesma vida mínima das visitantes efêmeras e some no próximo reset. A tela mostra um aviso discreto disso. A pessoa entra de novo com a própria senha enquanto a conta existir.
- Contas demo são protegidas: não trocam senha nem perfil; o gestor e as visitantes de "Entrar como" não entram por e-mail e senha.
- Banco demo de uma versão antiga (quando as senhas eram publicadas): na partida, a senha do gestor demo é trocada por uma inutilizável (os tokens antigos caem) e a antiga paciente compartilhada é removida.
- O cenário (médicos, agenda, consultas e histórico) é recriado quando o banco está vazio e, com `DEMO_RESET_MINUTOS`, de tempos em tempos. O modo só sobe com um banco exclusivo de demonstração (a API se recusa a ligá-lo num banco com dados reais).

Alternativa considerada e descartada: manter a paciente compartilhada, semear só uma consulta futura e subir o limite de consultas no modo demo. É mais simples, mas o limite continua sendo dividido por todos os visitantes (só demora mais para estourar) e a regra de negócio testada na demo deixaria de ser a mesma da instalação real.

## Consequências
- Nenhuma senha de demonstração existe, nem no código nem em resposta da API; o teste `demo.test.js` falha se uma voltar.
- Cada visitante vê a experiência completa da paciente, com a mesma regra de limite da instalação real.
- Quem entra como clínica divide o gestor com os outros visitantes; por isso, no modo demo:
  - o cenário de exemplo é protegido (403 amigável): não sai, não muda de nome nem de data, e as consultas de exemplo não são canceladas pela clínica;
  - a clínica não cancela consulta de visitante (403): quem agendou cancela pela própria conta;
  - no máximo `DEMO_MAX_BLOQUEADOS` (20) horários do cenário ficam bloqueados ao mesmo tempo (409);
  - horários criados pelos visitantes têm teto próprio (`DEMO_MAX_HORARIOS`, 500, sem contar os do cenário) e só nos próximos `DEMO_JANELA_DIAS` (60) dias, para o teto não se esgotar com datas como 2099; médicos têm teto `DEMO_MAX_MEDICOS` (20);
  - o reset periódico (45 minutos no Render) devolve o cenário original.
  Detalhes na ADR 0005 e em `docs/deploy.md`.
