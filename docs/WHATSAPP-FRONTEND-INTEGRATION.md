# 📱 Integração Frontend WhatsApp - Guia Completo

## 🎯 Objetivo

Este documento explica como integrar a conexão WhatsApp no frontend da aplicação **Swiftbot**, incluindo:
- Exibição do QR Code
- Polling automático de status
- Fechamento automático do modal
- Atualização do dashboard

---

## 🏗️ Arquitetura

```
Frontend (React)          Backend (Next.js API)          UAZAPI
     │                           │                          │
     ├─1─► POST /connect ────────►────2─► POST /init ──────►
     │                           │          (systemName)     │
     │◄────── QR Code ────────────◄──────── token ──────────◄
     │                           │                          │
     ├─3─► GET /connect ─────────►────4─► GET /status ─────►
     │     (polling 30s)          │                          │
     │◄──── status: open ─────────◄────────connected ───────◄
     │                           │                          │
     └─5─► Fecha modal + Update Dashboard
```

---

## 📦 Componentes Criados

### 1. `WhatsAppConnectModal.jsx` (Modal Principal)

**Localização**: `app/components/WhatsAppConnectModal.jsx`

**Responsabilidades**:
- ✅ Gerenciar conexão WhatsApp
- ✅ Exibir QR Code
- ✅ Polling automático (30s)
- ✅ Fechar quando conectado/desconectado
- ✅ Callback com dados da instância

**Props**:
```typescript
interface WhatsAppConnectModalProps {
  isOpen: boolean                    // Controla visibilidade
  onClose: () => void                // Callback ao fechar
  connectionId: string               // ID da conexão no Supabase
  onConnectionSuccess?: (data) => void  // Callback quando conectar
}
```

**Uso**:
```jsx
import WhatsAppConnectModal from '@/app/components/WhatsAppConnectModal'

<WhatsAppConnectModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  connectionId="connection-uuid"
  onConnectionSuccess={(data) => {
    console.log('Conectado:', data.profileName)
    // Atualizar estado global aqui
  }}
/>
```

---

### 2. `WhatsAppDashboard.jsx` (Exemplo Completo)

**Localização**: `app/components/WhatsAppDashboard.jsx`

**Responsabilidades**:
- ✅ Exibir status da conexão
- ✅ Avatar e nome do perfil
- ✅ Botão para abrir modal
- ✅ Métricas (mensagens, contatos, grupos)
- ✅ Carregar status inicial
- ✅ Atualizar UI após conexão

**Uso**:
```jsx
import WhatsAppDashboard from '@/app/components/WhatsAppDashboard'

export default function Page() {
  return (
    <WhatsAppDashboard
      userId="user-uuid"
      connectionId="connection-uuid"
    />
  )
}
```

---

## 🔄 Fluxo Detalhado

### **Passo 1: Usuário Abre Modal**

```javascript
// No seu componente
const [showModal, setShowModal] = useState(false)

<button onClick={() => setShowModal(true)}>
  Conectar WhatsApp
</button>
```

### **Passo 2: Modal Inicia Conexão (POST)**

```javascript
// WhatsAppConnectModal.jsx - handleConnect()
const response = await fetch('/api/whatsapp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ connectionId })
})

const data = await response.json()
// {
//   success: true,
//   qrCode: "data:image/png;base64,...",
//   status: "connecting",
//   instanceToken: "YCXL1ENX...",
//   ...
// }
```

### **Passo 3: Backend Processa**

```javascript
// app/api/whatsapp/connect/route.js - POST
// 1. Verifica se instância existe no banco
if (connection.instance_token) {
  // Reutiliza token existente
} else {
  // Cria nova instância
  POST /instance/init {
    name: instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    systemName: "Swiftbot 1.0"  // ✅ Identificação no WhatsApp
  }
}

// 2. Conecta
POST /instance/connect

// 3. Obtém QR Code
GET /instance/status → { instance: { qrcode: "...", status: "connecting" } }
```

### **Passo 4: Frontend Exibe QR Code**

```jsx
// WhatsAppConnectModal.jsx
{qrCode && (
  <img src={qrCode} alt="QR Code WhatsApp" />
)}
```

### **Passo 5: Polling Inicia (30 segundos)**

```javascript
// WhatsAppConnectModal.jsx - startPolling()
const startPolling = () => {
  pollingTimerRef.current = setInterval(() => {
    checkStatus() // Chama GET /api/whatsapp/connect
  }, 30000) // 30 segundos
}
```

### **Passo 6: Verificação de Status (GET)**

```javascript
// WhatsAppConnectModal.jsx - checkStatus()
const response = await fetch(
  `/api/whatsapp/connect?connectionId=${connectionId}`,
  { method: 'GET' }
)

const data = await response.json()
// {
//   success: true,
//   status: "open",           // ✅ Conectado!
//   connected: true,
//   profileName: "João Silva",
//   profilePicUrl: "https://...",
//   owner: "5511999999999"
// }
```

### **Passo 7: Fecha Modal Automaticamente**

```javascript
// WhatsAppConnectModal.jsx - checkStatus()
if (data.connected || data.status === 'open') {
  console.log('✅ WhatsApp conectado!')
  stopPolling()

  // Callback com dados
  onConnectionSuccess?.({
    instanceName: data.instanceName,
    profileName: data.profileName,
    profilePicUrl: data.profilePicUrl,
    owner: data.owner,
    status: data.status
  })

  // Fechar após 2 segundos
  setTimeout(() => onClose(), 2000)
}
```

### **Passo 8: Dashboard Atualiza**

```javascript
// WhatsAppDashboard.jsx - handleConnectionSuccess()
const handleConnectionSuccess = (data) => {
  // Atualizar estado local
  setInstanceData(data)
  setConnectionStatus('open')

  // Atualizar estado global (Redux, Zustand, etc)
  dispatch(updateWhatsAppInstance(data))

  // Mostrar notificação
  toast.success(`Conectado como ${data.profileName}`)
}
```

---

## ⏱️ Timeline do Polling

```
T=0s:   Modal abre → POST /connect → QR Code exibido
        ↓
        Polling inicia
        ↓
T=30s:  GET /connect → status: "connecting"
        ↓
T=60s:  GET /connect → status: "connecting"
        ↓
T=90s:  GET /connect → status: "open" ✅
        ↓
        Modal fecha automaticamente
        Dashboard atualiza
```

---

## 🎨 Estados Visuais do Modal

### 1. **Loading** (Gerando QR Code)
```jsx
{loading && (
  <div className="animate-spin h-12 w-12 border-b-2 border-green-500"></div>
  <p>Gerando QR Code...</p>
)}
```

### 2. **QR Code** (Aguardando escaneamento)
```jsx
{qrCode && status !== 'open' && (
  <img src={qrCode} alt="QR Code" className="w-64 h-64" />
  <p>⏰ Verificando conexão automaticamente a cada 30 segundos</p>
)}
```

### 3. **Connected** (Sucesso)
```jsx
{status === 'open' && (
  <div>✅ Conectado com sucesso!</div>
  <p>Bem-vindo, {instanceData.profileName}</p>
  <p>Fechando automaticamente...</p>
)}
```

### 4. **Error** (Falha)
```jsx
{error && (
  <div className="bg-red-50">
    <p>❌ {error}</p>
  </div>
)}
```

---

## 📡 API Routes

### **POST /api/whatsapp/connect**

**Cria/conecta instância WhatsApp**

```bash
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"connectionId":"connection-uuid"}'
```

**Resposta**:
```json
{
  "success": true,
  "instanceName": "swiftbot_xxx",
  "instanceToken": "YCXL1ENX...",
  "status": "connecting",
  "connected": false,
  "qrCode": "data:image/png;base64,...",
  "profileName": null,
  "profilePicUrl": null,
  "owner": null,
  "message": "QR Code gerado com sucesso"
}
```

---

### **GET /api/whatsapp/connect**

**Verifica status da conexão (polling)**

```bash
curl -X GET "http://localhost:3000/api/whatsapp/connect?connectionId=connection-uuid"
```

**Resposta (Conectado)**:
```json
{
  "success": true,
  "status": "open",
  "connected": true,
  "profileName": "João Silva",
  "profilePicUrl": "https://pps.whatsapp.net/xxx",
  "owner": "5511999999999",
  "instanceName": "swiftbot_xxx",
  "message": "Conectado"
}
```

**Resposta (Conectando)**:
```json
{
  "success": true,
  "status": "connecting",
  "connected": false,
  "profileName": null,
  "profilePicUrl": null,
  "owner": null,
  "instanceName": "swiftbot_xxx",
  "message": "Aguardando conexão"
}
```

---

## 🔧 Configuração da API UAZAPI

### **systemName: "Swiftbot 1.0"**

Quando a instância é criada, o campo `systemName` identifica o sistema no WhatsApp:

```javascript
// app/api/whatsapp/connect/route.js
body: JSON.stringify({
  name: instanceName,
  qrcode: true,
  integration: 'WHATSAPP-BAILEYS',
  systemName: 'Swiftbot 1.0'  // ✅ Aparece no WhatsApp Web
})
```

---

## 🚀 Integração com Estado Global

### **Exemplo com Zustand**

```javascript
// store/whatsapp.js
import { create } from 'zustand'

export const useWhatsAppStore = create((set) => ({
  instance: null,
  isConnected: false,

  setInstance: (data) => set({
    instance: data,
    isConnected: data.status === 'open'
  }),

  clearInstance: () => set({
    instance: null,
    isConnected: false
  })
}))
```

```javascript
// WhatsAppDashboard.jsx
import { useWhatsAppStore } from '@/store/whatsapp'

const handleConnectionSuccess = (data) => {
  // Atualizar Zustand
  useWhatsAppStore.getState().setInstance(data)
}
```

---

## 📋 Checklist de Implementação

- [x] ✅ API Route POST /api/whatsapp/connect (criação)
- [x] ✅ API Route GET /api/whatsapp/connect (polling)
- [x] ✅ Componente WhatsAppConnectModal.jsx
- [x] ✅ Componente WhatsAppDashboard.jsx (exemplo)
- [x] ✅ Polling automático (30s)
- [x] ✅ Fechamento automático do modal
- [x] ✅ Extração correta de QR Code (instance.qrcode)
- [x] ✅ systemName: "Swiftbot 1.0"
- [x] ✅ Retorno completo de dados (profileName, avatar, etc)
- [ ] 🔲 Integração com estado global (Redux/Zustand)
- [ ] 🔲 Testes unitários
- [ ] 🔲 Testes E2E

---

## 🐛 Troubleshooting

### **QR Code não aparece**

**Problema**: `✅ QR Code disponível: NÃO`

**Solução**: Verificar extração de dados aninhados
```javascript
// ✅ CORRETO
const qrCode = statusData.instance?.qrcode

// ❌ ERRADO
const qrCode = statusData.qrcode
```

---

### **Modal não fecha automaticamente**

**Problema**: Status conectado mas modal continua aberto

**Solução**: Verificar condição de fechamento
```javascript
// Verificar se callback está sendo chamado
if (data.connected || data.status === 'open') {
  console.log('Fechando modal...') // ← Adicionar log
  onClose()
}
```

---

### **Polling não funciona**

**Problema**: Status não atualiza após 30s

**Solução**: Verificar se timer foi iniciado
```javascript
// Adicionar logs
const startPolling = () => {
  console.log('⏰ Polling iniciado') // ← Verificar log
  pollingTimerRef.current = setInterval(() => {
    console.log('🔍 Verificando status...') // ← Verificar log
    checkStatus()
  }, 30000)
}
```

---

## 📚 Referências

- [Documentação UAZAPI](https://docs.uazapi.com)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)
- [Supabase Client](https://supabase.com/docs/reference/javascript/introduction)

---

## 🎉 Conclusão

A integração está completa e pronta para uso! O fluxo implementado:

1. ✅ Cria instância com `systemName: "Swiftbot 1.0"`
2. ✅ Exibe QR Code no modal
3. ✅ Faz polling a cada 30 segundos
4. ✅ Fecha modal quando conectado
5. ✅ Atualiza dashboard com dados da instância

**Próximos passos recomendados**:
- Integrar com estado global (Redux/Zustand)
- Adicionar testes automatizados
- Implementar desconexão manual
- Adicionar notificações toast
