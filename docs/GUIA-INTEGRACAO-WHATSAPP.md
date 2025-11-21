# 📱 Guia Completo: Integração WhatsApp (Evolution API / UAZAPI)

> **Autor:** Engenheiro de Software Sênior
> **Stack:** Next.js 15 (App Router) + Supabase (PostgreSQL) + Evolution API
> **Última atualização:** 2025

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura da Solução](#2-arquitetura-da-solução)
3. [Configuração Inicial](#3-configuração-inicial)
4. [Fluxo de Criação e Conexão](#4-fluxo-de-criação-e-conexão)
5. [Gerenciamento de Dados](#5-gerenciamento-de-dados)
6. [Considerações de Segurança](#6-considerações-de-segurança)
7. [Exemplos de Uso Frontend](#7-exemplos-de-uso-frontend)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Visão Geral

### O que foi implementado?

Esta integração permite que os usuários do SaaS conectem suas contas do WhatsApp para utilizar chatbots inteligentes. A solução utiliza a **Evolution API (UAZAPI)** como intermediária entre o WhatsApp Web e nosso backend.

### Componentes Criados

```
meu-saas-chatbot/
├── database/
│   └── schema-whatsapp.sql          # Schema do Supabase
├── lib/
│   └── uazapi-client.js             # Biblioteca cliente UAZAPI
├── app/api/whatsapp/instance/
│   └── manage/route.js              # API centralizada de gerenciamento
└── app/api/webhooks/
    └── evolution/route.js           # Webhook para eventos da Evolution API
```

### Fluxo Completo

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as API Next.js
    participant E as Evolution API
    participant S as Supabase
    participant W as WhatsApp

    U->>F: Clica em "Conectar WhatsApp"
    F->>A: POST /api/whatsapp/instance/manage
    A->>S: Verifica assinatura ativa
    A->>E: Cria instância (instance/create)
    E-->>A: Retorna token da instância
    A->>S: Salva instância no banco
    A->>E: Configura webhook
    A->>E: Gera QR Code (instance/connect)
    E-->>A: Retorna QR Code (base64)
    A-->>F: Retorna QR Code para exibição
    F->>U: Exibe QR Code
    U->>W: Escaneia QR Code
    W->>E: Confirma conexão
    E->>A: Webhook CONNECTION_UPDATE (state: open)
    A->>S: Atualiza status -> connected
    F->>A: Poll GET /api/whatsapp/instance/manage?userId=...
    A-->>F: Retorna status: connected
    F->>U: Exibe "WhatsApp Conectado!"
```

---

## 2. Arquitetura da Solução

### Stack Tecnológica

| Componente | Tecnologia | Propósito |
|------------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Backend + Frontend |
| **Banco de Dados** | Supabase (PostgreSQL) | Armazenamento de instâncias e mensagens |
| **WhatsApp API** | Evolution API (UAZAPI) | Intermediária para WhatsApp Web |
| **Autenticação** | Supabase Auth | Gerenciamento de usuários |
| **Pagamentos** | Stripe | Controle de assinaturas |

### Tabelas do Supabase

#### **whatsapp_connections**
Armazena as instâncias do WhatsApp de cada usuário.

```sql
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  instance_name VARCHAR(255) UNIQUE NOT NULL,
  instance_token TEXT,
  waba_id VARCHAR(255),
  phone_number_id VARCHAR(50),
  status VARCHAR(50) DEFAULT 'disconnected',
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  api_credentials TEXT,
  webhook_url TEXT,
  admin_field_01 VARCHAR(255), -- Ex: client_id
  admin_field_02 VARCHAR(255), -- Ex: departamento
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **whatsapp_messages** (Opcional)
Para armazenar histórico de mensagens.

```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES whatsapp_connections(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message_id VARCHAR(255) UNIQUE NOT NULL,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  message_content TEXT,
  direction VARCHAR(20) NOT NULL, -- 'inbound' ou 'outbound'
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Biblioteca Cliente UAZAPI

Localização: `lib/uazapi-client.js`

A biblioteca encapsula todas as chamadas à Evolution API:

```javascript
import { uazapi } from '@/lib/uazapi-client'

// Criar instância
const instance = await uazapi.createInstance('swiftbot_user123')

// Conectar e gerar QR Code
const qrData = await uazapi.connectInstance('swiftbot_user123')

// Verificar status
const status = await uazapi.getInstanceStatus('swiftbot_user123')

// Atualizar campos administrativos
await uazapi.updateAdminFields('swiftbot_user123', {
  adminField01: 'client_id_abc',
  adminField02: 'departamento_vendas'
})

// Desconectar
await uazapi.disconnectInstance('swiftbot_user123')

// Deletar
await uazapi.deleteInstance('swiftbot_user123')
```

---

## 3. Configuração Inicial

### 3.1. Executar Schema do Banco

```bash
# No Supabase Dashboard, vá em SQL Editor e execute:
psql -h your-supabase-host -U postgres < database/schema-whatsapp.sql

# Ou copie e cole o conteúdo de database/schema-whatsapp.sql no SQL Editor
```

### 3.2. Configurar Variáveis de Ambiente

No arquivo `.env.local`:

```bash
# Evolution API (UAZAPI)
EVOLUTION_API_URL=https://evolution.swiftbot.com.br
EVOLUTION_API_KEY=seu_admin_token_aqui

# Webhook URL (onde a Evolution API enviará eventos)
N8N_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/evolution

# Autenticação do Webhook (opcional mas recomendado)
WEBHOOK_AUTH_USER=seu_usuario
WEBHOOK_AUTH_PASS=sua_senha_segura

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 3.3. Configurar Webhook Global na Evolution API

Você pode configurar o webhook globalmente via código ou manualmente:

```bash
# Via biblioteca cliente (execute uma vez)
node -e "
const uazapi = require('./lib/uazapi-client');
uazapi.setGlobalWebhook({
  url: 'https://seu-dominio.com/api/webhooks/evolution',
  enabled: true,
  events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
}).then(console.log).catch(console.error);
"
```

Ou use a API existente:

```bash
curl -X POST "https://evolution.swiftbot.com.br/globalwebhook" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_ADMIN_TOKEN" \
  -d '{
    "webhook": {
      "url": "https://seu-dominio.com/api/webhooks/evolution",
      "enabled": true,
      "webhookByEvents": false,
      "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
    }
  }'
```

---

## 4. Fluxo de Criação e Conexão

### 4.1. Criar e Conectar Instância (Botão "Conectar WhatsApp")

**Endpoint:** `POST /api/whatsapp/instance/manage`

**Request Body:**
```json
{
  "userId": "uuid-do-usuario",
  "connectionId": "uuid-da-conexao-opcional",
  "adminFields": {
    "adminField01": "client_id_123",
    "adminField02": "integration_data"
  }
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "connectionId": "uuid-da-conexao-criada",
    "instanceName": "swiftbot_user123",
    "instanceToken": "hash_da_instancia",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "status": "connecting",
    "message": "QR Code gerado com sucesso. Escaneie com seu WhatsApp."
  }
}
```

**Exemplo de Uso:**

```javascript
// app/components/ConnectWhatsAppButton.js
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ConnectWhatsAppButton() {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      // Pegar user_id do Supabase Auth
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Você precisa estar logado')
      }

      // Chamar API de criação
      const response = await fetch('/api/whatsapp/instance/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          adminFields: {
            adminField01: user.email, // Exemplo
            adminField02: 'web_dashboard'
          }
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao conectar')
      }

      // Exibir QR Code
      setQrCode(data.data.qrCode)

      // Iniciar polling para verificar conexão
      startStatusPolling(user.id)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startStatusPolling = (userId) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/whatsapp/instance/manage?userId=${userId}`)
      const data = await response.json()

      if (data.connected) {
        clearInterval(interval)
        alert('✅ WhatsApp conectado com sucesso!')
        window.location.reload() // Ou atualizar estado
      }
    }, 3000) // Verifica a cada 3 segundos

    // Parar após 2 minutos
    setTimeout(() => clearInterval(interval), 120000)
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {loading ? 'Conectando...' : '📱 Conectar WhatsApp'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {qrCode && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Escaneie o QR Code:</h3>
          <img src={qrCode} alt="QR Code WhatsApp" className="border" />
          <p className="text-sm text-gray-600 mt-2">
            Abra o WhatsApp no seu celular {'>'} Menu {'>'} Aparelhos Conectados {'>'} Conectar um aparelho
          </p>
        </div>
      )}
    </div>
  )
}
```

### 4.2. Obter e Exibir QR Code

O QR Code é retornado diretamente na resposta da API em formato **base64**.

**Formatos possíveis:**
- `data:image/png;base64,iVBORw0KG...` (completo)
- `iVBORw0KG...` (apenas base64)

Para exibir no HTML:

```jsx
{qrCode && (
  <img
    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
    alt="QR Code WhatsApp"
  />
)}
```

### 4.3. Webhook de Conexão

Quando o usuário escaneia o QR Code, a Evolution API envia um webhook:

**Evento:** `CONNECTION_UPDATE`

**Payload:**
```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "swiftbot_user123",
  "data": {
    "state": "open",
    "ownerJid": "5511999999999@s.whatsapp.net"
  }
}
```

O webhook handler (`/api/webhooks/evolution/route.js`) automaticamente:
1. Atualiza `status` para `connected`
2. Define `is_connected` como `true`
3. Salva `phone_number_id`
4. Registra `last_connected_at`

---

## 5. Gerenciamento de Dados

### 5.1. Verificar Status da Instância

**Endpoint:** `GET /api/whatsapp/instance/manage?userId={userId}`

**Response:**
```json
{
  "success": true,
  "connected": true,
  "status": "open",
  "data": {
    "instanceName": "swiftbot_user123",
    "phoneNumber": "5511999999999",
    "lastConnected": "2025-01-18T12:00:00Z"
  }
}
```

**Exemplo:**
```javascript
const response = await fetch(`/api/whatsapp/instance/manage?userId=${userId}`)
const { connected, status, data } = await response.json()

if (connected) {
  console.log('WhatsApp conectado:', data.phoneNumber)
} else {
  console.log('WhatsApp desconectado')
}
```

### 5.2. Atualizar Campos Administrativos

**Endpoint:** `PUT /api/whatsapp/instance/manage`

**Request Body:**
```json
{
  "connectionId": "uuid-da-conexao",
  "adminFields": {
    "adminField01": "novo_client_id",
    "adminField02": "novo_valor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campos administrativos atualizados com sucesso"
}
```

**Exemplo:**
```javascript
await fetch('/api/whatsapp/instance/manage', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    connectionId: 'uuid-da-conexao',
    adminFields: {
      adminField01: 'client_abc',
      adminField02: 'departamento_ti'
    }
  })
})
```

### 5.3. Desconectar Instância

**Endpoint:** `DELETE /api/whatsapp/instance/manage?connectionId={id}&delete=false`

**Parâmetros:**
- `connectionId` (obrigatório): UUID da conexão
- `delete` (opcional): `true` para deletar completamente, `false` para apenas desconectar

**Response:**
```json
{
  "success": true,
  "message": "Instância desconectada com sucesso"
}
```

**Exemplo:**
```javascript
// Apenas desconectar (mantém registro no banco)
await fetch(`/api/whatsapp/instance/manage?connectionId=${id}&delete=false`, {
  method: 'DELETE'
})

// Deletar completamente
await fetch(`/api/whatsapp/instance/manage?connectionId=${id}&delete=true`, {
  method: 'DELETE'
})
```

---

## 6. Considerações de Segurança

### 6.1. Variáveis de Ambiente Protegidas

**NUNCA expor ao frontend:**
```bash
EVOLUTION_API_KEY=xxx          # Admin token (apenas backend)
SUPABASE_SERVICE_ROLE_KEY=xxx   # Service role (apenas backend)
WEBHOOK_AUTH_USER=xxx
WEBHOOK_AUTH_PASS=xxx
```

**OK para expor:**
```bash
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 6.2. Autenticação de Webhook

O webhook da Evolution API deve validar credenciais:

```javascript
// app/api/webhooks/evolution/route.js
const authHeader = request.headers.get('authorization')
const expectedAuth = Buffer.from(
  `${process.env.WEBHOOK_AUTH_USER}:${process.env.WEBHOOK_AUTH_PASS}`
).toString('base64')

if (authHeader !== `Basic ${expectedAuth}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Configure na Evolution API:
```json
{
  "webhook": {
    "url": "https://usuario:senha@seu-dominio.com/api/webhooks/evolution",
    "enabled": true
  }
}
```

### 6.3. RLS (Row Level Security) do Supabase

O schema já inclui políticas RLS para garantir que usuários só acessem suas próprias conexões:

```sql
-- Usuários podem ver apenas suas próprias conexões
CREATE POLICY "Users can view own connections" ON whatsapp_connections
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 6.4. Validação de Assinatura

A API valida automaticamente se o usuário tem assinatura ativa antes de permitir conexão:

```javascript
// app/api/whatsapp/instance/manage/route.js (linhas 22-39)
const blockedStatuses = ['canceled', 'cancelled', 'expired', ...]
if (blockedStatuses.includes(subscription.status)) {
  return NextResponse.json({
    success: false,
    error: 'Assinatura inativa'
  }, { status: 403 })
}
```

### 6.5. Rate Limiting (Recomendado)

Implemente rate limiting para evitar abuso:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```javascript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requisições por hora
})

export async function POST(request) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ... resto do código
}
```

---

## 7. Exemplos de Uso Frontend

### 7.1. Componente React Completo

```jsx
// app/components/WhatsAppManager.js
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function WhatsAppManager() {
  const [user, setUser] = useState(null)
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      checkConnection()
    }
  }, [user])

  const fetchUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkConnection = async () => {
    if (!user) return

    const response = await fetch(`/api/whatsapp/instance/manage?userId=${user.id}`)
    const data = await response.json()

    if (data.success && data.connected) {
      setConnection(data.data)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    setQrCode(null)

    try {
      const response = await fetch('/api/whatsapp/instance/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setQrCode(data.data.qrCode)

      // Polling
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/whatsapp/instance/manage?userId=${user.id}`)
        const statusData = await statusResponse.json()

        if (statusData.connected) {
          clearInterval(pollInterval)
          setConnection(statusData.data)
          setQrCode(null)
        }
      }, 3000)

      setTimeout(() => clearInterval(pollInterval), 120000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!connection || !confirm('Deseja realmente desconectar?')) return

    setLoading(true)

    try {
      const response = await fetch(
        `/api/whatsapp/instance/manage?connectionId=${connection.id}&delete=false`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.success) {
        setConnection(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <p>Carregando...</p>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Gerenciar WhatsApp</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {connection ? (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-bold text-green-800 mb-2">✅ WhatsApp Conectado</h3>
          <p className="text-sm text-gray-700">
            <strong>Número:</strong> {connection.phoneNumber || 'Carregando...'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Instância:</strong> {connection.instanceName}
          </p>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {loading ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Conectando...' : '📱 Conectar WhatsApp'}
          </button>

          {qrCode && (
            <div className="mt-6 border rounded p-4">
              <h3 className="font-bold mb-2">Escaneie o QR Code:</h3>
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code"
                className="mx-auto border"
              />
              <p className="text-sm text-gray-600 mt-2 text-center">
                Abra o WhatsApp {'>'} Menu {'>'} Aparelhos Conectados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 7.2. Usando em Server Components (Next.js 15)

```jsx
// app/dashboard/whatsapp/page.js
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase'
import WhatsAppManager from '@/components/WhatsAppManager'

export default async function WhatsAppPage() {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar conexão existente
  const { data: connection } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div>
      <h1>WhatsApp Integration</h1>
      <WhatsAppManager initialConnection={connection} />
    </div>
  )
}
```

---

## 8. Troubleshooting

### Erro: "Token da instância não foi gerado"

**Causa:** A Evolution API não retornou o campo `hash`.

**Solução:**
1. Verifique se `EVOLUTION_API_KEY` está correto
2. Teste manualmente a API:
```bash
curl -X POST "https://evolution.swiftbot.com.br/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_TOKEN" \
  -d '{"instanceName": "teste123", "qrcode": true}'
```

### Erro: "QR Code não disponível"

**Causa:** QR Code não está sendo retornado ou está em formato diferente.

**Solução:**
A biblioteca `uazapi-client.js` já tenta extrair de múltiplos formatos. Verifique os logs:

```javascript
console.log('Connect Data:', JSON.stringify(connectData, null, 2))
```

### Webhook não está sendo chamado

**Causa:** Webhook não configurado ou URL incorreta.

**Solução:**
1. Verifique se configurou webhook global:
```bash
curl "https://evolution.swiftbot.com.br/globalwebhook" \
  -H "apikey: SEU_TOKEN"
```

2. Verifique se sua URL está acessível publicamente (use ngrok para desenvolvimento local):
```bash
ngrok http 3000
```

3. Configure com a URL do ngrok:
```javascript
await uazapi.setGlobalWebhook({
  url: 'https://abc123.ngrok.io/api/webhooks/evolution'
})
```

### Instância desconecta sozinha

**Causa:** WhatsApp pode desconectar por inatividade ou múltiplos logins.

**Solução:**
1. Implemente reconexão automática via webhook `CONNECTION_LOST`
2. Notifique o usuário por email/push notification

### Erro de permissão no Supabase

**Causa:** RLS (Row Level Security) bloqueando acesso.

**Solução:**
1. Verifique se está usando o `service_role_key` para operações backend
2. Para operações do usuário, use `anon_key` com autenticação:

```javascript
// Backend (Route Handler)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Ignora RLS
)

// Frontend
const supabase = createClient() // Usa anon_key + auth
```

---

## 🎯 Checklist de Implementação

- [x] Schema do Supabase criado (`database/schema-whatsapp.sql`)
- [x] Biblioteca UAZAPI implementada (`lib/uazapi-client.js`)
- [x] API de gerenciamento criada (`/api/whatsapp/instance/manage`)
- [x] Webhook handler implementado (`/api/webhooks/evolution`)
- [ ] Configurar webhook global na Evolution API
- [ ] Adicionar variáveis de ambiente no `.env.local`
- [ ] Testar fluxo completo de conexão
- [ ] Implementar componente React de UI
- [ ] Adicionar notificações de desconexão
- [ ] Implementar rate limiting (opcional)
- [ ] Monitorar logs da Evolution API

---

## 📚 Recursos Adicionais

- **Documentação Evolution API:** https://evolution.swiftbot.com.br/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js App Router:** https://nextjs.org/docs/app

---

**✅ Guia completo criado!** Você agora tem tudo que precisa para integrar o WhatsApp ao seu SaaS usando a Evolution API (UAZAPI).
