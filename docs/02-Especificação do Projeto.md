# Especificações do Projeto

<!--
<span style="color:red">Pré-requisitos: <a href="01-Documentação de Contexto.md"> Documentação de Contexto</a></span>

Definição do problema e ideia de solução a partir da perspectiva do usuário. É composta pela definição do  diagrama de personas, histórias de usuários, requisitos funcionais e não funcionais além das restrições do projeto.

Apresente uma visão geral do que será abordado nesta parte do documento, enumerando as técnicas e/ou ferramentas utilizadas para realizar a especificações do projeto
-->

## Situação na versão 2.0 (outubro de 2026)

A proposta original (abaixo, preservada como registro acadêmico) era um agendamento B2B para empresas prestadoras de serviço. A versão 2.0 assume o domínio que o código já tinha: **agendamento de consultas em uma clínica médica**, com dois papéis (paciente e gestor da clínica). Médico faz o papel do "profissional" e especialidade, o do "serviço".

| Requisito | Situação | Onde |
|---|---|---|
| RF-001 Agendamento em até 5 etapas | Implementado: Médicos, médico, dia e hora, confirmar (4 toques) | `src/telas/paciente/` |
| RF-002 Agendas de todos os profissionais | Parcial: agenda por médico com troca rápida e lista de todas as consultas | `src/telas/gestor/Agenda.js`, `src/telas/comum/Consultas.js` |
| RF-003 Notificações push | Não implementado | Limitação conhecida |
| RF-004 Perfis e autenticação | Implementado com e-mail e senha (bcrypt, token, papéis). Login com Google não | `backend/src/routes/auth.js` |
| RF-005 Painel gerencial | Parcial: consultas de hoje e da semana, horários livres e agenda do dia (sem receita) | `src/telas/gestor/Painel.js`, `GET /api/painel` |
| RF-006 Serviços com preço | Não implementado (no domínio de clínica, a especialidade substitui o serviço) | |
| RNF-001 Segurança e LGPD | Parcial: senha com hash, paciente só vê os próprios dados, limites de tentativa. HTTPS depende da hospedagem | [Arquitetura](05-Arquitetura%20da%20Solução.md) |
| RNF-002 Desempenho | Medido na API: leitura da agenda com p97,5 de 13 ms (100 horários) a 60 ms (10.000) na versão final; ver [teste de carga](carga/2026-10-04-resultados.md) | `backend/carga/` |
| RNF-003 Material Design | Implementado: React Native Paper (MD3) com o tema do projeto | [Template](06-Template%20Padrão%20da%20Aplicação.md) |
| RNF-004 Compatibilidade Android | Expo SDK 54 / React Native 0.81 | |
| RNF-005 Consumo de bateria e dados | Não medido | |

Restrições: R-02 (cadastro obrigatório) vale. R-03 (CPF) e R-05 (verificar e-mail) ficaram de fora: o app não pede CPF (minimização de dados, LGPD) e não envia e-mail.

## Personas

| **Nome**           | **Idade** | **Profissão**              | **Frustrações**                                                                 | **Expectativas**                                                                |
|--------------------|-----------|----------------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **João Souza**     | 35        | Administrador do Estabelecimento	 | Sentimento de impotência: Não ter controle ou visibilidade sobre a operação quando está fora do escritório, dependendo de ligações para saber o que está acontecendo. Perda de tempo e dinheiro: Gastar horas preciosas em trocas de mensagens para resolver conflitos de agenda e perder receita com "no-shows" que não puderam ser rapidamente remanejados. | Ter uma visão geral dos agendamentos e faturamento no celular. Gerenciar a agenda de múltiplos profissionais de forma remota.|
| **Mariana Ferreira**| 28        | Profissional / Prestador de Serviço	     | Falhas de comunicação: Ser pego de surpresa por um agendamento ou cancelamento que foi comunicado por e-mail e não visto a tempo, gerando despreparo ou tempo ocioso. Falta de autonomia: A dificuldade de gerenciar a própria agenda em tempo real, como bloquear um horário para um imprevisto, dependendo de outra pessoa para acessar o sistema principal. Quebra do fluxo de trabalho: Ter que interromper um atendimento para responder mensagens sobre agendamentos ou consultar informações sobre o próximo cliente. 	| Visualizar sua agenda em tempo real no app. Receber notificações push sobre novos agendamentos ou cancelamentos. Bloquear horários na sua agenda de forma rápida pelo celular. |
| **Lucas Almeida**  | 42        | Cliente B2B (Empresa Contratante)	 | Processo lento e burocrático: A enorme perda de tempo com a troca interminável de e-mails e ligações ("pingue-pongue") apenas para encontrar um horário compatível. Dependência e rigidez: Sentir-se preso ao horário comercial da empresa prestadora para conseguir agendar ou, pior, para alterar um compromisso urgente. Experiência frustrante: A péssima impressão causada por sites que não funcionam bem no celular ou pela falta de uma confirmação instantânea, o que gera insegurança e passa uma imagem de desorganização da empresa contratada.  | Encontrar horários disponíveis e agendar um serviço em poucos toques. Receber confirmações e lembretes via notificação push. Poder reagendar ou cancelar compromissos diretamente pelo aplicativo. |



## Histórias de Usuários

| **Persona**           | **Como**                                    | **Quero**                                                 | **Para Que**                                               |
|-----------------------|---------------------------------------------|-----------------------------------------------------------|------------------------------------------------------------|
| **João Souza**| 35| Administrador do Estabelecimento|  Visualizar um dashboard simplificado no meu celular com os principais indicadores do dia.| Tomar decisões rápidas mesmo estando fora do escritório.   |
| **Kleber Machado**| 42 | Médico |  Receber uma notificação push instantânea quando um cliente agendar um horário comigo.  | Me preparar para o atendimento com antecedência.  |
| **Mariana Ferreira**| 28| Dona de empresa| Poder buscar um serviço e agendá-lo em menos de 2 minutos pelo aplicativo. | Otimizar meu tempo e resolver essa demanda rapidamente. |
| **Lucas Almeida**| 39| Personal trainer | Receber um lembrete no meu celular um dia antes do compromisso. |  Não esquecer e evitar problemas de não comparecimento. |
| **Pedro Santos**| 50| Autônomo | Cadastrar um novo serviço ou profissional diretamente pelo aplicativo. |  Manter a plataforma sempre atualizada sem precisar de um computador. |
|


<!--
Apresente aqui as histórias de usuário que são relevantes para o projeto de sua solução. As Histórias de Usuário consistem em uma ferramenta poderosa para a compreensão e elicitação dos requisitos funcionais e não funcionais da sua aplicação. Se possível, agrupe as histórias de usuário por contexto, para facilitar consultas recorrentes à essa parte do documento.
-->
## Modelagem do Processo de Negócio

Análise da Situação Atual.
Atualmente, muitas empresas prestadoras de serviços realizam o agendamento de forma manual, o que gera uma série de problemas:
Troca excessiva de e-mails e ligações telefônicas para confirmar horários.
Conflitos de agenda por falta de atualização em tempo real.
Esquecimento de compromissos por ausência de lembretes automáticos.
Retrabalho administrativo para confirmar e reagendar compromissos.
Baixa satisfação do cliente, que não encontra autonomia no processo.

**Modelo atual (antes do Markaqui):**
O cliente entra em contato por telefone/e-mail/WhatsApp.
Um atendente verifica manualmente a agenda.

Caso haja conflito, inicia-se nova rodada de contato.
O agendamento é registrado em agenda física, planilha ou software genérico sem integração.
Não há lembrete automático — dependência de ligações manuais.

## Descrição Geral da Proposta
O Markaqui surge como solução inovadora para digitalizar e automatizar esse processo de agendamento em ambientes B2B.

**Limites do sistema:**
Foca na organização de agendas de empresas prestadoras de serviço, clientes corporativos e gestores.
Integração com a estratégia do negócio: melhora a imagem profissional, reduz custos administrativos e aumenta a receita ao evitar lacunas na agenda.

**Oportunidades de melhoria:**
Disponibilidade em tempo real das agendas.
Autonomia ao cliente, que agenda sem intermediários.
Notificações push para reduzir o não comparecimento.
Painel de gestão móvel para análise de desempenho.
Padronização do processo, minimizando erros e retrabalhos.

**Processo 1 – Agendamento de Serviços**

**Oportunidades de melhorias:**
Substituir trocas de e-mails e ligações por um fluxo digital.
Reduzir o tempo de agendamento de horas/dias para minutos.
Garantir que o cliente veja apenas horários disponíveis, evitando conflitos.
Melhorar a experiência do cliente e a eficiência da empresa.

**Modelo BPMN (Agendamento de Serviços):**

**Fluxo simplificado em BPMN:**

Cliente acessa o aplicativo.
Sistema exibe a agenda com disponibilidade em tempo real.
Cliente escolhe data e horário.
Sistema registra o agendamento.
Sistema envia notificação push para cliente e empresa.
Gestor/profissional confirma e prepara o atendimento.

## Indicadores de Desempenho

**Taxa de Ocupação da Agenda
Definição:** Percentual de horários disponíveis que foram efetivamente agendados.
Meta: Atingir 85% de ocupação média mensal.

**Índice de Não Comparecimento**
Percentual de agendamentos em que o cliente não comparece.
**Meta:** Reduzir o índice para menos de 5% ao mês com notificações automáticas.

**Tempo Médio de Agendamento
Definição:** Tempo decorrido entre a solicitação do cliente e a confirmação do agendamento.
**Meta:** Menos de 2 minutos em 90% dos agendamentos.

**Nível de Satisfação do Cliente
Definição:** Grau de satisfação medido por pesquisas rápidas após o serviço.
**Meta:** Alcançar nota média ≥ 4,5 em uma escala de 1 a 5.

**Quantidade de Reagendamentos
Definição:** Número de agendamentos que precisaram ser alterados (cliente ou empresa).
**Meta:** Manter menos de 10% do total mensal de agendamentos.


## Requisitos
<!--
As tabelas que se seguem apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto.
-->
### Requisitos Funcionais

|ID    | Descrição do Requisito  | Prioridade |
|------|-----------------------------------------|----|
|**RF-001**| <div align=center>Agendamento Rápido: O sistema deve permitir que um Cliente B2B conclua um agendamento em, no máximo, 5 etapas dentro do aplicativo.	</div> | ALTA | 
|**RF-002**| <div align=center>Gestão de Agendas Multi-Profissional: O Administrador deve poder visualizar e filtrar as agendas de todos os profissionais cadastrados em uma única tela móvel.	</div>  | ALTA |
|**RF-003**| <div align=center>Sistema de Notificações Push: O app deve enviar notificações automáticas para confirmação, lembrete (24h antes), alteração e cancelamento de agendamentos para todos os perfis.	</div>  | ALTA |
|**RF-004**| <div align=center>Perfis de Usuário e Autenticação: O sistema deve ter um processo de cadastro/login seguro (e-mail/senha, Google) e diferenciar as permissões de cada perfil.	</div>  | MÉDIA |
|**RF-005**| <div align=center>Dashboard Gerencial Móvel: O Administrador deve ter acesso a um painel visual com métricas chave (agendamentos do dia, receita prevista, etc.).	</div> | MÉDIA |
|**RF-006**| <div align=center>Gerenciamento de Serviços pelo App: O Administrador deve poder criar, editar e desativar serviços (nome, duração, preço) diretamente da interface do aplicativo.	</div> | MÉDIA |


### Requisitos Não Funcionais  

| ID       | Descrição do Requisito  | Prioridade |
|----------|-------------------------|------------|
| **RNF-001** | Segurança: A comunicação entre o app e o servidor deve ser criptografada (SSL/TLS). Dados sensíveis devem ser armazenados de forma segura, em conformidade com a LGPD.	| ALTA |
| **RNF-002** | Desempenho: O tempo de carregamento da tela principal e da agenda não deve exceder 2 segundos em uma conexão 4G estável.	 | ALTA |
| **RNF-003** | Usabilidade (UI/UX): A interface deve ser intuitiva, limpa e seguir as diretrizes de design nativas do Android (Material Design).	 | ALTA |
| **RNF-004** | Compatibilidade: O aplicativo deve ser compatível com as duas últimas versões principais do sistema operacionaL Android.	| ALTA |
| **RNF-005** | Consumo de Recursos: O aplicativo deve ser otimizado para minimizar o consumo de bateria e de dados móveis em segundo plano.	 | MÉDIA |




## Restrições

O projeto está restrito pelos itens apresentados na tabela a seguir.

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|**R-01**| Os usuários precisam ter mais de 18 anos para utilizar a plataforma. |
|**R-02**| É necessário se cadastrar para utilizar a plataforma. |
|**R-03**| O usuário precisa fornecer o seu CPF para poder concluir o cadastro. |
|**R-04**| Não é possível utilizar palavras de baixo calão na plataforma. |
|**R-05**| É necessário verificar o e-mail para concluir o cadastro. |

## Diagrama de Caso de uso

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/9e0d8eb3-f1e7-4274-a8de-d4128181f2d6" />

## Matriz de Rastreabilidade

<img width="1334" height="433" alt="Image" src="https://github.com/user-attachments/assets/b30df5d1-723c-45bf-b1a3-708c7b79565c" />

## Gerenciamento de Projeto

De acordo com o PMBoK v6 as dez áreas que constituem os pilares para gerenciar projetos, e que caracterizam a multidisciplinaridade envolvida, são: Integração, Escopo, Cronograma (Tempo), Custos, Qualidade, Recursos, Comunicações, Riscos, Aquisições, Partes Interessadas. Para desenvolver projetos um profissional deve se preocupar em gerenciar todas essas dez áreas. Elas se complementam e se relacionam, de tal forma que não se deve apenas examinar uma área de forma estanque. É preciso considerar, por exemplo, que as áreas de Escopo, Cronograma e Custos estão muito relacionadas. Assim, se eu amplio o escopo de um projeto eu posso afetar seu cronograma e seus custos.

## Gerenciamento de Tempo

<img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/8ffa37ac-9c60-4f2f-8d93-17b689790233" />

<img width="793" height="328" alt="Image" src="https://github.com/user-attachments/assets/a14eb15d-9333-4920-a112-f171a4af7d19" />

## Gerenciamento de Equipe

<img width="978" height="335" alt="Image" src="https://github.com/user-attachments/assets/f56368b1-1686-4d40-bffa-06e45cbe4d10" />

## Gestão de Orçamento

<img width="389" height="296" alt="Image" src="https://github.com/user-attachments/assets/0b55cd17-14c3-43e8-bfb7-53658bb54a68" />

## Fluxo de Trabalho / BPMN
O fluxo de trabalho do projeto foi modelado utilizando a notação BPMN (Business Process Model and Notation), que permite representar graficamente os processos de negócio, suas atividades, decisões e interações entre os atores do sistema.

**O diagrama BPMN apresenta de forma clara:**

Sequência de atividades realizadas pelos usuários e pelo sistema;

Decisões e pontos de verificação dentro do processo;

Integração entre diferentes módulos e responsabilidades da equipe.

A utilização do BPMN auxilia na compreensão do processo, garantindo que todos os membros da equipe tenham uma visão uniforme de como o projeto será executado. Além disso, o diagrama serve como base para o desenvolvimento de funcionalidades e validação de requisitos.

<img width="3620" height="1840" alt="Image" src="https://github.com/user-attachments/assets/4ca4eff3-6251-4337-926a-19910ec9b061" />

