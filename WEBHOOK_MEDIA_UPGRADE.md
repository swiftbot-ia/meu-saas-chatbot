# 📋 Webhook Media Storage & Transcription - Guia de Implementação

## 🎯 Resumo das Mudanças

Este upgrade adiciona funcionalidades completas de processamento de mídia à webhook do WhatsApp:

✅ **Download e Armazenamento Local de Mídias** (VPS)
✅ **Transcrição de Áudio** com OpenAI Whisper
✅ **Interpretação de Imagens** com GPT-4 Vision
✅ **Extração de Texto de Documentos** com GPT-4
✅ **Armazenamento de Transcrições** no banco de dados

---

## 📦 Novos Arquivos Criados

### 1. **Serviços**
- `lib/MediaService.js` - Download e armazenamento de mídias
- `lib/OpenAIService.js` - Integração com OpenAI para transcrição

### 2. **Migração de Banco**
- `supabase/migrations/20251201_add_media_transcription_fields.sql`

### 3. **Configuração**
- `.env.example` - Variáveis de ambiente necessárias

### 4. **Arquivos Modificados**
- `lib/MessageService.js` - Adicionado processamento de mídia
- `package.json` - Adicionada dependência `openai`

---

## 🗄️ Mudanças no Banco de Dados

### Novos Campos na Tabela `whatsapp_messages`

```sql
-- Armazenamento de mídia
local_media_path TEXT              -- Caminho local do arquivo (ex: media/audio/msg_abc123_hash.mp3)
media_mime_type VARCHAR(100)       -- Tipo MIME (ex: audio/ogg, image/jpeg)
media_size BIGINT                  -- Tamanho do arquivo em bytes

-- Transcrição e IA
transcription TEXT                 -- Texto transcrito (áudio) ou extraído (documento)
transcription_status VARCHAR(50)   -- Status: pending, processing, completed, failed, skipped
ai_interpretation TEXT             -- Interpretação/descrição gerada pela IA

-- Timestamps
media_downloaded_at TIMESTAMPTZ    -- Quando a mídia foi baixada
transcribed_at TIMESTAMPTZ         -- Quando a transcrição foi concluída
```

---

## 🚀 Como Implementar

### Passo 1: Aplicar Migração do Banco

**No Supabase Chat Database:**

1. Acesse o Supabase Dashboard do banco de **chat** (não o principal)
2. Vá em **SQL Editor**
3. Execute o SQL da migração:

```bash
cat supabase/migrations/20251201_add_media_transcription_fields.sql
```

Copie e cole o conteúdo no SQL Editor e execute.

### Passo 2: Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env.local`:

```bash
# OpenAI API Key (obrigatório para transcrição)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx

# Base URL do seu servidor (para gerar URLs públicas das mídias)
NEXT_PUBLIC_BASE_URL=https://seu-dominio.com
```

**Como obter a OpenAI API Key:**
1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Copie e adicione ao `.env.local`

### Passo 3: Criar Diretório de Mídias

O sistema criará automaticamente, mas você pode pré-criar:

```bash
mkdir -p public/media/audio
mkdir -p public/media/image
mkdir -p public/media/video
mkdir -p public/media/document
chmod -R 755 public/media
```

### Passo 4: Reinstalar Dependências

```bash
npm install
```

### Passo 5: Reiniciar Aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Ou reinicie o PM2/serviço
pm2 restart all
```

---

## 🔄 Fluxo de Processamento

### Quando uma Mensagem com Mídia é Recebida:

1. **Webhook recebe evento MESSAGES_UPSERT**
2. **MessageService.processIncomingMessage()** identifica mídia
3. **MessageService.processMedia()** é chamado:
   - Download da URL da UAZAPI → Salvo em `public/media/{type}/`
   - Se for **áudio**: Transcrição com Whisper
   - Se for **imagem**: Análise com GPT-4 Vision
   - Se for **documento**: Extração de texto + resumo
4. **Mensagem é salva** no banco com:
   - `local_media_path`: Caminho local do arquivo
   - `transcription`: Texto transcrito/extraído
   - `ai_interpretation`: Descrição gerada pela IA
   - `transcription_status`: completed/failed/skipped

### Exemplo de Mensagem Salva:

```json
{
  "message_id": "3EB0XXXXXX",
  "message_type": "audio",
  "message_content": "Olá, gostaria de saber mais sobre os produtos",
  "media_url": "https://uazapi.com/media/original.ogg",
  "local_media_path": "media/audio/msg_3EB0_a1b2c3d4.ogg",
  "media_mime_type": "audio/ogg",
  "media_size": 45678,
  "transcription": "Olá, gostaria de saber mais sobre os produtos",
  "transcription_status": "completed",
  "ai_interpretation": "Áudio transcrito com 3.2s de duração",
  "media_downloaded_at": "2025-12-01T10:30:00Z",
  "transcribed_at": "2025-12-01T10:30:05Z"
}
```

---

## 🎤 Formatos de Áudio Suportados

### Recebidos da UAZAPI:
- ✅ OGG (Opus)
- ✅ MP3

### Suportados pelo OpenAI Whisper:
- ✅ MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM

**Nota:** OGG pode precisar de conversão para MP3 (implementação futura com ffmpeg)

---

## 💰 Custos da OpenAI

### Whisper (Transcrição de Áudio)
- **Modelo:** `whisper-1`
- **Preço:** $0.006 por minuto de áudio
- **Exemplo:** 1000 áudios de 30s = $3.00

### GPT-4 Vision (Análise de Imagens)
- **Modelo:** `gpt-4o`
- **Preço:** ~$0.01 por imagem (depende da resolução)
- **Exemplo:** 1000 imagens = ~$10.00

**Recomendação:** Configure limites de uso no dashboard da OpenAI

---

## 🛠️ Troubleshooting

### Mídia não está sendo baixada

**Verifique:**
```bash
# Permissões do diretório
ls -la public/media

# Logs da aplicação
pm2 logs
# ou
npm run dev
```

**Solução:**
```bash
chmod -R 755 public/media
chown -R $USER:$USER public/media
```

### Transcrição não está funcionando

**Verifique a API Key:**
```bash
# No terminal do servidor
echo $OPENAI_API_KEY
```

**Teste a API:**
```javascript
// No Node.js REPL ou script de teste
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log('API configurada!');
```

### Erro "File too large"

**Limite da OpenAI Whisper:** 25 MB

**Solução:** Implementar compressão de áudio antes do envio (futuro)

---

## 📊 Monitoramento

### Consultas SQL Úteis

**Ver mensagens com mídia processada:**
```sql
SELECT
  message_id,
  message_type,
  transcription_status,
  media_size,
  LENGTH(transcription) as transcription_length
FROM whatsapp_messages
WHERE message_type IN ('audio', 'image', 'document', 'video')
ORDER BY received_at DESC
LIMIT 20;
```

**Estatísticas de transcrição:**
```sql
SELECT
  transcription_status,
  COUNT(*) as total,
  AVG(media_size) as avg_size_bytes
FROM whatsapp_messages
WHERE message_type = 'audio'
GROUP BY transcription_status;
```

**Mensagens com falha na transcrição:**
```sql
SELECT
  message_id,
  message_type,
  ai_interpretation,
  received_at
FROM whatsapp_messages
WHERE transcription_status = 'failed'
ORDER BY received_at DESC;
```

---

## 🔒 Segurança

### Arquivos de Mídia

- ✅ Armazenados em `public/media/` (servidos estaticamente)
- ✅ Nomes de arquivo aleatórios (hash MD5)
- ⚠️ **URLs públicas** - qualquer um com o link pode acessar

**Melhorias Futuras:**
- Implementar autenticação para acesso a mídias
- Usar Supabase Storage com RLS (Row Level Security)
- Expiração automática de mídias antigas

### Dados Sensíveis

- ✅ Transcrições armazenadas com RLS (apenas dono pode ver)
- ✅ API Keys em variáveis de ambiente
- ✅ Webhook com autenticação básica (opcional)

---

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Conversão automática OGG → MP3 (ffmpeg)
- [ ] Compressão de áudio antes de transcrever
- [ ] Rate limiting para OpenAI
- [ ] Fila de processamento (background jobs)

### Médio Prazo
- [ ] Supabase Storage para mídias (ao invés de local)
- [ ] Transcrição de vídeos (extrair áudio)
- [ ] Cache de transcrições similares
- [ ] Dashboard de custos OpenAI

### Longo Prazo
- [ ] Modelo próprio de transcrição (Whisper self-hosted)
- [ ] Análise de sentimento das transcrições
- [ ] Resumo automático de conversas
- [ ] Detecção de idioma automática

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique os logs: `pm2 logs` ou console do Next.js
2. Consulte a documentação:
   - OpenAI Whisper: https://platform.openai.com/docs/guides/speech-to-text
   - OpenAI Vision: https://platform.openai.com/docs/guides/vision
3. Revise o código em:
   - `lib/MediaService.js`
   - `lib/OpenAIService.js`
   - `lib/MessageService.js`

---

## ✅ Checklist de Implementação

- [ ] Migração do banco aplicada
- [ ] Variável `OPENAI_API_KEY` configurada
- [ ] Variável `NEXT_PUBLIC_BASE_URL` configurada
- [ ] Dependências instaladas (`npm install`)
- [ ] Diretório `public/media/` criado
- [ ] Aplicação reiniciada
- [ ] Testado recebimento de áudio
- [ ] Verificado transcrição no banco
- [ ] Testado recebimento de imagem
- [ ] Verificado interpretação no banco

---

**Data de Implementação:** 2025-12-01
**Versão:** 1.0.0
**Status:** ✅ Pronto para Deploy
