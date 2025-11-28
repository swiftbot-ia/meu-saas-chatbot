# Guia de Testes - Armazenamento Local de Mídias

## ✅ Implementação Concluída

O sistema agora salva **TODAS as mídias localmente na VPS** ao invés de usar URLs do WhatsApp que expiram.

---

## 📁 Estrutura de Diretórios

```
/var/www/swiftbot/storage/media/
├── audio/          # Áudios (.ogg, .mp3, .wav)
├── images/         # Imagens (.jpg, .png, .webp)
├── videos/         # Vídeos (.mp4, .webm)
└── documents/      # Documentos (.pdf, .doc, .xls, etc)
```

**Nomenclatura dos arquivos:**
```
2025-11-28_abc12345.ogg
│          │        └── Extensão do arquivo
│          └── Hash MD5 (8 caracteres) do message_id
└── Data (YYYY-MM-DD)
```

---

## 🧪 Como Testar

### 1. Monitorar Logs

Abra um terminal e monitore os logs em tempo real:

```bash
pm2 logs swiftbot --lines 50
```

### 2. Enviar Mensagens de Teste

Envie as seguintes mensagens para o WhatsApp conectado:

#### Teste 1: Mensagem de Texto
- Envie: `Olá, teste de texto`
- **Resultado esperado:**
  ```
  📨 Webhook UazAPI recebido
  💬 Processando mensagem: ABC123
  ✅ Conexão encontrada: swiftbot_...
  ✅ Contato criado/atualizado: 5511999999999
  ✅ Conversa criada/encontrada: uuid-...
  ✅ Mensagem salva: uuid-... (tipo: text)
  ✅ Processamento completo!
  ```

#### Teste 2: Imagem
- Envie uma **imagem** (qualquer foto)
- **Resultado esperado:**
  ```
  📨 Webhook UazAPI recebido
  💬 Processando mensagem: XYZ456
  📥 Baixando image: https://mmg.whatsapp.net/...
  ✅ Mídia salva: images/2025-11-28_abc12345.jpg (245 KB)
  ✅ Mensagem salva: uuid-... (tipo: image)
  ✅ Processamento completo!
  ```

#### Teste 3: Áudio
- Envie um **áudio** (grave uma mensagem de voz)
- **Resultado esperado:**
  ```
  📨 Webhook UazAPI recebido
  💬 Processando mensagem: AUDIO789
  📥 Baixando audio: https://mmg.whatsapp.net/...
  ✅ Mídia salva: audio/2025-11-28_def67890.ogg (42 KB)
  ✅ Mensagem salva: uuid-... (tipo: audio)
  🎤 Áudio detectado, iniciando transcrição...
  🎤 Iniciando transcrição para mensagem: uuid-...
  ✅ Áudio já está salvo localmente: /var/www/swiftbot/storage/media/audio/2025-11-28_def67890.ogg
  🎤 Transcrevendo áudio...
  ✅ Transcrição concluída: "olá este é um teste de áudio"
  ✅ Transcrição salva com sucesso: uuid-...
  ✅ Processamento completo!
  ```

#### Teste 4: Vídeo
- Envie um **vídeo** (grave um vídeo curto)
- **Resultado esperado:**
  ```
  📨 Webhook UazAPI recebido
  📥 Baixando video: https://mmg.whatsapp.net/...
  ✅ Mídia salva: videos/2025-11-28_ghi12345.mp4 (1.2 MB)
  ✅ Mensagem salva: uuid-... (tipo: video)
  ```

#### Teste 5: Documento
- Envie um **documento** (PDF, DOCX, etc)
- **Resultado esperado:**
  ```
  📨 Webhook UazAPI recebido
  📥 Baixando document: https://mmg.whatsapp.net/...
  ✅ Mídia salva: documents/2025-11-28_jkl67890.pdf (512 KB)
  ✅ Mensagem salva: uuid-... (tipo: document)
  ```

---

## 🔍 Verificar Arquivos Salvos

### 1. Listar Arquivos por Tipo

```bash
# Áudios
ls -lh /var/www/swiftbot/storage/media/audio/

# Imagens
ls -lh /var/www/swiftbot/storage/media/images/

# Vídeos
ls -lh /var/www/swiftbot/storage/media/videos/

# Documentos
ls -lh /var/www/swiftbot/storage/media/documents/
```

### 2. Ver Últimos Arquivos Salvos

```bash
# Ver últimos 5 arquivos modificados
find /var/www/swiftbot/storage/media -type f -printf '%T@ %p\n' | sort -n | tail -5 | cut -d' ' -f2-
```

### 3. Calcular Espaço Usado

```bash
# Espaço total usado por tipo
du -sh /var/www/swiftbot/storage/media/*

# Espaço total
du -sh /var/www/swiftbot/storage/media/
```

---

## 📊 Verificar no Banco de Dados

### 1. Conectar ao Supabase Chat

Acesse: https://supabase.com/dashboard/project/wkaylttwkqkwiwihlixj

### 2. Executar Queries de Verificação

#### Ver últimas mensagens salvas
```sql
SELECT
  m.id,
  m.message_type,
  m.message_content,
  m.media_url,
  m.direction,
  m.received_at,
  c.name as contact_name,
  c.whatsapp_number
FROM whatsapp_messages m
JOIN whatsapp_contacts c ON m.contact_id = c.id
ORDER BY m.received_at DESC
LIMIT 10;
```

#### Ver mensagens com mídia local
```sql
SELECT
  message_type,
  media_url,
  message_content,
  received_at
FROM whatsapp_messages
WHERE media_url LIKE '/storage/media/%'
ORDER BY received_at DESC;
```

#### Ver mensagens de áudio transcritas
```sql
SELECT
  id,
  message_content as transcription,
  media_url as audio_file,
  metadata->>'transcribed_at' as transcribed_at,
  received_at
FROM whatsapp_messages
WHERE message_type = 'audio'
  AND message_content IS NOT NULL
  AND message_content != ''
ORDER BY received_at DESC;
```

#### Estatísticas de mídias
```sql
SELECT
  message_type,
  COUNT(*) as total,
  COUNT(CASE WHEN media_url LIKE '/storage/media/%' THEN 1 END) as local_storage,
  COUNT(CASE WHEN media_url LIKE 'https://%' THEN 1 END) as external_urls
FROM whatsapp_messages
WHERE message_type IN ('audio', 'image', 'video', 'document')
GROUP BY message_type;
```

---

## 🌐 Testar Acesso aos Arquivos via HTTP

### 1. Verificar URL Pública

Após salvar uma mídia, o campo `media_url` no banco terá formato:
```
/storage/media/images/2025-11-28_abc12345.jpg
```

### 2. Acessar via Navegador

```
https://seu-dominio.com/api/media/images/2025-11-28_abc12345.jpg
```

**Resultado esperado:**
- Status: 200 OK
- Arquivo é exibido/baixado corretamente
- Headers corretos:
  - `Content-Type: image/jpeg`
  - `Cache-Control: public, max-age=31536000, immutable`

### 3. Testar com cURL

```bash
# Baixar imagem
curl -I https://seu-dominio.com/api/media/images/2025-11-28_abc12345.jpg

# Deve retornar:
# HTTP/1.1 200 OK
# Content-Type: image/jpeg
# Content-Length: 245760
# Cache-Control: public, max-age=31536000, immutable
```

---

## ✅ Checklist de Validação

- [ ] Mensagem de **texto** é salva corretamente
- [ ] **Imagem** é baixada e salva em `storage/media/images/`
- [ ] Campo `media_url` aponta para arquivo local (`/storage/media/...`)
- [ ] Arquivo de imagem é acessível via `/api/media/images/...`
- [ ] **Áudio** é baixado e salvo em `storage/media/audio/`
- [ ] Áudio é transcrito usando arquivo local (não URL do WhatsApp)
- [ ] Transcrição é salva no campo `message_content`
- [ ] **Vídeo** é baixado e salvo em `storage/media/videos/`
- [ ] **Documento** é baixado e salvo em `storage/media/documents/`
- [ ] Permissões dos arquivos estão corretas (legíveis pelo servidor)
- [ ] Logs mostram download e salvamento com sucesso
- [ ] Nenhum erro 404 ao acessar arquivos via HTTP

---

## 🐛 Troubleshooting

### Problema: "Erro ao baixar mídia"

**Verificar:**
```bash
# Permissões do diretório
ls -la /var/www/swiftbot/storage/

# Deve ser:
# drwxr-xr-x swiftbot swiftbot ... media/
```

**Corrigir:**
```bash
sudo chown -R swiftbot:swiftbot /var/www/swiftbot/storage
sudo chmod -R 755 /var/www/swiftbot/storage
```

### Problema: "File not found" ao acessar via HTTP

**Verificar:**
```bash
# O arquivo existe?
ls -la /var/www/swiftbot/storage/media/images/2025-11-28_abc12345.jpg

# Logs do PM2
pm2 logs swiftbot --err --lines 20
```

### Problema: Transcrição não funciona

**Verificar:**
```bash
# OpenAI API Key está configurada?
grep OPENAI_API_KEY /var/www/swiftbot/.env

# Logs mostram tentativa de transcrição?
pm2 logs swiftbot | grep "🎤"
```

### Problema: Espaço em disco cheio

**Verificar espaço:**
```bash
df -h /var/www/swiftbot/storage
```

**Limpar arquivos antigos (mais de 30 dias):**
```bash
find /var/www/swiftbot/storage/media -type f -mtime +30 -delete
```

---

## 📈 Monitoramento em Produção

### 1. Espaço em Disco

```bash
# Criar script de monitoramento
cat > /var/www/swiftbot/scripts/check_storage.sh << 'EOF'
#!/bin/bash
STORAGE_PATH="/var/www/swiftbot/storage/media"
THRESHOLD=80

USAGE=$(df -h $STORAGE_PATH | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
  echo "⚠️ ALERTA: Armazenamento em ${USAGE}%"
  du -sh $STORAGE_PATH/*
fi
EOF

chmod +x /var/www/swiftbot/scripts/check_storage.sh
```

### 2. Agendar Limpeza Automática (Cron)

```bash
# Adicionar ao crontab
crontab -e

# Limpar arquivos com mais de 60 dias, todo dia às 3h
0 3 * * * find /var/www/swiftbot/storage/media -type f -mtime +60 -delete

# Verificar espaço todo dia às 9h
0 9 * * * /var/www/swiftbot/scripts/check_storage.sh
```

---

## 📊 Métricas de Sucesso

Após testes, você deve ver:

1. **Logs sem erros** durante processamento de mídias
2. **Arquivos salvos** nos diretórios corretos
3. **Banco de dados** com `media_url` apontando para arquivos locais
4. **Transcrições** funcionando para áudios
5. **HTTP 200** ao acessar arquivos via `/api/media/...`
6. **Performance** rápida (download + salvamento < 2s para mídias < 5MB)

---

## 🎯 Próximos Passos (Opcional)

1. **Compressão de Imagens**: Reduzir tamanho com Sharp
2. **CDN**: Distribuir mídias via CloudFlare/AWS
3. **Backup**: Sincronizar `storage/media/` para S3
4. **Thumbnails**: Gerar previews para imagens/vídeos
5. **Quotas**: Limitar espaço por usuário

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `pm2 logs swiftbot --lines 100`
2. Verificar permissões: `ls -la /var/www/swiftbot/storage/`
3. Verificar espaço: `df -h`
4. Verificar processo: `pm2 status swiftbot`

---

**✅ Sistema pronto para testes em produção!**

Envie mensagens de teste e monitore os logs para confirmar que tudo está funcionando corretamente.
