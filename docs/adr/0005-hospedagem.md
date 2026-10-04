# ADR 0005: Hospedagem gratuita (Render para a API, Vercel para o app web)

Data: 2026-10-04 · Situação: aceita (publicação feita pelo dono do repositório)

## Contexto
O avaliador abre um link e testa; não instala nada. As camadas gratuitas "dormem" sem uso e não têm disco persistente.

## Decisão
- API no **Render** (`render.yaml`): Node, health check `/api/saude`, `DEMO_ENABLED=true`, SQLite em `/tmp` recriado com o cenário a cada partida e a cada 6 horas, `TRUST_PROXY=1`, CORS só para a origem do app.
- App como **Expo web** estático na **Vercel** (`vercel.json`), com `EXPO_PUBLIC_API_URL` apontando para o Render.
- O app mostra "Acordando o servidor de demonstração" enquanto a API sai do repouso (30 a 60 s), em vez de um erro.

## Consequências
- Custo zero; o primeiro acesso depois de um tempo parado é lento.
- Os dados da demo são descartáveis por definição (banco efêmero), o que combina com o modo demonstração.
- Passo a passo em `docs/deploy.md`.
