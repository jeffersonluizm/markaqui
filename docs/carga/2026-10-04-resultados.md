# Teste de carga da API do Markaqui

Objetivo: medir a API antes e depois da troca do armazenamento (arquivo JSON com fila global de escrita para SQLite com transações) e verificar a regra de negócio mais importante sob concorrência: **um horário nunca recebe dois agendamentos ativos**. Hipóteses escritas em 04/10/2026, antes de qualquer medição; medições finais em 13 e 14/10/2026.

## Hipóteses (escritas antes de medir)

| # | Cenário | Hipótese (JSON, antes) | Hipótese (SQLite, depois) |
|---|---|---|---|
| S1 | `GET /api/horarios?medico_id=` com 100 horários, 50 conexões | >= 1.500 req/s, p97,5 < 50 ms | igual ou melhor (consulta com índice) |
| S1b | o mesmo com 1.000 e 10.000 horários | a vazão cai quase linearmente com o tamanho do arquivo, porque cada GET relê e faz o parse do JSON inteiro; com 10.000 horários, < 150 req/s e p97,5 > 300 ms | a vazão quase não depende do total de horários (índice por médico): com 10.000, >= 5x a vazão do JSON |
| S2 | 200 horários livres, 20 `POST /api/agendamentos` simultâneos por horário (4.000 pedidos) | 0 agendamento duplicado (a fila global serializa); exatamente 200 respostas 201 | 0 duplicado, garantido também pelo índice UNIQUE parcial |
| S3 | escrita (alternar disponibilidade) com 1, 10, 50 e 100 conexões | a vazão de escrita não sobe com a concorrência (fila global); teto entre 150 e 400 escritas/s com 100 horários e < 30/s com 10.000; a latência cresce com a fila (lei de Little) | teto bem mais alto (escrita de uma linha, não do arquivo todo); com 10.000 horários, >= 10x o JSON |
| S4 | misto 90% leitura / 10% escrita, degraus de 10 a 300 conexões | ponto de quebra (p97,5 > 2 s ou erros > 1%) antes de 300 conexões com 10.000 horários; a fila não tem limite, então a memória cresce | sem quebra até 300 conexões |
| S5 | 50 leitores e 50 escritores ao mesmo tempo (Windows) | possível `EPERM`/`EBUSY` no `rename` com leitura simultânea, gerando respostas 500; hipótese: > 0 erros | 0 erros (sem troca de arquivo) |
| S6 | `POST /api/auth/login` (só depois, com bcrypt custo 10) | não se aplica (não havia login) | entre 5 e 30 logins/s por núcleo; o limitador devolve 429 a partir da 6ª tentativa por minuto |
| S7 | `POST /api/medicos` com corpo de 90 KB | aceito (limite padrão de 100 KB, sem limite por campo); o arquivo cresce cerca de 90 KB por pedido e degrada S1 | recusado com 413 (limite de 10 KB) e 400 por campo longo |

## Protocolo

- Ambiente descartável: pasta temporária do sistema com arquivo de dados próprio (`DATA_FILE` no JSON, `DB_FILE` no SQLite), API em `127.0.0.1` na porta 3101, nunca um banco do repositório.
- A API roda num processo separado (`carga/servidor.js`), que informa CPU (em % de um núcleo) e pico de memória (RSS) pelo IPC.
- Gerador: `autocannon` 8 (programático) e, no S2, `fetch` do Node com 200 pedidos em voo.
- Aquecimento de 3 s antes de cada cenário de vazão. Latência em p50, p97,5 e p99 (o autocannon não calcula p95; no S2 o p95 é calculado pelo script).
- Máquina: Ryzen 5 5600 (6 núcleos, 12 threads), 16 GB, Windows 11, Node 24.11.1. **Gerador e servidor dividem a mesma máquina**: os números servem para comparar versões, não como capacidade absoluta.
- Trava `.carga-lock` na raiz da oficina, com caminho absoluto (o roteiro recusa caminho relativo): só uma carga por vez na máquina. A partir das rodadas Antes e Depois, o resumo grava a janela exata da medição (`medicaoInicio` e `medicaoFim`) e o nome da trava usada (`trava`, só o nome, sem o caminho da máquina).

Como reproduzir, na pasta `src/Markaki/backend`:

```
# Antes: API com arquivo JSON (commit 27c2754), com a pasta carga/ atual copiada para dentro
npm run carga -- --armazenamento json --trava "<caminho absoluto>/.carga-lock" --saida <arquivo.json>
# Depois: a mesma API com SQLite (commit 3c2b2b1); Final: a versão atual
npm run carga -- --armazenamento sqlite --trava ... --saida ...
npm run carga -- --armazenamento final --trava ... --saida ...
# Gráfico
node carga/grafico.js <antes.json> <depois.json> ../../../docs/carga/2026-10-14-grafico.svg
```

## Três versões medidas

| Versão | Commit | Janela da medição (horário de Brasília) | Resumo |
|---|---|---|---|
| **Antes**: arquivo JSON e fila global | `27c2754` | 14/10/2026, 20:55:51 a 21:00:13 | [`dados/2026-10-14-json.json`](dados/2026-10-14-json.json) |
| **Depois**: SQLite, mesma API (sem login) | `3c2b2b1` | 14/10/2026, 00:14:32 a 00:18:47 | [`dados/2026-10-13-sqlite.json`](dados/2026-10-13-sqlite.json) |
| **Final**: SQLite com login, papéis, validações, helmet e limites | `341ea71` | 13/10/2026, fim às 23:37 (início aproximado, 23:13) | [`dados/2026-10-13-final.json`](dados/2026-10-13-final.json) |

A comparação do armazenamento é **Antes x Depois**: a mesma API, só o repositório muda. A versão **Final** mostra quanto custa a segurança (token conferido e usuário lido do banco a cada requisição, validações e limites).

Rodadas descartadas: a de 04/10 (outras cargas na máquina e um erro do roteiro que mandava o S6 e o S7 para a raiz da API) e a do JSON de 13/10 (21:34 a 22:01), que cruzou com a carga do Cineclube, cujo roteiro não respeitava a trava (janelas dele: 04/10 18:26 a 18:47 e 13/10 21:39 a 22:06). O que cada resumo comprova:

- **Antes** e **Depois**: o arquivo traz `medicaoInicio`, `medicaoFim` e `trava`, ou seja, a janela exata e a prova de que a rodada segurou a trava. Nenhuma das duas cruza as janelas do Cineclube.
- **Final**: rodou antes de o roteiro gravar esses campos. O arquivo só traz o fim (`data`, 23:37 de Brasília); o início (por volta de 23:13) vem do registro da sessão, e **o arquivo não comprova que a trava foi usada**. A janela termina mais de uma hora depois da última carga conhecida do Cineclube (até 22:06), então não há sobreposição conhecida, mas os números da Final pesam menos que os de Antes e Depois. Ela serve para mostrar a ordem de grandeza do custo da segurança, não como medição de referência.

## Resultados

![Leitura, escrita e latência: arquivo JSON (antes) e SQLite (depois)](2026-10-14-grafico.svg)

Cada célula: requisições por segundo / latência p97,5 em ms / falhas (respostas 5xx, erros de conexão e timeouts).

| Cenário | Variante | Antes (JSON) | Depois (SQLite) | Final (SQLite e login) |
|---|---|---|---|---|
| S1 | 100 horários, 50 conexões | 2.816 / 27 / 0 | 6.685 / 11 / 0 | 3.997 / 13 / 0 |
| S1b | 1.000 horários, 50 conexões | 732 / 99 / 0 | 3.912 / 23 / 0 | 3.045 / 18 / 0 |
| S1b | 10.000 horários, 50 conexões | 93 / 620 / 0 | 1.266 / 48 / 0 | 910 / 60 / 0 |
| S3 | 100 horários, 1 conexão | 183 / 21 / 0 | 3.962 / 0 / 0 | 2.705 / 0 / 0 |
| S3 | 100 horários, 10 conexões | 145 / 423 / 0 | 6.122 / 2 / 0 | 3.710 / 3 / 0 |
| S3 | 100 horários, 50 conexões | 54 / 2.490 / 0 | 5.396 / 12 / 0 | 3.544 / 16 / 0 |
| S3 | 100 horários, 100 conexões | 85 / 3.791 / 0 | 5.606 / 20 / 0 | 3.710 / 29 / 0 |
| S3 | 10.000 horários, 1 conexão | 26 / 95 / 0 | 3.514 / 0 / 0 | 2.614 / 0 / 0 |
| S3 | 10.000 horários, 10 conexões | 37 / 805 / 0 | 6.120 / 2 / 0 | 3.466 / 3 / 0 |
| S3 | 10.000 horários, 50 conexões | 43 / 1.455 / 0 | 5.863 / 10 / 0 | 3.312 / 17 / 0 |
| S3 | 10.000 horários, 100 conexões | 42 / 3.123 / 0 | 5.426 / 21 / 0 | 3.260 / 35 / 0 |
| S4 | 10.000 horários, 10 conexões | 91 / 695 / **75** | 1.423 / 9 / 0 | 773 / 13 / 0 |
| S4 | 10.000 horários, 50 conexões | 92 / 2.902 / **44** | 1.439 / 39 / 0 | 794 / 71 / 0 |
| S4 | 10.000 horários, 100 conexões | 90 / 1.072 / 0 | 1.423 / 91 / 0 | 888 / 135 / 0 |
| S4 | 10.000 horários, 200 conexões | 108 / 2.018 / 0 | 1.230 / 191 / 0 | 855 / 265 / 0 |
| S4 | 10.000 horários, 300 conexões | 83 / 7.273 / **4.663** | 1.433 / 250 / 0 | 920 / 407 / 0 |
| S5 | 1.000 horários, 50 leitores | 736 / 85 / 0 | 2.677 / 22 / 0 | 1.342 / 38 / 0 |
| S5 | 1.000 horários, 50 escritores | 6 / 8.867 / **127 (100%)** | 2.673 / 22 / 0 | 1.340 / 38 / 0 |
| S7 | leitura antes dos corpos grandes | 722 / 101 / 0 | 5.295 / 11 / 0 | 3.014 / 19 / 0 |
| S7 | POST de 90 KB, 10 conexões | 22 / 630 / 0 (111 aceitos; arquivo com 10 MB) | 23 / 2.158 / 0 (116 aceitos; banco com 14,6 MB) | 3.783 / 4 / 0 (**18.912 recusados com 413**) |
| S7 | leitura depois dos corpos grandes | **20** / 3.064 / 0 | 4.867 / 12 / 0 | 3.040 / 18 / 0 |

S2, corretude sob concorrência (4.000 pedidos, 200 em voo, 20 por horário):

| Versão | Aceitos | Agendamentos ativos | **Duplicados** | Recusados | req/s | p50 / p95 / p99 (ms) |
|---|---|---|---|---|---|---|
| Antes (JSON) | 200 | 200 | **0** | 3.800 (400) | 528 | 296 / 730 / 1.008 |
| Depois (SQLite) | 200 | 200 | **0** | 3.800 (400) | 2.508 | 64 / 184 / 238 |
| Final | 200 | 200 | **0** | 3.800 (409, "acabou de ser reservado") | 2.685 | 65 / 116 / 181 |

S6, login com bcrypt custo 10 (só na versão final): 16 logins/s com 1 conexão (p50 de 57 ms), 16/s com 10 (p97,5 de 1.090 ms) e 15/s com 50 (p97,5 de 3.019 ms). Com o limitador padrão, os 8 logins seguidos responderam 429.

Memória da API (pico de RSS) no S4 com 300 conexões: 1.130 MB no JSON, 221 MB no SQLite e 225 MB na versão final.

## Hipóteses: confirmadas ou refutadas

| # | Resultado |
|---|---|
| S1 | **Confirmada.** JSON com 100 horários: 2.816 req/s e p97,5 de 27 ms. SQLite: 6.685 req/s. |
| S1b | **Confirmada.** Com 10.000 horários o JSON cai para 93 req/s e p97,5 de 620 ms (cada leitura faz o parse do arquivo inteiro). Entre 100 e 1.000 horários a queda é menor que linear (o custo fixo da requisição pesa), mas acompanha o tamanho do arquivo. O SQLite fica em 1.266 req/s: **13,6 vezes** o JSON (hipótese: pelo menos 5). |
| S2 | **Confirmada nas três versões.** Exatamente 200 aceitos, **0 agendamento duplicado** e nenhum horário livre com agendamento ativo. No JSON quem garante é a fila global; no SQLite, a transação IMMEDIATE (o índice UNIQUE parcial é a última defesa e não precisou agir). |
| S3 | **Confirmada**, com um detalhe refutado. A vazão de escrita do JSON não sobe com a concorrência (100 horários: 183, 145, 54 e 85 escritas/s) e a latência cresce com a fila (p97,5 de 21 ms até 3,8 s). Com 10.000 horários o teto ficou entre 26 e 43 escritas/s, um pouco acima dos "menos de 30" previstos. O SQLite escreve de 3.514 a 6.122 vezes por segundo: **cerca de 140 vezes** o JSON com 10.000 horários (hipótese: 10). |
| S4 | **Confirmada.** O JSON quebra já com 10 conexões (8% de respostas 500, e p97,5 de 2,9 s com 50); com 300, são 4.663 erros de conexão e p97,5 de 7,3 s. A memória sobe de 381 MB para 1,1 GB (a fila não tem limite). O SQLite não quebra até 300 conexões: 1.433 req/s, p97,5 de 250 ms e nenhum erro. |
| S5 | **Confirmada.** No JSON, **100% das escritas** concorrentes com leituras falharam (127 de 127 respostas 500). Causa diagnosticada: `EPERM` no `fs.rename` do arquivo temporário sobre o `database.json` enquanto leitores o mantêm aberto (Windows); num teste isolado de 8 s, 119 de 124 escritas falharam com esse erro. No SQLite: nenhum erro e 2.673 escritas/s. |
| S6 | **Confirmada.** 15 a 16 logins/s, dentro da faixa prevista (5 a 30): o bcrypt é caro de propósito. O 429 apareceu, mas o próprio roteiro gasta as 5 tentativas do minuto ao entrar com as contas de carga, então os 8 pedidos deram 429. A sequência exata (5 respostas 401 e depois 429) é verificada no teste automatizado `auth.test.js`. |
| S7 | **Confirmada.** O JSON aceitou 111 corpos de 90 KB, o arquivo chegou a 10 MB e a leitura caiu de 722 para **20 req/s**. O SQLite sem limite (Depois) também aceitou, mas a leitura quase não mudou, porque a consulta pelo índice não depende do tamanho dos outros dados. A versão final recusa tudo com 413 e o banco fica com 0,2 MB. |

O custo da segurança na versão final é de 20% a 50% da vazão em relação ao SQLite sem login: cada requisição confere o token e lê o usuário no banco (o papel nunca vem do token). Ainda assim, a versão final supera o JSON em todos os cenários.

## Limitações

- Gerador (autocannon, Node) e API dividem a mesma máquina e disputam CPU: os números comparam versões, não medem capacidade de produção. A API ficou perto de 100% de um núcleo (o Node atende numa thread só).
- Uma rodada por versão, sem repetição estatística: diferenças pequenas (menos de 15%) não devem ser lidas como melhoria.
- O S6 com o limitador padrão não mostrou a sequência 401 antes do 429 (ver acima).
- O teste isolado do S5 (8 s, sem carga externa) rodou fora da trava.
- O SQLite foi medido com um processo; o desenho não atende várias instâncias da API escrevendo no mesmo arquivo.
