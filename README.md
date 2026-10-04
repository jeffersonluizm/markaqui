

# Markaqui

<div align="center">
  <img src="https://github.com/user-attachments/assets/2fea6641-ae52-44e1-864e-bd95ef7ffad8" width="450" alt="Imagem centralizada">
</div>
Video apresentando o projeto.
https://github.com/user-attachments/assets/f3cb8a0c-000a-4bbd-80e0-ebbba01055bd
<div>



</div>


`Análise e Desenvolvimento de Sistemas`

`Projeto: Desenvolvimento de uma Aplicação Móvel em um Ambiente de Negócio`

`Terceiro Semestre`

O Markaqui é um aplicativo móvel de agendamento desenvolvido para o ambiente de negócios B2B, focado em empresas prestadoras de serviço. A plataforma ataca diretamente a ineficiência, os erros e as frustrações dos processos de agendamento manuais, como trocas de e-mails e telefonemas, que não atendem mais à necessidade de um mercado profissional dinâmico e móvel. A solução foi projetada para ser a ferramenta central de gestores que precisam de controle remoto, de profissionais que necessitam de uma agenda organizada na palma da mão e de clientes corporativos que esperam autonomia e agilidade.

Através de uma interface intuitiva, o aplicativo permite que clientes B2B visualizem a disponibilidade em tempo real e agendem serviços de forma autônoma, a qualquer momento. Para as empresas, o Markaqui otimiza a gestão de múltiplas agendas, envia notificações push para reduzir o não comparecimento e oferece um painel de controle móvel para decisões estratégicas. Em essência, o projeto transforma o agendamento de um gargalo operacional em uma experiência digital eficiente, que economiza tempo, otimiza a receita e eleva a imagem profissional da empresa perante seus clientes.

## Integrantes

* Jefferson Luiz Mendonça da Silva
* Levi Alves de oliveira Neto
* Bruno pereira Figueiredo
* Kauã Eduardo Silva
* William leal Rocha Viana
* Welder Fernandes de Morais

## Orientador

* Will Ricardo dos Santos Machado

## Instruções de utilização

A aplicação fica em [`src/Markaki`](src/Markaki/README.md): um app Expo (React Native) e uma API Node/Express em `src/Markaki/backend`, com os dados num arquivo JSON (`backend/database.json`). A pasta [`prototipos/`](prototipos/README.md) guarda as telas experimentais da equipe e não faz parte do app.

### Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (inclui o `npm`)
- Para ver o app: o aplicativo **Expo Go** no celular (mesma rede Wi-Fi do computador) ou um emulador Android

### Jeito rápido (Windows)

Dê dois cliques em `iniciar.bat`, na raiz do repositório. Ele:

1. se ainda não existir, cria `src/Markaki/.env` com o IP deste computador na rede (`EXPO_PUBLIC_API_URL=http://SEU_IP:3000/api`) e **pausa** para você conferir. Se não conseguir descobrir o IP, o `.env` fica com `localhost`;
2. abre uma janela com a API (`http://localhost:3000/api`);
3. abre outra janela com o Expo; escaneie o QR code com o Expo Go ou tecle `a` para o emulador Android.

**Importante para o celular físico:** no celular, `localhost` é o próprio celular, então ele só alcança a API pelo IP do computador na mesma rede Wi-Fi. Na pausa do passo 1, confira se o IP gravado é o que aparece em `ipconfig` (linha IPv4); se o `.env` ficou com `localhost`, troque pelo IP antes de continuar. No emulador Android o endereço é `http://10.0.2.2:3000/api`. Se você mudar de rede, edite o `.env` e reinicie o Expo.

Na primeira execução cada janela roda `npm install` antes de subir. Para parar, feche as duas janelas.

### Passo a passo (qualquer sistema)

```bash
# 1. API
cd src/Markaki/backend
npm install
npm start                 # http://localhost:3000/api/medicos

# 2. App (em outro terminal)
cd src/Markaki
npm install
cp .env.example .env      # no Windows: copy .env.example .env
npm start
```

### Endereço da API no app

O app lê o endereço da API da variável `EXPO_PUBLIC_API_URL`, no arquivo `src/Markaki/.env` (fora do Git):

| Onde o app roda | Valor |
|---|---|
| Navegador ou emulador iOS na mesma máquina | `http://localhost:3000/api` |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Celular físico | `http://IP_DO_COMPUTADOR:3000/api` (veja o IP com `ipconfig`) |

Depois de mudar o `.env`, reinicie o Expo.

### Como usar

1. **Médicos**: cadastre os médicos.
2. **Horários**: cadastre os horários escolhendo o médico; cada médico tem a própria agenda (dois médicos podem ter o mesmo horário).
3. **Agendar**: escolha o médico, um horário livre da agenda dele e informe o nome do paciente.
4. **Agendamentos**: veja e cancele consultas. Um médico com consultas marcadas só pode ser excluído depois de cancelá-las.

### Testes

A partir da raiz do repositório:

```bash
npm test --prefix src/Markaki/backend   # rotas da API (usa um arquivo de dados temporário)
npm test --prefix src/Markaki           # regras do app em services/
```

# Documentação

<ol>
<li><a href="docs/01-Documentação de Contexto.md"> Documentação de Contexto</a></li>
<li><a href="docs/02-Especificação do Projeto.md"> Especificação do Projeto</a></li>
<li><a href="docs/03-Metodologia.md"> Metodologia</a></li>
<li><a href="docs/04-Projeto de Interface.md"> Projeto de Interface</a></li>
<li><a href="docs/05-Arquitetura da Solução.md"> Arquitetura da Solução</a></li>
<li><a href="docs/06-Template Padrão da Aplicação.md"> Template Padrão da Aplicação</a></li>
<li><a href="docs/07-Programação de Funcionalidades.md"> Programação de Funcionalidades</a></li>
<li><a href="docs/08-Plano de Testes de Software.md"> Plano de Testes de Software</a></li>
<li><a href="docs/09-Registro de Testes de Software.md"> Registro de Testes de Software</a></li>
<li><a href="docs/10-Plano de Testes de Usabilidade.md"> Plano de Testes de Usabilidade</a></li>
<li><a href="docs/11-Registro de Testes de Usabilidade.md"> Registro de Testes de Usabilidade</a></li>
<li><a href="docs/12-Apresentação do Projeto.md"> Apresentação do Projeto</a></li>
<li><a href="docs/13-Referências.md"> Referências</a></li>
</ol>

# Código

<li><a href="src/README.md"> Código Fonte</a></li>

# Apresentação

<li><a href="presentation/README.md"> Apresentação da solução</a></li>
