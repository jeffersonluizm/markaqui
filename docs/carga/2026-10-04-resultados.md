# Teste de carga da API do Markaqui (2026-10-04)

Objetivo: medir a API antes e depois da troca do armazenamento (arquivo JSON com fila global de escrita para SQLite com transações) e verificar a regra de negócio mais importante sob concorrência: **um horário nunca recebe dois agendamentos ativos**.

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

- Ambiente descartável: pasta temporária do sistema com arquivo de dados próprio (`DATA_FILE`, depois `DB_FILE`), API em `127.0.0.1` na porta 3101, nunca o `database.json` do repositório.
- A API roda num processo separado (`carga/servidor.js`), que informa CPU (em % de um núcleo) e pico de memória (RSS) pelo IPC.
- Gerador: `autocannon` 8 (programático) e, no S2, `fetch` do Node com 200 pedidos em voo.
- Aquecimento de 3 s antes de cada cenário de vazão. Latência em p50, p97,5 e p99 (o autocannon não calcula p95; no S2 o p95 é calculado pelo script).
- Máquina: Ryzen 5 5600 (6 núcleos, 12 threads), 16 GB, Windows 11, Node 24. **Gerador e servidor dividem a mesma máquina**: os números servem para comparar antes e depois, não como capacidade absoluta.
- Trava `.carga-lock` na raiz da oficina: só uma carga por vez na máquina.

Como reproduzir (na pasta `src/Markaki/backend`):

```
npm run carga -- --armazenamento json    # antes (só na versão com JSON)
npm run carga -- --armazenamento sqlite  # depois
```

## Resultados

(preenchido depois das medições)
