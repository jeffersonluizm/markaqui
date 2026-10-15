# Publicar a demonstração (Render + Vercel, plano gratuito)

A API vai para o **Render** e o app, como site estático (Expo web), para a **Vercel**. Os arquivos já estão no repositório: [`render.yaml`](../render.yaml) e [`src/Markaki/vercel.json`](../src/Markaki/vercel.json). A decisão está no [ADR 0005](adr/0005-hospedagem.md).

Tempo estimado: 15 minutos. Custo: zero.

## 1. Publicar o repositório no GitHub

1. Crie um repositório vazio no GitHub (por exemplo `markaqui`), sem README.
2. Na pasta do projeto:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/markaqui.git
   git push -u origin main
   ```
3. Confira a aba **Actions**: o workflow `CI` roda lint, formatação, testes e o build web.

## 2. API no Render

1. Em [render.com](https://render.com), entre com o GitHub e escolha **New > Blueprint**.
2. Selecione o repositório. O Render lê o `render.yaml` e cria o serviço `markaqui-api` (plano Free).
3. Ele pede o valor de **`CORS_ORIGENS`**. Na primeira vez, deixe `https://markaqui.vercel.app` (ou o nome que a Vercel der no passo 3) e ajuste depois.
4. Aguarde o deploy e anote a URL, por exemplo `https://markaqui-api.onrender.com`.

Variáveis que o blueprint já define:

| Variável | Valor | Para quê |
|---|---|---|
| `NODE_VERSION` | `22` | Versão do Node |
| `FUSO_HORARIO` e `TZ` | `America/Sao_Paulo` | Fuso da clínica. A API calcula "hoje" e "agora" nele (o Render roda em UTC); sem isso, às 14:30 de Brasília a API acharia que são 17:30 |
| `HOST` | `0.0.0.0` | Aceitar conexões do proxy do Render |
| `JWT_SECRET` | gerado pelo Render | Segredo dos tokens (nunca vai para o Git) |
| `DB_FILE` | `/tmp/markaqui.db` | Banco **só de demonstração**, efêmero |
| `DEMO_ENABLED` | `true` | "Entrar como paciente / clínica" sem senha (`GET /api/demo` e `POST /api/demo/entrar`) |
| `DEMO_RESET_MINUTOS` | `45` | Recria médicos, agenda e consultas a cada 45 minutos (e apaga as pacientes efêmeras). O gestor de demonstração é o mesmo para todos os visitantes; o reset desfaz o que mudaram |
| `DEMO_MAX_MEDICOS` e `DEMO_MAX_HORARIOS` | `20` e `500` | Tetos do que os visitantes criam como clínica: médicos contando o cenário de exemplo; horários só os criados pelos visitantes. Passando disso, a API responde 409 com uma mensagem clara |
| `DEMO_JANELA_DIAS` | `60` | Horários novos (ou com data mudada) só nos próximos 60 dias |
| `DEMO_MAX_BLOQUEADOS` | `20` | Horários do cenário bloqueados ao mesmo tempo |
| `DEMO_VIDA_MINIMA_MINUTOS` | `15` | Idade mínima de uma visitante para ceder a vaga quando o teto `DEMO_MAX_VISITANTES` é atingido; antes disso a API responde 503 "A demonstração está cheia" com `Retry-After` |
| `LIMITE_LISTAGEM` | `500` | Itens por listagem (horários, consultas, médicos): nenhuma resposta cresce sem fim |
| `TRUST_PROXY` | `1` | Limite de tentativas por visitante (atrás do proxy). Só use com um proxy na frente: sem ele, o cliente forjaria `X-Forwarded-For` |
| `CORS_ORIGENS` | URL do app na Vercel | Só o app publicado chama a API pelo navegador |

Proteções do modo demonstração (só valem com `DEMO_ENABLED=true`): os registros do cenário de exemplo (ids que começam com `demo-`) não podem ser removidos, renomeados nem mudar de data, e a clínica não cancela as consultas de exemplo; a API responde 403 com uma mensagem explicando o que dá para testar (bloquear e liberar horários, cadastrar médicos e horários novos). O que o visitante cria pode ser editado e removido normalmente. Além disso, a clínica não cancela consulta de visitante (só quem agendou), no máximo 20 horários do cenário ficam bloqueados ao mesmo tempo, e horários novos só valem nos próximos 60 dias.

**Cadastro na demonstração:** a tela de cadastro continua disponível, mas a conta criada é temporária (marcada como demo, conta no teto de visitantes e na vida mínima e some no próximo reset). A tela mostra o aviso "Demonstração: esta conta é temporária...".

Todas as variáveis numéricas são conferidas na partida: um valor que não seja inteiro, ou fora da faixa (ex.: `DEMO_MAX_VISITANTES=abc` ou `0`), faz a API parar com uma mensagem dizendo qual variável corrigir, em vez de desligar a proteção em silêncio.

A demonstração não tem senha nenhuma: cada "Entrar como paciente" cria uma paciente efêmera só para quem clicou (com uma consulta marcada, uma cancelada e uma realizada), e "Entrar como clínica" entra no gestor de demonstração, que não aceita login por senha. Opcionais: `DEMO_MAX_VISITANTES` (padrão 50 pacientes efêmeras ao mesmo tempo; acima disso sai a mais antiga que já tenha 15 minutos) e `DEMO_ENTRADAS_POR_MINUTO` (padrão 10 por visitante). Se a API subir sobre um banco demo de uma versão antiga, a senha publicada do gestor deixa de valer e a antiga paciente compartilhada é removida.

**Conferir:** abra `https://SUA-API.onrender.com/api/saude` (deve responder `{"status":"ok"}`) e `https://SUA-API.onrender.com/api/demo` (lista os dois papéis, sem e-mail nem senha).

## 3. App web na Vercel

1. Em [vercel.com](https://vercel.com), **Add New > Project** e importe o repositório.
2. **Root Directory:** `src/Markaki`. O `vercel.json` já define instalação, build (`node scripts/conferir-api-url.mjs && npx expo export --platform web`), pasta `dist`, rotas da SPA e cabeçalhos de segurança.
3. Em **Environment Variables**, crie `EXPO_PUBLIC_API_URL` = `https://SUA-API.onrender.com/api`. Ela é obrigatória: sem ela (ou apontando para `localhost`, ou sem `https`), o build para com a mensagem `[build] EXPO_PUBLIC_API_URL ...` em vez de publicar um app que procura a API na máquina do visitante. O mesmo script lê a Content-Security-Policy do `vercel.json` e para o build se o host da API não couber no `connect-src` (o navegador bloquearia as chamadas).
4. **Deploy.** Anote a URL (por exemplo `https://markaqui.vercel.app`).
5. Volte ao Render e confira se `CORS_ORIGENS` é exatamente essa URL (sem barra no fim). Se mudou, salve: o serviço reinicia.

**Conferir:**
- Abra a URL da Vercel. Na primeira visita depois de um tempo parado, aparece "Acordando o servidor de demonstração" por até um minuto (o plano gratuito do Render dorme sem uso).
- Na tela inicial, **Explore a demonstração > Entrar como paciente**: agende uma consulta. Saia e **Entrar como clínica**: veja o painel e a agenda.
- Recarregue uma página interna (ex.: `/app/consultas`): deve abrir normalmente.
- Compartilhe o link no WhatsApp ou LinkedIn: a prévia usa `public/og-image.png`. O LinkedIn exige endereço absoluto: troque `content="/og-image.png"` em `src/Markaki/public/index.html` pela URL completa (`https://markaqui.vercel.app/og-image.png`) e publique de novo.

## 4. Abrir no celular

- **Navegador do celular:** basta abrir a URL da Vercel.
- **Expo Go (app nativo):** instale o Expo Go, rode `npx expo start` em `src/Markaki` com `EXPO_PUBLIC_API_URL` apontando para a API do Render no `.env` e leia o QR code. Não precisa de rede local, porque a API está na internet.

## 5. Conferir que a API enxerga o IP de cada visitante (`TRUST_PROXY`)

O limite de tentativas (login, cadastro, "Entrar como") conta por IP. Atrás do proxy do Render, a API só enxerga o IP do visitante se `TRUST_PROXY` for igual ao número de proxies na frente dela (o blueprint usa `1`). Com valor menor, todos os visitantes parecem o mesmo IP e um bloqueia o outro; com valor maior, o visitante consegue inventar um IP no cabeçalho `X-Forwarded-For` e fugir do limite. Depois do deploy:

1. **Logs do Render:** se aparecer `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`, o `TRUST_PROXY` está `0`. Ajuste para `1`.
2. **Cada visitante tem o próprio contador.** Rode duas vezes, de redes diferentes (por exemplo o computador e o celular no 4G), e compare o cabeçalho `RateLimit` (o `r=` é o que sobra):
   ```bash
   curl -si -X POST https://SUA-API.onrender.com/api/auth/login \
     -H "Content-Type: application/json" -d '{"email":"teste@exemplo.invalid","senha":"Errada2026"}' | grep -i "^ratelimit"
   ```
   Da mesma rede, o `r=` cai a cada chamada (4, 3, 2...). Da outra rede, recomeça em 4. Se as duas redes dividem o mesmo contador, há mais de um proxy: suba `TRUST_PROXY` para `2` e repita.
3. **IP inventado não zera o contador.** Repita a chamada acrescentando `-H "X-Forwarded-For: 203.0.113.$RANDOM"`. O `r=` deve continuar caindo. Se ele recomeçar a cada valor inventado, o `TRUST_PROXY` está alto demais: volte um número.

O teste automático `demo.test.js` cobre o comportamento da API com `TRUST_PROXY=1` e `0`; esta conferência valida o número de proxies do ambiente real.

## 6. Trocar os endereços previstos pelos reais

Os nomes `markaqui.vercel.app` e `markaqui-api.onrender.com` são os **endereços previstos**; a Vercel e o Render podem dar outros (por exemplo `markaqui-abc123.vercel.app`) se o nome estiver ocupado. Com as URLs definitivas em mãos:

1. **README:** no bloco do topo, troque o texto "Demonstração online (endereço previsto)" pelos links reais, por exemplo `<b><a href="https://URL-DA-VERCEL">Abrir a demonstração</a></b> · API: <a href="https://URL-DO-RENDER/api/saude">URL-DO-RENDER</a>`, e apague a linha "Link definitivo depois da publicação".
2. **Render:** `CORS_ORIGENS` = URL exata da Vercel (sem barra no fim).
3. **Vercel:** `EXPO_PUBLIC_API_URL` = `https://URL-DO-RENDER/api` e publique de novo (o endereço entra no build).
4. **Prévia de link:** em `src/Markaki/public/index.html`, use a URL completa da imagem (`https://URL-DA-VERCEL/og-image.png`).
5. **CSP:** o `connect-src` do `src/Markaki/vercel.json` vem com `https://*.onrender.com` só para o primeiro deploy funcionar antes de a URL existir. Com a URL definitiva, **fixe o host exato** (por exemplo `connect-src 'self' https://markaqui-api.onrender.com`): assim o site só conversa com a sua API, e não com qualquer serviço do Render. Se a API ficar em outro domínio, o build avisa (`[build] ... não cabe no connect-src`) até o `vercel.json` ser ajustado.
6. Abra a URL da Vercel numa janela anônima e repita a seção "Conferir" do passo 3.

## Segurança da demonstração

- A API só liga o modo demonstração num banco vazio ou criado pelo próprio modo demo (marcado como banco de demonstração). Num banco com dados reais ela se recusa a subir: nunca abre a conta de um gestor real nem apaga dados.
- Não há senha de demonstração. O gestor demo é compartilhado: o cenário de exemplo é protegido (403), o que os visitantes criam tem teto e tudo volta ao original no próximo reset (45 min). Cadastros de visitantes ficam visíveis para quem entra como clínica até lá.
- O app web na Vercel envia uma Content-Security-Policy que só permite chamar o Render (`connect-src https://*.onrender.com`). Depois da publicação, troque pelo host exato da API (passo 6). O build confere se a `EXPO_PUBLIC_API_URL` cabe nessa CSP.

- O banco hospedado é exclusivo da demo e descartável: nunca aponte `DB_FILE` para dados reais com `DEMO_ENABLED=true`.
- Contas demo não trocam senha nem perfil; qualquer outra bagunça some no próximo reset.
- HTTPS é feito pelo Render e pela Vercel. A API envia os cabeçalhos do `helmet`; o site, os do `vercel.json`.
- Para uma instalação real: `DEMO_ENABLED=false`, banco em disco persistente e gestor criado com `npm run criar-gestor`.
