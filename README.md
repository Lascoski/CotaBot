# CotaBot
Sistema simples para acompanhamento de cotações de **Dólar, Euro e Bitcoin**, utilizando a AwesomeAPI.
Permite criar alertas de valor e envia uma mensagem pelo **Telegram** quando a cotação atingir o valor definido.

## Funcionalidades

- Cadastro e login
- Consulta de cotações
- Criação e exclusão de alertas
- Alertas pelo Telegram
- Resumo diário das cotações

## Tecnologias

React, TypeScript, Python, Flask, SQLite, AwesomeAPI e Telegram Bot API.

## Como executar

### Frontend
```bash
npm install
npm run dev
```
No PowerShell, se necessário:
```bash
npm.cmd install
npm.cmd run dev
```
### Backend
```bash
cd backend
pip install flask flask-cors requests python-dotenv
py app.py
```
Crie um arquivo `.env` dentro de `backend`:
```env
TELEGRAM_BOT_TOKEN=SEU_TOKEN
TELEGRAM_CHAT_ID=SEU_CHAT_ID
```

Frontend: `http://localhost:8443`  
Backend: `http://127.0.0.1:5000`
