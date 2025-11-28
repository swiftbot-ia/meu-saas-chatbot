# Guia de Implementação - Webhook UazAPI

## ✅ Implementação Concluída

O processamento de webhooks da UazAPI foi implementado corretamente no SwiftBot, seguindo a mesma lógica do Coonver (sistema em produção).

---

## 📋 O Que Foi Implementado

### 1. **Rota do Webhook**
- **Arquivo:** `app/api/webhooks/uazapi/route.js`
- **Endpoint:** `POST /api/webhooks/uazapi`
- **Funcionalidades:**
  - ✅ Recebe webhooks da UazAPI com estrutura correta
  - ✅ Responde 200 OK imediatamente (evita timeout)
  - ✅ Processa mensagens de forma assíncrona
  - ✅ Busca conexão pelo `instance_name` (correto!)
  - ✅ Usa campos corretos: `message.chatid`, `message.messageid`, etc
  - ✅ Cria/atualiza contatos automaticamente
  - ✅ Cria/atualiza conversas automaticamente
  - ✅ Salva mensagens com tipo correto (text, audio, image, video, document)
  - ✅ Previne duplicatas
  - ✅ Processa transcrição de áudios (assíncrono)

### 2. **Serviço de Transcrição**
- **Arquivo:** `lib/services/TranscriptionService.js`
- **Funcionalidades:**
  - ✅ Usa arquivos locais salvos na VPS (não URLs do WhatsApp)
  - ✅ Transcrição via OpenAI Whisper API
  - ✅ Atualização automática da mensagem com transcrição
  - ✅ Logs detalhados

### 3. **Armazenamento Local de Mídias** ⭐ NOVO
- **Arquivo:** `lib/services/MediaStorageService.js`
- **Funcionalidades:**
  - ✅ Download automático de TODAS as mídias (áudio, imagem, vídeo, documento)
  - ✅ Salvamento local em `/storage/media/{tipo}/`
  - ✅ Nomenclatura organizada: `YYYY-MM-DD_hash.ext`
  - ✅ URLs do WhatsApp não são mais usadas (evita expiração)
  - ✅ Banco salva caminho local em `media_url`

### 4. **API de Servir Mídias**
- **Arquivo:** `app/api/media/[...path]/route.js`
- **Endpoint:** `GET /api/media/{tipo}/{arquivo}`
- **Funcionalidades:**
  - ✅ Serve arquivos salvos localmente via HTTP
  - ✅ Headers corretos (Content-Type, Cache-Control)
  - ✅ Proteção contra directory traversal
  - ✅ Cache de longo prazo (1 ano)

**📖 Guia completo de testes:** Veja [`MEDIA_STORAGE_TEST_GUIDE.md`](./MEDIA_STORAGE_TEST_GUIDE.md)

---

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# OpenAI API (para transcrição de áudios)
OPENAI_API_KEY=sk-proj-...

# Supabase - Banco Principal
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase - Banco de Chat
NEXT_PUBLIC_CHAT_SUPABASE_URL=https://seu-chat.supabase.co
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=eyJ...

# Supabase - Service Role Key (para webhooks - bypassa RLS)
CHAT_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Banco de Dados

As tabelas necessárias já existem:

**Banco Principal:**
- `whatsapp_connections` (conexões/instâncias)

**Banco de Chat:**
- `whatsapp_contacts` (contatos)
- `whatsapp_conversations` (conversas)
- `whatsapp_messages` (mensagens)

Se precisar criar as tabelas de chat, execute:
```bash
# Aplicar migration do chat
psql <connection-string> < supabase/migrations/20251128_create_chat_tables_fixed.sql
```

---

## 📊 Estrutura do Webhook UazAPI

### Exemplo de Payload - Mensagem de Texto

```json
{
  "BaseUrl": "https://swiftbot.uazapi.com",
  "EventType": "messages",
  "instanceName": "swiftbot_badac65f-fa80-465b-9d1c-2e6819f876f0",
  "owner": "639610391368",
  "token": "fab51d6f-4ed9-4291-add7-55d572283f6e",
  "chat": {
    "name": "Sostenes UK",
    "phone": "+44 7447 021530",
    "wa_chatid": "447447021530@s.whatsapp.net",
    "wa_name": "Alexandre Sostenes",
    "imagePreview": "https://pps.whatsapp.net/..."
  },
  "message": {
    "chatid": "447447021530@s.whatsapp.net",
    "sender": "447447021530@s.whatsapp.net",
    "messageid": "2A777F0441C9A3C56A2B",
    "fromMe": false,
    "text": "Olá!",
    "messageTimestamp": 1764357722000,
    "messageType": "Conversation",
    "type": "text",
    "senderName": "Alexandre Sostenes"
  }
}
```

### Exemplo de Payload - Mensagem de Áudio

```json
{
  "EventType": "messages",
  "instanceName": "swiftbot_badac65f-fa80-465b-9d1c-2e6819f876f0",
  "message": {
    "chatid": "447447021530@s.whatsapp.net",
    "messageid": "2A3AF7466BAC77CBA05E",
    "fromMe": false,
    "messageTimestamp": 1764357736000,
    "messageType": "AudioMessage",
    "mediaType": "ptt",
    "type": "media",
    "content": {
      "URL": "https://mmg.whatsapp.net/v/t62.7117-24/...",
      "mimetype": "audio/ogg; codecs=opus",
      "seconds": 2,
      "PTT": true
    }
  }
}
```

---

## 🔍 Campos Corretos Usados

| Dado Necessário | ❌ Baileys (Antigo) | ✅ UazAPI (Implementado) |
|-----------------|---------------------|--------------------------|
| Remote JID | `message.key.remoteJid` | `message.chatid` |
| Message ID | `message.key.id` | `message.messageid` |
| From Me | `message.key.fromMe` | `message.fromMe` |
| Text | `message.message.conversation` | `message.text` |
| Timestamp | `message.messageTimestamp` | `message.messageTimestamp` |
| Instance | `payload.instance` | `payload.instanceName` |

---

## 🧪 Como Testar

### 1. Testar se Webhook Está Online

```bash
curl https://seu-dominio.com/api/webhooks/uazapi
```

**Resposta esperada:**
```json
{
  "status": "online",
  "message": "UazAPI Webhook is running",
  "timestamp": "2025-11-28T...",
  "version": "2.0"
}
```

### 2. Simular Webhook de Mensagem de Texto

```bash
curl -X POST https://seu-dominio.com/api/webhooks/uazapi \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "messages",
    "instanceName": "swiftbot_badac65f-fa80-465b-9d1c-2e6819f876f0",
    "chat": {
      "name": "Teste",
      "wa_name": "Teste User",
      "imagePreview": "https://example.com/pic.jpg"
    },
    "message": {
      "chatid": "5511999999999@s.whatsapp.net",
      "messageid": "TEST123",
      "fromMe": false,
      "text": "Mensagem de teste",
      "messageTimestamp": 1700000000000,
      "type": "text"
    }
  }'
```

### 3. Verificar Logs

```bash
# Ver logs do servidor
npm run dev

# ou
docker logs -f swiftbot
```

**Logs esperados:**
```
📨 Webhook UazAPI recebido: { EventType: 'messages', instanceName: 'swiftbot_...', ... }
💬 Processando mensagem: TEST123
✅ Conexão encontrada: swiftbot_... (user: ...)
✅ Contato criado: 5511999999999
✅ Conversa criada: uuid-...
✅ Mensagem salva: uuid-... (tipo: text)
✅ Processamento completo!
```

### 4. Verificar no Banco de Dados

```sql
-- Verificar contatos criados
SELECT * FROM whatsapp_contacts ORDER BY created_at DESC LIMIT 5;

-- Verificar conversas criadas
SELECT * FROM whatsapp_conversations ORDER BY created_at DESC LIMIT 5;

-- Verificar mensagens salvas
SELECT
  m.id,
  m.message_type,
  m.message_content,
  m.direction,
  c.name as contact_name
FROM whatsapp_messages m
JOIN whatsapp_contacts c ON m.contact_id = c.id
ORDER BY m.received_at DESC
LIMIT 10;
```

---

## 📝 Fluxo de Processamento

```
1. Webhook chega → POST /api/webhooks/uazapi
   ↓
2. Responder 200 OK imediatamente
   ↓
3. Processar assincronamente:
   ↓
4. Validar EventType e instanceName
   ↓
5. Buscar conexão: WHERE instance_name = instanceName
   ↓
6. Extrair dados:
   - phoneNumber = message.chatid.replace('@s.whatsapp.net', '')
   - remoteJid = message.chatid
   - messageId = message.messageid
   ↓
7. Criar/buscar CONTATO (whatsapp_contacts)
   ↓
8. Criar/buscar CONVERSA (whatsapp_conversations)
   ↓
9. Verificar DUPLICATA (message_id + conversation_id)
   ↓
10. Determinar tipo (text, audio, image, video, document)
   ↓
11. Se tem mídia → Download e salvamento local (MediaStorageService)
   - Download da URL do WhatsApp
   - Salvar em storage/media/{tipo}/YYYY-MM-DD_hash.ext
   - Retornar caminho local
   ↓
12. Salvar MENSAGEM (whatsapp_messages)
   - media_url = caminho local (não URL do WhatsApp)
   ↓
13. Atualizar conversa (last_message_at, unread_count)
   ↓
14. Se áudio → Processar transcrição (assíncrono)
   - Usar arquivo local salvo na VPS
   - Transcrever com OpenAI Whisper
   - Atualizar message_content com transcrição
   ↓
15. ✅ Concluído!
```

---

## 🎤 Transcrição de Áudios

### Como Funciona

1. Mensagem de áudio é recebida
2. Áudio é baixado e salvo localmente via `MediaStorageService`
3. Mensagem é salva com `media_url` apontando para arquivo local
4. `TranscriptionService` é chamado assincronamente:
   - Usa arquivo local já salvo em `storage/media/audio/`
   - Transcrição via OpenAI Whisper
   - Atualização da mensagem com texto transcrito no campo `message_content`
   - Arquivo permanece salvo (não é deletado)

### Verificar Transcrições

```sql
-- Ver mensagens de áudio com transcrição
SELECT
  id,
  message_type,
  message_content as transcription,
  media_url,
  metadata->>'transcribed_at' as transcribed_at
FROM whatsapp_messages
WHERE message_type = 'audio'
ORDER BY received_at DESC;
```

---

## ⚠️ Problemas Corrigidos

### ❌ Problema 1: Estrutura Baileys vs UazAPI
**Erro:** `Cannot read properties of undefined (reading 'remoteJid')`

**Causa:** Código tentava acessar `message.key.remoteJid` (Baileys)

**Solução:** Usar `message.chatid` (UazAPI)

### ❌ Problema 2: Busca de Conexão Incorreta
**Erro:** `Conexão não encontrada: Imperial Laser Brasil`

**Causa:** Buscava pelo nome do remetente ao invés de `instanceName`

**Solução:** Buscar por `instance_name = payload.instanceName`

### ❌ Problema 3: Nada Salvo no Banco
**Causa:** Código quebrava antes de salvar devido aos erros acima

**Solução:** Implementação completa do fluxo correto

---

## 📚 Diferenças: Coonver vs SwiftBot

| Aspecto | Coonver | SwiftBot |
|---------|---------|----------|
| **Framework** | Node.js + Express | Next.js 14 (App Router) |
| **Linguagem** | JavaScript | JavaScript |
| **Banco de Dados** | PostgreSQL + Prisma | Supabase (dual-database) |
| **Tabelas** | `licencas`, `contatos`, `conversas`, `mensagens` | `whatsapp_connections`, `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages` |
| **Campo Licença** | `numeroInstancia` | `instance_name` |
| **Lógica** | IDÊNTICA ✅ | IDÊNTICA ✅ |

---

## 🚀 Deploy

### 1. Verificar Variáveis de Ambiente

```bash
# No servidor/Vercel, configure:
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_CHAT_SUPABASE_URL=...
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=...
```

### 2. Configurar Webhook na UazAPI

```bash
# URL do webhook
https://seu-dominio.com/api/webhooks/uazapi

# Eventos para ouvir
- messages (mensagens recebidas)
- status (status de mensagens enviadas)
```

### 3. Testar em Produção

Envie uma mensagem real para o WhatsApp conectado e verifique:
- ✅ Logs mostram processamento
- ✅ Contato criado no banco
- ✅ Conversa criada no banco
- ✅ Mensagem salva no banco
- ✅ (Áudio) Transcrição processada

---

## 📊 Monitoramento

### Logs Importantes

```javascript
// Webhook recebido
"📨 Webhook UazAPI recebido"

// Conexão encontrada
"✅ Conexão encontrada: swiftbot_..."

// Contato criado/atualizado
"✅ Contato criado: 5511999999999"

// Mensagem salva
"✅ Mensagem salva: uuid-... (tipo: text)"

// Transcrição iniciada
"🎤 Áudio detectado, iniciando transcrição..."

// Processamento completo
"✅ Processamento completo!"
```

### Avisos

```javascript
// Conexão não encontrada (verificar instance_name)
"⚠️ Conexão não encontrada: swiftbot_..."

// Mensagem duplicada (normal)
"ℹ️ Mensagem duplicada ignorada: ABC123"

// Transcrição desabilitada
"⚠️ OPENAI_API_KEY não configurada - transcrições desabilitadas"
```

---

## 🐛 Troubleshooting

### Problema: "Conexão não encontrada"

**Verifique:**
1. `instance_name` existe na tabela `whatsapp_connections`
2. O valor é exatamente igual ao `payload.instanceName`

```sql
SELECT instance_name FROM whatsapp_connections;
```

### Problema: Mensagens não são salvas

**Verifique:**
1. Logs mostram "✅ Mensagem salva"?
2. Erro de permissão RLS no Supabase?
3. Campo `user_id` está correto?

### Problema: Transcrição não funciona

**Verifique:**
1. `OPENAI_API_KEY` está configurada?
2. Logs mostram "🎤 Áudio detectado"?
3. URL do áudio está acessível?

---

## ✅ Checklist de Validação

- [ ] Webhook responde 200 OK no GET
- [ ] Webhook processa mensagem de texto
- [ ] Contato é criado no banco
- [ ] Conversa é criada no banco
- [ ] Mensagem é salva no banco
- [ ] Webhook processa mensagem de áudio
- [ ] Transcrição é processada (se OpenAI configurado)
- [ ] Duplicatas são ignoradas
- [ ] Logs são claros e detalhados

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do servidor
2. Estrutura do payload recebido
3. Configuração do banco de dados
4. Variáveis de ambiente

O código está implementado seguindo exatamente a lógica do Coonver (sistema em produção), portanto deve funcionar corretamente com a UazAPI.
