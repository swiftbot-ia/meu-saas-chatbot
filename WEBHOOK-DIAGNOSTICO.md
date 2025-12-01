# 🔍 Diagnóstico: Webhook UAZAPI - Mensagens não salvando

**Data:** 01/12/2025
**Branch:** `claude/fix-webhook-messages-01D2U22Mp5oXbMVw3hPW688z`

---

## 📊 Análise Realizada

### ✅ O que ESTÁ funcionando:

1. **Webhook está recebendo payloads** corretamente
2. **Código da webhook** está atualizado (usa MessageService)
3. **MessageService** tem lógica completa para:
   - Texto (`conversation`, `extendedTextMessage`)
   - Imagens (`imageMessage` + URL)
   - Vídeos (`videoMessage` + URL)
   - Áudios (`audioMessage` + URL)
   - Documentos (`documentMessage` + URL + fileName)
4. **ConversationService** implementado com funções auxiliares
5. **Arquitetura dual-database** implementada (Main DB + Chat DB)

---

## ⚠️ Problemas Identificados:

### 1. **Inconsistência de Schema do Banco de Dados**

**Problema:** Existem DOIS schemas diferentes para `whatsapp_messages`:

**Schema Antigo** (`database/schema-whatsapp.sql`):
```sql
CREATE TABLE whatsapp_messages (
  id UUID,
  connection_id UUID REFERENCES whatsapp_connections(id),
  user_id UUID REFERENCES auth.users(id),
  message_id VARCHAR(255) UNIQUE,
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  message_type VARCHAR(50),
  message_content TEXT,
  media_url TEXT,
  direction VARCHAR(20),
  status VARCHAR(50),
  metadata JSONB,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
-- ❌ NÃO TEM: conversation_id, contact_id, instance_name
```

**Schema Novo** (migration `20251128_create_chat_tables_fixed.sql`):
```sql
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES whatsapp_conversations(id),
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES whatsapp_contacts(id),
  ADD COLUMN IF NOT EXISTS instance_name VARCHAR(255);
```

**Código Atual** (MessageService.js:340-363):
```javascript
await chatSupabase.from('whatsapp_messages').insert({
  instance_name: instanceName,      // ❌ Coluna pode não existir
  connection_id: connectionId,
  conversation_id: conversation.id, // ❌ Coluna pode não existir
  contact_id: contact.id,           // ❌ Coluna pode não existir
  user_id: userId,
  message_id: messageKey.id,
  from_number: whatsappNumber,
  to_number: messageKey.participant || remoteJid,
  message_type: messageType,
  message_content: messageContent,
  media_url: mediaUrl,
  direction: 'inbound',
  status: 'received',
  received_at: new Date(messageTimestamp * 1000).toISOString(),
  metadata: { raw_message: messageData }
})
```

---

### 2. **Migration Pode Não Ter Sido Aplicada**

**Arquivos de Migration:**
- ✅ `supabase/migrations/20251128_create_chat_tables.sql`
- ✅ `supabase/migrations/20251128_create_chat_tables_fixed.sql` (versão idempotente)
- ✅ `supabase/migrations/20251119_remove_user_id_unique_constraint.sql`

**Problema:** Não há evidência de que essas migrations foram aplicadas no banco de dados de **produção/chat**.

---

### 3. **Dual Database - Configuração**

O sistema usa DOIS Supabase:

**Main DB** (autenticação + conexões):
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Chat DB** (mensagens + conversas + contatos):
```env
NEXT_PUBLIC_CHAT_SUPABASE_URL=...
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=...
CHAT_SUPABASE_SERVICE_ROLE_KEY=... (opcional)
```

**Problema Potencial:** Se `NEXT_PUBLIC_CHAT_SUPABASE_URL` não está configurado, o código pode estar tentando salvar no Main DB usando schema incompatível.

---

## 🔧 Soluções Propostas:

### Opção 1: Verificar e Aplicar Migrations (RECOMENDADO)

1. **Confirmar configuração:**
   ```bash
   # Verificar se Chat DB está configurado
   grep CHAT_SUPABASE .env.local
   ```

2. **Aplicar migration no Chat DB:**
   ```bash
   # Via Supabase CLI (se instalado)
   supabase db push --db-url $NEXT_PUBLIC_CHAT_SUPABASE_URL

   # OU aplicar manualmente no Supabase Dashboard:
   # 1. Acessar Chat DB no Supabase
   # 2. SQL Editor
   # 3. Executar: supabase/migrations/20251128_create_chat_tables_fixed.sql
   ```

3. **Verificar schema:**
   ```bash
   # Acessar: http://localhost:3000/api/debug/schema-check
   # Ou via curl:
   curl http://seu-dominio.com/api/debug/schema-check
   ```

---

### Opção 2: Adicionar Logs Detalhados na Webhook

Adicionar logs antes de tentar salvar para diagnosticar o erro exato:

```javascript
// Em: app/api/webhooks/uazapi/route.js - linha 179

console.log('🔍 DEBUG - Processando mensagem:', {
  instanceName,
  connectionId: connection.id,
  userId: connection.user_id,
  messageId: message.key?.id
})

try {
  const savedMessage = await MessageService.processIncomingMessage(
    message,
    instanceName,
    connection.id,
    connection.user_id
  )

  console.log('✅ Mensagem salva:', savedMessage)
} catch (messageError) {
  console.error('❌ ERRO DETALHADO ao processar mensagem:', {
    error: messageError.message,
    stack: messageError.stack,
    code: messageError.code,
    details: messageError.details
  })
}
```

---

### Opção 3: Fallback para Schema Antigo (Temporário)

Se não puder aplicar migrations imediatamente, criar versão compatível com schema antigo:

```javascript
// Criar: lib/MessageService.legacy.js

static async processIncomingMessageLegacy(messageData, connectionId, userId) {
  const chatSupabase = createChatSupabaseClient()

  const messageKey = messageData.key
  const messageInfo = messageData.message

  // Salvar sem conversation_id, contact_id, instance_name
  const { data: message } = await chatSupabase
    .from('whatsapp_messages')
    .insert({
      connection_id: connectionId,
      user_id: userId,
      message_id: messageKey.id,
      from_number: messageKey.remoteJid.split('@')[0],
      to_number: 'unknown',
      message_type: this.getMessageType(messageInfo),
      message_content: this.extractContent(messageInfo),
      media_url: this.extractMediaUrl(messageInfo),
      direction: 'inbound',
      status: 'received',
      metadata: { raw_message: messageData }
    })
    .select()
    .single()

  return message
}
```

---

## 📝 Próximos Passos:

### Passo 1: Diagnóstico
```bash
# Executar script de diagnóstico
curl http://localhost:3000/api/debug/schema-check

# OU criar uma conexão de teste e enviar mensagem pelo WhatsApp
# Verificar logs do Vercel/console
```

### Passo 2: Confirmar Configuração
```bash
# Verificar .env.local
cat .env.local | grep -E "(SUPABASE|CHAT)"

# Confirmar que Chat DB existe e está acessível
```

### Passo 3: Aplicar Correção
```bash
# Se migration não foi aplicada:
# 1. Acessar Supabase Chat DB
# 2. SQL Editor
# 3. Executar migration completa

# Se configuração incorreta:
# 1. Atualizar .env.local
# 2. Reiniciar servidor

# Se outro erro:
# 1. Verificar logs detalhados
# 2. Aplicar correção específica
```

---

## 📂 Arquivos Criados para Diagnóstico:

1. **`/api/debug/schema-check/route.js`**
   - Endpoint para verificar schema do banco
   - Acesso: `GET /api/debug/schema-check`

2. **`scripts/test-webhook-payload.js`**
   - Script para testar webhook com payloads simulados
   - Uso: `node scripts/test-webhook-payload.js textMessage`

3. **`scripts/check-database-schema.js`**
   - Script para verificar schema via CLI (requer @supabase/supabase-js)

---

## 🎯 Conclusão:

**Problema Principal:** Schema do banco de dados pode estar desatualizado/incompatível com o código atual.

**Solução:** Aplicar migration `20251128_create_chat_tables_fixed.sql` no banco de dados de Chat.

**Verificação:** Usar endpoint `/api/debug/schema-check` para confirmar.

---

**Observação:** Não há evidências de que transcrição de áudio estava implementada anteriormente. O sistema salva apenas a URL do áudio no campo `media_url`. Se precisar de transcrição, será necessário implementar integração com Whisper API ou similar.
