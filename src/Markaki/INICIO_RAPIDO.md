# ⚡ INÍCIO RÁPIDO - Sistema Integrado

## 🎯 Setup em 5 Minutos

### 1️⃣ Backend (1 minuto)

```bash
cd backend
npm install
npm start
```

✅ Verifique: `http://localhost:3000/api/medicos`

### 2️⃣ Frontend (2 minutos)

```bash
# Nesta pasta (src/Markaki)
npm install

# Crie o .env a partir do modelo (o .env não vai para o Git)
copy .env.example .env      # Windows (Mac/Linux: cp .env.example .env)

# Ajuste EXPO_PUBLIC_API_URL no .env:
# Emulador Android: http://10.0.2.2:3000/api
# Emulador iOS / navegador: http://localhost:3000/api
# Dispositivo físico: http://SEU_IP:3000/api
```

> Atalho no Windows: `iniciar.bat` na raiz do repositório sobe a API e o Expo em janelas separadas.

### 3️⃣ Rodar o App (1 minuto)

```bash
npm start
# Depois:
npm run android  # ou npm run ios
```

### 4️⃣ Testar (1 minuto)

✅ Lista de médicos carrega?  
✅ Consegue cadastrar médico?  
✅ Consegue criar horário?  
✅ Consegue agendar consulta?  

---

## 📱 Como Funciona

### Fluxo Completo:

1. **Cadastrar Médicos** → Aba 👨‍⚕️
2. **Criar Horários** → Aba 🕐 (cada horário é cadastrado para um médico)
3. **Agendar Consulta** → Aba 📅+ (seleciona o médico e um horário livre da agenda dele)
4. **Ver Agendamentos** → Aba ✓

---

## 🎨 Telas do Sistema

### 1. Lista de Médicos (👨‍⚕️)
- Ver todos os médicos
- Buscar e filtrar por especialidade
- Adicionar novo médico (botão +)
- Remover médico (botão ×); se ele tiver agendamentos, o app avisa para cancelar antes

### 2. Gerenciar Horários (🕐)
- Ver horários disponíveis e ocupados, com o médico de cada um
- Adicionar novo horário (botão +), escolhendo o médico
- Remover horário não agendado
- Ver info de quem agendou (se ocupado)

### 3. Agendar Consulta (📅+)
- **Passo 1:** Selecionar médico
- **Passo 2:** Selecionar horário disponível (só os do médico escolhido)
- **Passo 3:** Digitar nome do paciente
- **Confirmar:** Agendamento criado!

### 4. Meus Agendamentos (✓)
- Ver todas as consultas agendadas
- Detalhes completos de cada consulta
- Cancelar agendamento (libera o horário)

---

## 🔧 Configuração Rápida

### Descobrir IP da Máquina:

**Windows:**
```bash
ipconfig
# Procure: Endereço IPv4
```

**Mac/Linux:**
```bash
ifconfig
# Procure: inet
```

### Editar o endereço da API:

Arquivo: `.env` (copiado de `.env.example`, fica fora do Git)

```bash
EXPO_PUBLIC_API_URL=http://SEU_IP_AQUI:3000/api
```

Reinicie o Expo depois de mudar o `.env`.

---

## ✅ Checklist

- [ ] Backend rodando em localhost:3000
- [ ] API responde no navegador
- [ ] `EXPO_PUBLIC_API_URL` configurado no `.env`
- [ ] App instalado e rodando
- [ ] Lista de médicos carrega

---

## 🐛 Problema Comum

**App não carrega médicos?**

1. Backend está rodando?
   ```bash
   cd backend && npm start
   ```

2. Teste no navegador:
   ```
   http://localhost:3000/api/medicos
   ```

3. `EXPO_PUBLIC_API_URL` no `.env` está correto?
   - Emulador Android: `http://10.0.2.2:3000/api`
   - Dispositivo físico: `http://SEU_IP:3000/api`

4. Mesma rede WiFi? (se dispositivo físico)

---

## 📂 Estrutura

```
sistema-integrado/
├── backend/
│   ├── server.js       ⭐ Servidor
│   ├── database.json   ⭐ Dados
│   └── package.json
├── screens/
│   ├── ListaMedicos.js
│   ├── GerenciarHorarios.js
│   ├── AgendarConsulta.js
│   └── MeusAgendamentos.js
├── services/
│   ├── api.js          ⭐ Chamadas da API
│   ├── http.js         URL da API (EXPO_PUBLIC_API_URL)
│   └── horarios.js     Regras dos horários
├── .env.example        ⭐ Modelo do .env
├── App.js              ⭐ Principal
└── package.json
```

---

## 🎯 Teste Rápido

```bash
# 1. Backend
cd backend && npm start

# 2. Teste API
# Abra: http://localhost:3000/api/medicos

# 3. Frontend
npm start

# 4. Use o app!
```

---

## 📞 Ajuda Rápida

**Porta 3000 ocupada?**
```bash
# Suba a API em outra porta (Windows/cmd):
set PORT=3001 && npm start
# e ajuste a porta em EXPO_PUBLIC_API_URL no .env
```

**Erro de conexão?**
- Verifique `EXPO_PUBLIC_API_URL` no `.env`
- Backend está rodando?
- Firewall bloqueando?

**Mais ajuda?**
- Veja `README.md` completo
- Verifique console do backend para erros

---

## 🎉 Pronto!

Agora você tem:
- ✅ Sistema de médicos
- ✅ Sistema de horários  
- ✅ Sistema de agendamentos
- ✅ Tudo integrado e funcionando!

**Próximo passo:** Comece cadastrando médicos e horários! 🚀
