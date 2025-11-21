# 🚀 Quick Start: Integração WhatsApp

> **Guia rápido de 5 minutos para começar**

## 📁 Arquivos Criados

```
✅ database/schema-whatsapp.sql          # Schema do banco de dados
✅ lib/uazapi-client.js                  # Biblioteca cliente UAZAPI
✅ app/api/whatsapp/instance/manage/route.js   # API centralizada
✅ app/api/webhooks/evolution/route.js   # Webhook handler
✅ docs/GUIA-INTEGRACAO-WHATSAPP.md      # Documentação completa
```

## ⚡ Setup Rápido (3 Passos)

### 1️⃣ Executar Schema no Supabase

No **Supabase Dashboard** → **SQL Editor**:

```bash
# Copie e cole o conteúdo de:
database/schema-whatsapp.sql
```

Ou via CLI:
```bash
psql -h sua-url.supabase.co -U postgres < database/schema-whatsapp.sql
```

### 2️⃣ Adicionar Variável de Ambiente

No `.env.local`, adicione (se ainda não existir):

```bash
# Webhook URL (substitua pelo seu domínio em produção)
N8N_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/evolution

# Para desenvolvimento local, use ngrok:
# N8N_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/evolution
```

### 3️⃣ Testar a API

```bash
# Reiniciar servidor Next.js
npm run dev

# Testar endpoint (substitua USER_ID)
curl -X POST http://localhost:3000/api/whatsapp/instance/manage \
  -H "Content-Type: application/json" \
  -d '{"userId": "seu-user-id-aqui"}'
```

## 🎯 Como Usar (Frontend)

### Exemplo Mínimo

```jsx
'use client'

import { useState } from 'react'

export default function ConnectButton({ userId }) {
  const [qrCode, setQrCode] = useState(null)

  const connect = async () => {
    const res = await fetch('/api/whatsapp/instance/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const data = await res.json()
    if (data.success) {
      setQrCode(data.data.qrCode)
    }
  }

  return (
    <div>
      <button onClick={connect}>📱 Conectar WhatsApp</button>
      {qrCode && <img src={qrCode} alt="QR Code" />}
    </div>
  )
}
```

## 📚 Documentação Completa

Para guia detalhado com exemplos avançados, segurança, troubleshooting, veja:

👉 **[docs/GUIA-INTEGRACAO-WHATSAPP.md](./GUIA-INTEGRACAO-WHATSAPP.md)**

## 🔍 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/whatsapp/instance/manage` | Criar e conectar instância |
| `GET` | `/api/whatsapp/instance/manage?userId=xxx` | Verificar status |
| `PUT` | `/api/whatsapp/instance/manage` | Atualizar campos admin |
| `DELETE` | `/api/whatsapp/instance/manage?connectionId=xxx` | Desconectar |
| `POST` | `/api/webhooks/evolution` | Webhook (eventos da Evolution API) |

## 🛠️ Biblioteca UAZAPI

```javascript
import { uazapi } from '@/lib/uazapi-client'

// Criar instância
await uazapi.createInstance('swiftbot_user123')

// Conectar
const qr = await uazapi.connectInstance('swiftbot_user123')

// Verificar status
const status = await uazapi.getInstanceStatus('swiftbot_user123')

// Atualizar campos admin
await uazapi.updateAdminFields('swiftbot_user123', {
  adminField01: 'client_id',
  adminField02: 'departamento'
})

// Desconectar
await uazapi.disconnectInstance('swiftbot_user123')
```

## ⚠️ Importante

1. **Webhook Global:** Configure uma vez na Evolution API:
   ```bash
   curl -X POST "https://evolution.swiftbot.com.br/globalwebhook" \
     -H "apikey: SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "webhook": {
         "url": "https://seu-dominio.com/api/webhooks/evolution",
         "enabled": true,
         "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
       }
     }'
   ```

2. **Desenvolvimento Local:** Use **ngrok** para expor localhost:
   ```bash
   ngrok http 3000
   # Use a URL gerada no N8N_WEBHOOK_URL
   ```

3. **Produção:** Certifique-se que `N8N_WEBHOOK_URL` aponta para seu domínio público.

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Verifique logs da Evolution API, pode estar em formato diferente |
| Webhook não chama | Configure webhook global + use ngrok em dev |
| Erro de permissão | Verifique RLS do Supabase ou use `service_role_key` |
| Instância desconecta | Normal após inatividade, implemente reconexão |

## 🎉 Próximos Passos

1. ✅ Testar fluxo completo de conexão
2. ✅ Implementar UI no dashboard
3. ✅ Configurar notificações de desconexão
4. ✅ Implementar envio de mensagens (use `uazapi.sendTextMessage()`)
5. ✅ Adicionar histórico de mensagens

**Pronto para começar!** 🚀
