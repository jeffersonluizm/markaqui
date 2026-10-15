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
| `DEMO_MAX_MEDICOS` e `DEMO_MAX_HORARIOS` | `20` e `500` | Tetos do que os visitantes criam como clínica (contando o cenário de exemplo). Passando disso, a API responde 409 com uma mensagem clara |
| `LIMITE_LISTAGEM` | `500` | Itens por listagem (horários, consultas, médicos): nenhuma resposta cresce sem fim |
| `TRUST_PROXY` | `1` | Limite de tentativas por visitante (atrás do proxy). Só use com um proxy na frente: sem ele, o cliente forjaria `X-Forwarded-For` |
| `CORS_ORIGENS` | URL do app na Vercel | Só o app publicado chama a API pelo navegador |

Proteções do modo demonstração (só valem com `DEMO_ENABLED=true`): os registros do cenário de exemplo (ids que começam com `demo-`) não podem ser removidos, renomeados nem mudar de data, e a clínica não cancela as consultas de exemplo; a API responde 403 com uma mensagem explicando o que dá para testar (bloquear e liberar horários, cadastrar médicos e horários novos). O que o visitante cria pode ser editado e removido normalmente.

A demonstração não tem senha nenhuma: cada "Entrar como paciente" cria uma paciente efêmera só para quem clicou (com uma consulta marcada, uma cancelada e uma realizada), e "Entrar como clínica" entra no gestor de demonstração, que não aceita login por senha. Opcionais: `DEMO_MAX_VISITANTES` (padrão 50 pacientes efêmeras ao mesmo tempo; acima disso a mais antiga sai) e `DEMO_ENTRADAS_POR_MINUTO` (padrão 10 por visitante).

**Conferir:** abra `https://SUA-API.onrender.com/api/saude` (deve responder `{"status":"ok"}`) e `https://SUA-API.onrender.com/api/demo` (lista os dois papéis, sem e-mail nem senha).

## 3. App web na Vercel

1. Em [vercel.com](https://vercel.com), **Add New > Project** e importe o repositório.
2. **Root Directory:** `src/Markaki`. O `vercel.json` já define instalação, build (`npx expo export --platform web`), pasta `dist`, rotas da SPA e cabeçalhos de segurança.
3. Em **Environment Variables**, crie `EXPO_PUBLIC_API_URL` = `https://SUA-API.onrender.com/api`.
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

## 5. Atualizar os links do README

Troque os marcadores `https://markaqui.vercel.app` e `https://markaqui-api.onrender.com` no [README](../README.md) pelas URLs reais.

## Segurança da demonstração

- A API só liga o modo demonstração num banco vazio ou criado pelo próprio modo demo (marcado como banco de demonstração). Num banco com dados reais ela se recusa a subir: nunca publica a senha de um gestor real nem apaga dados.
- A senha do gestor demo é pública por definição: qualquer visitante pode remover médicos ou cadastrar textos até o próximo reset (6 h). Cadastros de visitantes também ficam visíveis para quem entra como clínica.
- O app web na Vercel envia uma Content-Security-Policy que só permite chamar a API do Render (`connect-src https://*.onrender.com`). Se a API ficar em outro domínio, ajuste o `vercel.json`.

- O banco hospedado é exclusivo da demo e descartável: nunca aponte `DB_FILE` para dados reais com `DEMO_ENABLED=true`.
- Contas demo não trocam senha nem perfil; qualquer outra bagunça some no próximo reset.
- HTTPS é feito pelo Render e pela Vercel. A API envia os cabeçalhos do `helmet`; o site, os do `vercel.json`.
- Para uma instalação real: `DEMO_ENABLED=false`, banco em disco persistente e gestor criado com `npm run criar-gestor`.
