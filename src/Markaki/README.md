# 🏥 Sistema Integrado de Agendamento de Consultas Médicas

## 📋 Sobre o Sistema

Sistema completo que integra:
- ✅ **Gestão de Médicos** - Cadastrar, listar, remover médicos
- ✅ **Gestão de Horários** - Criar e gerenciar horários disponíveis
- ✅ **Agendamento de Consultas** - Agendar consultas com médico e horário específicos
- ✅ **Meus Agendamentos** - Visualizar e cancelar consultas agendadas

---

## 🎯 Funcionalidades

### 1. Lista de Médicos
- Busca e filtros por especialidade
- Cadastro de novos médicos
- Remoção de médicos
- Pull-to-refresh

### 2. Gerenciar Horários
- Criar novos horários disponíveis
- Visualizar horários ocupados/disponíveis
- Remover horários (apenas disponíveis)
- Ver informações de agendamentos

### 3. Agendar Consulta
- **Seleção de Médico** - Escolha entre os médicos cadastrados
- **Seleção de Horário** - Escolha entre horários disponíveis
- **Nome do Paciente** - Digite seu nome
- Confirmação do agendamento com todos os detalhes

### 4. Meus Agendamentos
- Lista de todas as consultas agendadas
- Detalhes completos (médico, data, hora, paciente)
- Cancelar agendamentos
- Histórico com data de criação

---

## 🚀 Instalação

### Passo 1: Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

O backend estará rodando em `http://localhost:3000`

### Passo 2: Frontend

```bash
# Na raiz do projeto
npm install

# Configure o endereço da API em services/api.js
# Para emulador Android: http://10.0.2.2:3000/api
# Para emulador iOS: http://localhost:3000/api
# Para dispositivo físico: http://SEU_IP:3000/api

# Inicie o app
npm start
```

---

## 📁 Estrutura do Projeto

```
sistema-integrado/
│
├── backend/
│   ├── server.js           # Servidor Express
│   ├── database.json       # Banco de dados
│   └── package.json        # Dependências
│
├── screens/
│   ├── ListaMedicos.js     # Tela de médicos
│   ├── GerenciarHorarios.js # Tela de horários
│   ├── AgendarConsulta.js  # Tela de agendamento
│   └── MeusAgendamentos.js # Tela de consultas
│
├── services/
│   └── api.js              # Funções de API
│
├── App.js                  # Componente principal
└── package.json            # Dependências frontend
```

---

## 🔌 Endpoints da API

### Médicos
- `GET /api/medicos` - Listar todos
- `GET /api/medicos/:id` - Buscar por ID
- `POST /api/medicos` - Cadastrar
- `PUT /api/medicos/:id` - Atualizar
- `DELETE /api/medicos/:id` - Remover

### Horários
- `GET /api/horarios` - Listar todos
- `GET /api/horarios/:id` - Buscar por ID
- `POST /api/horarios` - Cadastrar
- `PUT /api/horarios/:id` - Atualizar
- `DELETE /api/horarios/:id` - Remover

### Agendamentos
- `GET /api/agendamentos` - Listar todos
- `POST /api/agendamentos` - Criar agendamento
- `DELETE /api/agendamentos/:id` - Cancelar

---

## 📊 Fluxo de Uso

### Para o Administrador:

1. **Cadastrar Médicos**
   - Vá para a aba "👨‍⚕️" (Médicos)
   - Clique no botão "+"
   - Preencha nome, especialidade e imagem
   - Salve

2. **Criar Horários**
   - Vá para a aba "🕐" (Horários)
   - Clique no botão "+"
   - Defina data e hora
   - Salve

### Para o Paciente:

3. **Agendar Consulta**
   - Vá para a aba "📅+" (Agendar)
   - Selecione o médico desejado
   - Selecione o horário disponível
   - Digite seu nome
   - Confirme o agendamento

4. **Ver Agendamentos**
   - Vá para a aba "✓" (Agendamentos)
   - Visualize suas consultas
   - Cancele se necessário

---

## 🎨 Interface

### Navegação por Abas

```
┌─────────────────────────────────┐
│  Sistema de Agendamentos        │
├─────────────────────────────────┤
│  👨‍⚕️   🕐   📅+   ✓            │
│ Médicos Horários Agendar Consultas│
└─────────────────────────────────┘
```

### Tela de Agendamento

```
┌─────────────────────────────────┐
│ Agendar Nova Consulta           │
├─────────────────────────────────┤
│                                 │
│ 1. Selecione o Médico           │
│ ┌─────────────────────────────┐ │
│ │ [Foto] Dr. João Silva       │ │
│ │        Cardiologista    [↻] │ │
│ └─────────────────────────────┘ │
│                                 │
│ 2. Selecione o Horário          │
│ ┌─────────────────────────────┐ │
│ │ 2025-11-25                  │ │
│ │ 14:00 - 15:00          [↻]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ 3. Seu Nome                     │
│ ┌─────────────────────────────┐ │
│ │ Maria Silva                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ [ Confirmar Agendamento ]       │
└─────────────────────────────────┘
```

---

## 🔧 Configuração da API

Edite `services/api.js`:

```javascript
// Para emulador Android
const API_URL = 'http://10.0.2.2:3000/api';

// Para emulador iOS
const API_URL = 'http://localhost:3000/api';

// Para dispositivo físico (use seu IP)
const API_URL = 'http://192.168.1.XXX:3000/api';
```

**Como descobrir seu IP:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

---

## 📝 Estrutura dos Dados

### Médico
```json
{
  "id": "1",
  "nome": "Dr. João Silva",
  "especialidade": "Cardiologista",
  "imagem": "https://..."
}
```

### Horário
```json
{
  "id": "h1",
  "data": "2025-11-25",
  "hora": "09:00 - 10:00",
  "disponivel": true,
  "paciente_nome": "",
  "medico_id": null,
  "medico_nome": ""
}
```

### Agendamento
```json
{
  "id": "a1",
  "horario_id": "h1",
  "medico_id": "1",
  "medico_nome": "Dr. João Silva",
  "medico_especialidade": "Cardiologista",
  "paciente_nome": "Maria Silva",
  "data": "2025-11-25",
  "hora": "09:00 - 10:00",
  "status": "agendado",
  "criado_em": "2025-11-22T10:30:00.000Z"
}
```

---

## 🐛 Solução de Problemas

### Backend não inicia
```bash
# Verifique se a porta 3000 está livre
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Se ocupada, mude a porta no server.js
const PORT = 3001;
```

### Frontend não conecta
1. Backend está rodando?
2. `API_URL` está correto?
3. Celular e PC na mesma rede? (dispositivo físico)
4. Testou no navegador: `http://localhost:3000/api/medicos`?

### Horário não aparece na lista de agendamento
- Certifique-se de que o horário está marcado como `disponível: true`
- Recarregue a tela (pull-to-refresh)

### Não consegue cadastrar médico/horário
- Verifique os campos obrigatórios
- Veja o console do backend para erros
- Teste a API diretamente com Postman

---

## ✨ Funcionalidades Especiais

### 1. Validações Automáticas
- Não permite agendar em horários ocupados
- Não permite remover médicos/horários com agendamentos
- Valida campos obrigatórios

### 2. Atualização Automática
- Ao criar agendamento, horário fica ocupado
- Ao cancelar agendamento, horário fica disponível
- Pull-to-refresh em todas as telas

### 3. Interface Intuitiva
- Status visuais (disponível/ocupado)
- Confirmações antes de ações destrutivas
- Feedback imediato de ações

---

## 📱 Testando o Sistema

### Teste Completo (5 minutos)

1. **Backend** (1 min)
   ```bash
   cd backend
   npm install
   npm start
   # Abra: http://localhost:3000/api/medicos
   ```

2. **Frontend** (2 min)
   ```bash
   npm install
   # Configure API_URL
   npm start
   ```

3. **Teste Funcional** (2 min)
   - ✅ Lista médicos carrega?
   - ✅ Consegue adicionar médico?
   - ✅ Consegue criar horário?
   - ✅ Consegue agendar consulta?
   - ✅ Agendamento aparece na lista?

---

## 🎯 Próximos Passos

### Melhorias Sugeridas:
- [ ] Autenticação de usuários
- [ ] Notificações de lembrete
- [ ] Calendario visual para seleção de data
- [ ] Filtros avançados
- [ ] Exportar agendamentos (PDF/Excel)
- [ ] Sistema de confirmação por e-mail/SMS
- [ ] Upload de imagens do médico
- [ ] Histórico de consultas
- [ ] Avaliações dos médicos
- [ ] Dashboard com estatísticas

---

## 📞 Comandos Úteis

```bash
# Backend
cd backend
npm start              # Iniciar servidor
npm run dev           # Modo desenvolvimento (auto-reload)

# Frontend
npm start             # Iniciar Metro
npm run android       # Rodar no Android
npm run ios           # Rodar no iOS
npm run web           # Rodar no navegador

# Debug
# Limpar cache
npm start -- --reset-cache

# Reinstalar dependências
rm -rf node_modules
npm install
```

---

## 🎓 Tecnologias Utilizadas

### Backend:
- Node.js
- Express
- CORS
- File System (JSON)

### Frontend:
- React Native
- Expo
- React Native Paper
- React Hooks

---

## ✅ Checklist de Implementação

- [x] Backend com CRUD completo
- [x] Frontend com 4 telas principais
- [x] Integração médicos + horários
- [x] Sistema de agendamento
- [x] Cancelamento de consultas
- [x] Validações e tratamento de erros
- [x] Interface responsiva
- [x] Pull-to-refresh
- [x] Documentação completa

---

## 🎉 Status do Projeto

✅ **COMPLETO E PRONTO PARA USO**

O sistema está totalmente funcional e integrado, pronto para ser usado imediatamente!

---

**Criado por:** Bruno  
**Data:** Novembro 2024  
**Versão:** 1.0.0  
**Licença:** MIT
