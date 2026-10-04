# ADR 0003: Autenticação por token e papel lido do banco

Data: 2026-10-04 · Situação: aceita

## Contexto
Antes, qualquer pessoa gerenciava médicos e horários e via as consultas de todo mundo (nome de paciente e especialidade: dado de saúde, LGPD). O app roda no celular (Expo) e no navegador.

## Decisão
- Login por e-mail e senha; senha com **bcrypt** (custo 10); resposta igual para e-mail inexistente e senha errada.
- Sessão por **token JWT HS256** no cabeçalho `Authorization: Bearer` (validade 8 h, segredo do ambiente com 32+ caracteres; sem ele a API não sobe). Token e não cookie: o app nativo não tem cookies de navegador, e sem cookie não há CSRF.
- O **papel é lido do banco a cada requisição** (o token não carrega privilégio). Trocar a senha incrementa a versão do token e derruba as sessões antigas.
- Autocadastro cria só paciente; gestor real só por `npm run criar-gestor`.
- A paciente vê apenas os próprios dados; consulta de outra pessoa responde 404.
- Limites: 5 tentativas de login/cadastro/troca de senha por minuto por IP, 300 requisições por minuto, corpo de 10 KB, 3 consultas futuras ativas por paciente.

## Consequências
- No celular o token fica no armazenamento seguro do sistema (expo-secure-store); no navegador, no `localStorage` (limitação documentada).
- Não há revogação individual de sessão além da troca de senha.
