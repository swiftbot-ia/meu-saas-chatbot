# Guia de Implementação - Chat ao Vivo SwiftBot

## ✅ Implementação Completa

O sistema de chat ao vivo foi totalmente implementado e está pronto para uso. Este documento descreve tudo o que foi implementado e como usar o sistema.

---

## 📋 O que Foi Implementado

### 1. Banco de Dados (Supabase/PostgreSQL)

#### Novas Tabelas Criadas:

**whatsapp_contacts**
- Armazena contatos únicos do WhatsApp
- Campos: whatsapp_number, name, profile_pic_url, jid, last_message_at
- RLS habilitado para segurança

**whatsapp_conversations**
- Liga contatos a instâncias específicas do WhatsApp
- Campos: connection_id, contact_id, user_id, unread_count, last_message_at
- Uma conversa por contato por instância
- RLS habilitado para segurança

#### Atualizações em Tabelas Existentes:

**whatsapp_messages**
- Adicionado: conversation_id, contact_id
- Melhor relacionamento entre mensagens, conversas e contatos

#### Funções do Banco:

- `get_or_create_contact()` - Cria ou atualiza contatos
- `get_or_create_conversation()` - Cria ou obtém conversas
- Triggers automáticos para atualizar `updated_at`

### 2. Backend (Services & API Routes)

#### Services Criados:

**lib/ConversationService.js**
- `listConversations()` - Listar conversas com filtros
- `getConversation()` - Obter detalhes de uma conversa
- `getOrCreateContact()` - Criar/atualizar contatos
- `getOrCreateConversation()` - Criar/obter conversas
- `markAsRead()` - Marcar mensagens como lidas
- `archiveConversation()` - Arquivar conversas
- `deleteConversation()` - Deletar conversas
- `getStats()` - Estatísticas de conversas

**lib/MessageService.js**
- `listMessages()` - Listar mensagens de uma conversa
- `sendTextMessage()` - Enviar mensagem de texto
- `sendMediaMessage()` - Enviar mídia (imagem, vídeo, áudio, documento)
- `processIncomingMessage()` - Processar mensagens recebidas do webhook
- `updateMessageStatus()` - Atualizar status de mensagem
- `getStats()` - Estatísticas de mensagens

**lib/uazapi-client.js** (atualizado)
- Adicionados métodos de envio de mensagens:
  - `sendMessage()` - Texto
  - `sendImage()` - Imagem
  - `sendVideo()` - Vídeo
  - `sendAudio()` - Áudio
  - `sendDocument()` - Documento
  - `uploadMedia()` - Upload de mídia

#### API Routes Criadas:

**GET /api/chat/conversations**
- Lista conversas do usuário
- Query params: connectionId, search, limit, offset
- Retorna: { conversations, total, hasMore }

**GET /api/chat/conversations/[id]**
- Obtém detalhes de uma conversa específica

**PATCH /api/chat/conversations/[id]**
- Ações: mark_read, archive, unarchive, toggle_pin

**DELETE /api/chat/conversations/[id]**
- Deleta uma conversa

**GET /api/chat/messages**
- Lista mensagens de uma conversa
- Query params: conversationId (obrigatório), limit, before
- Retorna: { messages, count }

**POST /api/chat/send**
- Envia mensagem de texto
- Body: { conversationId, message }

**POST /api/chat/send-media**
- Envia mensagem com mídia
- FormData: conversationId, mediaUrl, caption, mediaType

#### Webhook Atualizado:

**app/api/webhooks/uazapi/route.js**
- Integrado com MessageService
- Cria automaticamente contatos e conversas
- Processa mensagens recebidas
- Evita duplicatas

### 3. Frontend (Components & Page)

#### Componentes Criados:

**app/components/chat/MessageBubble.jsx**
- Exibe mensagens individuais
- Suporta texto, imagem, vídeo, áudio, documento
- Mostra status de leitura (✓ enviado, ✓✓ entregue, ✓✓ lido)
- Formatação de horário

**app/components/chat/ChatInput.jsx**
- Input de mensagens com auto-resize
- Suporte a anexos (botão de clipe)
- Validação de tamanho (max 50MB)
- Teclas: Enter para enviar, Shift+Enter para nova linha

**app/components/chat/MessageList.jsx**
- Lista de mensagens com scroll infinito
- Auto-scroll para novas mensagens
- Divisores de data (Hoje, Ontem, DD/MM/YYYY)
- Botão "voltar ao final"
- Carregamento de mensagens antigas

**app/components/chat/ConversationList.jsx**
- Lista de conversas
- Busca de conversas
- Badge de não lidas
- Avatar do contato
- Preview da última mensagem
- Indicador de instância

**app/components/chat/ChatWindow.jsx**
- Janela principal de chat
- Header com avatar e nome do contato
- Menu de ações (arquivar, deletar)
- Aviso de WhatsApp desconectado
- Integração completa entre MessageList e ChatInput

#### Página Principal:

**app/dashboard/chat/page.js**
- Interface completa de chat
- Seletor de instâncias (se múltiplas)
- Layout responsivo
- Auto-refresh de conversas (10s)
- Estados de erro e loading
- Validação de conexões

---

## 🚀 Como Usar

### Passo 1: Aplicar Migration do Banco de Dados

Execute a migration SQL no Supabase:

```bash
# Via Supabase Dashboard:
# 1. Acesse seu projeto no Supabase
# 2. Vá em SQL Editor
# 3. Abra o arquivo: supabase/migrations/20251128_create_chat_tables.sql
# 4. Execute o SQL

# OU via CLI do Supabase:
supabase db push
```

### Passo 2: Verificar Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave

# UazAPI
UAZAPI_BASE_URL=https://swiftbot.uazapi.com
UAZAPI_ADMIN_TOKEN=seu_token_admin
```

### Passo 3: Conectar uma Instância do WhatsApp

1. Acesse `/dashboard`
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code ou use o código de pareamento
4. Aguarde a conexão

### Passo 4: Acessar o Chat

1. Acesse `/dashboard/chat`
2. A página carregará automaticamente as conversas
3. Clique em uma conversa para abrir
4. Digite e envie mensagens

---

## 📱 Funcionalidades do Chat

### Envio de Mensagens

**Texto:**
- Digite no campo de input
- Pressione Enter para enviar
- Shift+Enter para nova linha

**Mídia:**
- Clique no ícone de clipe
- Selecione arquivo (imagem, vídeo, áudio, documento)
- Máximo 50MB
- Adicione uma legenda (opcional)

### Recebimento de Mensagens

- Mensagens chegam automaticamente via webhook
- Conversas aparecem na lista da esquerda
- Badge de não lidas
- Notificação visual

### Gestão de Conversas

**Marcar como Lida:**
- Automático ao abrir a conversa

**Arquivar:**
- Menu ⋮ → Arquivar
- Remove da lista principal

**Deletar:**
- Menu ⋮ → Deletar
- Confirmação necessária
- Deleta conversa e mensagens

**Buscar:**
- Campo de busca no topo
- Busca por nome ou número

### Múltiplas Instâncias

Se você tem várias instâncias conectadas:
- Seletor aparece à esquerda
- Clique para trocar entre instâncias
- Cada instância tem suas conversas

---

## 🔧 Arquitetura Técnica

### Fluxo de Mensagens Recebidas

```
WhatsApp → UazAPI → Webhook (/api/webhooks/uazapi)
    ↓
MessageService.processIncomingMessage()
    ↓
1. Buscar/Criar Contato
2. Buscar/Criar Conversa
3. Salvar Mensagem
4. Atualizar Contadores
```

### Fluxo de Mensagens Enviadas

```
ChatInput → ChatWindow.handleSend()
    ↓
POST /api/chat/send
    ↓
MessageService.sendTextMessage()
    ↓
1. Validar Conversa
2. Enviar via UazAPI
3. Salvar no Banco
4. Retornar para Frontend
```

### Segurança (RLS)

Todas as tabelas usam Row Level Security:
- Usuários só veem suas próprias conversas
- Usuários só veem contatos com quem conversaram
- Usuários só enviam mensagens de suas instâncias

### Performance

**Otimizações implementadas:**
- Índices em campos chave (whatsapp_number, conversation_id, etc)
- Paginação de mensagens (50 por vez)
- Auto-refresh controlado (10s)
- Lazy loading de mensagens antigas

---

## 🎨 Interface do Usuário

### Estados Visuais

**Loading:**
- Spinner durante carregamento inicial
- Indicador ao carregar mais mensagens

**Empty States:**
- Nenhuma conexão WhatsApp
- WhatsApp desconectado
- Nenhuma conversa
- Nenhuma mensagem

**Indicadores:**
- Badge de não lidas (círculo verde)
- Status de mensagem (✓ ✓✓)
- Status de conexão (● conectado, ○ desconectado)
- Timestamp relativo (Hoje, Ontem, DD/MM)

### Responsividade

- Desktop: 3 colunas (instâncias, conversas, chat)
- Tablet: 2 colunas (conversas, chat)
- Mobile: 1 coluna por vez

---

## 🐛 Troubleshooting

### Conversas não aparecem

**Causa:** Tabelas não criadas ou migration não aplicada
**Solução:** Execute a migration SQL

### Mensagens não são recebidas

**Causa:** Webhook não configurado ou instância desconectada
**Solução:**
1. Verifique se o webhook está configurado na UazAPI
2. Verifique se a instância está conectada
3. Teste o webhook: `curl -X POST https://seudominio.com/api/webhooks/uazapi`

### Não consigo enviar mensagens

**Causa:** Instância desconectada ou token inválido
**Solução:**
1. Verifique status no dashboard
2. Reconecte a instância
3. Verifique UAZAPI_ADMIN_TOKEN no .env

### Erro "conversationId é obrigatório"

**Causa:** Conversa não foi selecionada
**Solução:** Clique em uma conversa na lista antes de enviar

---

## 🔮 Próximas Melhorias (Opcional)

### Funcionalidades Adicionais

1. **Transcrição de Áudio**
   - Integração com OpenAI Whisper
   - Transcrever áudios automaticamente
   - Exibir transcrição abaixo do áudio

2. **Upload de Mídia**
   - Storage S3 ou local
   - Upload direto de arquivos
   - Preview de imagens antes de enviar

3. **Notificações em Tempo Real**
   - WebSocket ou Supabase Realtime
   - Push notifications
   - Som de notificação

4. **Filtros e Tags**
   - Tags personalizadas para conversas
   - Filtros avançados
   - Categorias

5. **Respostas Rápidas**
   - Templates de mensagens
   - Atalhos de teclado
   - Variáveis dinâmicas

6. **Analytics**
   - Tempo médio de resposta
   - Conversas por dia
   - Mensagens por atendente

### Código para Transcrição de Áudio

Se quiser implementar transcrição, adicione:

```javascript
// lib/TranscriptionService.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function transcribeAudio(audioUrl) {
  try {
    // Download audio
    const response = await fetch(audioUrl);
    const audioBuffer = await response.arrayBuffer();

    // Save to temp file
    const tempPath = `/tmp/audio_${Date.now()}.ogg`;
    await fs.promises.writeFile(tempPath, Buffer.from(audioBuffer));

    // Transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
      language: 'pt'
    });

    // Clean up
    await fs.promises.unlink(tempPath);

    return transcription.text;
  } catch (error) {
    console.error('Erro ao transcrever:', error);
    return null;
  }
}
```

E adicione ao webhook:

```javascript
// Após salvar mensagem de áudio
if (message.message_type === 'audio' && message.direction === 'inbound') {
  // Processar transcrição async
  transcribeAudio(message.media_url).then(text => {
    if (text) {
      supabase
        .from('whatsapp_messages')
        .update({ transcription: text })
        .eq('id', message.id)
        .then(() => console.log('Transcrição salva'));
    }
  });
}
```

---

## 📚 Referências

- [Documentação UazAPI](https://docs.uazapi.com)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

## 📝 Notas Finais

### Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Validação de propriedade nas API routes
- ✅ Sanitização de inputs
- ✅ Rate limiting recomendado (não implementado)

### Escalabilidade

- ✅ Paginação implementada
- ✅ Índices de banco otimizados
- ✅ Queries eficientes
- ⚠️ Cache recomendado para produção

### Manutenção

- ✅ Código modular e reutilizável
- ✅ Comentários e documentação
- ✅ Tratamento de erros
- ✅ Logs estruturados

---

**Implementado em:** 28 de Novembro de 2025
**Versão:** 1.0.0
**Status:** ✅ Produção Ready

Para suporte ou dúvidas, consulte a documentação completa em `/docs/GUIA-INTEGRACAO-WHATSAPP.md`.
