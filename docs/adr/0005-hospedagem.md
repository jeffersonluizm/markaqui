# ADR 0005: Hospedagem gratuita (Render para a API, Vercel para o app web)

Data: 2026-10-04 · Revisada em 2026-10-14 · Situação: aceita (publicação feita pelo dono do repositório)

## Contexto
O avaliador abre um link e testa; não instala nada. As camadas gratuitas "dormem" sem uso e não têm disco persistente.

## Decisão
- API no **Render** (`render.yaml`): Node, health check `/api/saude`, `DEMO_ENABLED=true`, SQLite em `/tmp` recriado com o cenário a cada partida e a cada 45 minutos, `TRUST_PROXY=1`, CORS só para a origem do app.
- Como o gestor de demonstração é compartilhado, o modo demo protege o cenário de exemplo (ids `demo-*` não saem, não mudam de nome nem de data, e as consultas de exemplo não são canceladas pela clínica), põe teto no que os visitantes criam (`DEMO_MAX_MEDICOS=20`, `DEMO_MAX_HORARIOS=500`) e toda listagem tem limite (`LIMITE_LISTAGEM=500`). O reset de 45 minutos desfaz o resto.
- App como **Expo web** estático na **Vercel** (`vercel.json`), com `EXPO_PUBLIC_API_URL` apontando para o Render.
- O app mostra "Acordando o servidor de demonstração" enquanto a API sai do repouso (30 a 60 s), em vez de um erro.

## Consequências
- Custo zero; o primeiro acesso depois de um tempo parado é lento.
- Os dados da demo são descartáveis por definição (banco efêmero), o que combina com o modo demonstração. Quem está no meio de uma visita quando o reset acontece volta à tela inicial e entra de novo com um clique.
- Passo a passo em `docs/deploy.md`.
