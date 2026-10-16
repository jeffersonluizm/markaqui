# ADR 0002: SQLite no lugar do arquivo JSON

Data: 2026-10-04 · Situação: aceita

## Contexto
A API gravava tudo num `database.json`: cada requisição relia e fazia o parse do arquivo inteiro; cada escrita regravava o arquivo, protegida por uma fila global (sem ela, duas escritas simultâneas perdiam dados ou marcavam o mesmo horário para duas pessoas). O custo cresce com o tamanho da base e as escritas não acontecem em paralelo.

## Decisão
Trocar por **SQLite (better-sqlite3)** atrás da mesma interface de repositórios: cada escrita é uma transação `IMMEDIATE` (verificar e gravar juntos), modo WAL, índice por médico, e dois índices UNIQUE parciais como última defesa (um agendamento ativo por horário; uma consulta ativa por paciente no mesmo momento). As hipóteses de desempenho foram escritas antes e a API foi medida antes (JSON) e depois (SQLite) com o mesmo roteiro (docs/carga).

## Consequências
- Serviços e rotas não mudaram na troca: só o repositório (o desenho em camadas pagou aqui).
- Sem servidor de banco para instalar: o arquivo fica em `backend/dados/` (fora do Git).
- Um único processo de API escreve no banco. Para várias instâncias, o próximo passo é PostgreSQL com os mesmos repositórios.
