# 🚀 Guia Rápido - Comandos VPS SwiftBot

## 📍 Diretório do Projeto
```bash
cd /home/user/meu-saas-chatbot
```

## 🔧 Gerenciamento PM2

### Ver Status
```bash
pm2 status
pm2 list
```

### Logs em Tempo Real
```bash
# Ver todos os logs
pm2 logs swiftbot

# Últimas 50 linhas
pm2 logs swiftbot --lines 50

# Apenas erros
pm2 logs swiftbot --err

# Parar de seguir (Ctrl+C)
```

### Reiniciar Aplicação
```bash
pm2 restart swiftbot
```

### Parar/Iniciar
```bash
pm2 stop swiftbot
pm2 start swiftbot
```

### Monitoramento
```bash
pm2 monit
```

## 📦 Deploy de Atualizações

### Opção 1: Script Automatizado (Recomendado)
```bash
cd /home/user/meu-saas-chatbot
./deploy-vps.sh
```

### Opção 2: Manual
```bash
cd /home/user/meu-saas-chatbot

# 1. Pull das mudanças
git pull origin claude/add-uazapi-webhook-01JRD3P9pgwjqTHM25LGKyPZ

# 2. Instalar dependências (se necessário)
npm install

# 3. Build
npm run build

# 4. Reiniciar
pm2 restart swiftbot
```

## 📁 Verificar Storage de Mídias

### Listar Arquivos
```bash
# Ver todos os tipos
ls -lh storage/media/*/

# Apenas áudios
ls -lh storage/media/audio/

# Últimos 10 arquivos
find storage/media -type f -printf '%T+ %p\n' | sort -r | head -10
```

### Verificar Espaço
```bash
# Por tipo
du -sh storage/media/*/

# Total
du -sh storage/media/
```

### Limpar Arquivos Antigos (mais de 60 dias)
```bash
find storage/media -type f -mtime +60 -delete
```

## 🧪 Testar Sistema

### 1. Enviar Mensagem de Teste no WhatsApp
- Texto: "Olá teste"
- Imagem: Enviar qualquer foto
- Áudio: Gravar mensagem de voz
- Vídeo: Enviar vídeo curto
- Documento: Enviar PDF

### 2. Monitorar Logs
```bash
pm2 logs swiftbot --lines 100
```

### 3. Logs Esperados

**Texto:**
```
✅ Mensagem salva: uuid-... (tipo: text)
```

**Imagem:**
```
📥 Baixando image: https://mmg.whatsapp.net/...
✅ Mídia salva: images/2025-11-28_abc123.jpg (245 KB)
✅ Mensagem salva: uuid-... (tipo: image)
```

**Áudio com Transcrição:**
```
📥 Baixando audio: https://mmg.whatsapp.net/...
✅ Mídia salva: audio/2025-11-28_def456.ogg (42 KB)
✅ Mensagem salva: uuid-... (tipo: audio)
🎤 Áudio detectado, iniciando transcrição...
✅ Áudio já está salvo localmente: /home/user/meu-saas-chatbot/storage/media/audio/...
🎤 Transcrevendo áudio...
✅ Transcrição concluída: "olá este é um teste..."
✅ Transcrição salva com sucesso: uuid-...
```

## 🐛 Troubleshooting

### Aplicação Não Inicia
```bash
# Ver logs de erro
pm2 logs swiftbot --err --lines 50

# Verificar se build existe
ls -la .next/

# Refazer build
npm run build
pm2 restart swiftbot
```

### Webhook Não Recebe Mensagens
```bash
# Verificar se aplicação está online
pm2 status

# Verificar porta 3000
netstat -tlnp | grep 3000

# Ver logs de webhook
pm2 logs swiftbot | grep "Webhook"
```

### Mídias Não Estão Sendo Salvas
```bash
# Verificar permissões
ls -la storage/media/

# Corrigir permissões se necessário
chmod -R 755 storage/

# Ver logs de download
pm2 logs swiftbot | grep "Baixando"
```

### Transcrição Não Funciona
```bash
# Verificar OpenAI API Key
cat .env.local | grep OPENAI

# Ver logs de transcrição
pm2 logs swiftbot | grep "🎤"
```

## 🔄 Atualizar do Git

```bash
cd /home/user/meu-saas-chatbot

# Ver branch atual
git branch

# Ver mudanças remotas
git fetch origin

# Atualizar
git pull origin claude/add-uazapi-webhook-01JRD3P9pgwjqTHM25LGKyPZ

# Build e restart
npm run build && pm2 restart swiftbot
```

## 📊 Comandos Úteis

### Verificar Versão Node
```bash
node --version
npm --version
pm2 --version
```

### Limpar Cache PM2
```bash
pm2 flush  # Limpar logs
pm2 reset swiftbot  # Reset contadores
```

### Backup de Mídias
```bash
# Criar backup
tar -czf media-backup-$(date +%Y%m%d).tar.gz storage/media/

# Listar backups
ls -lh media-backup-*.tar.gz
```

### Monitorar Recursos
```bash
# CPU e Memória
pm2 monit

# Uso de disco
df -h

# Processos Node
ps aux | grep node
```

## 🌐 URLs Importantes

- **Aplicação:** http://21.0.0.128:3000
- **Webhook:** http://21.0.0.128:3000/api/webhooks/uazapi
- **Mídias:** http://21.0.0.128:3000/api/media/{tipo}/{arquivo}

## 📝 Notas Importantes

1. **Sempre use `/home/user/meu-saas-chatbot`** como diretório de trabalho
2. **PM2 está configurado para auto-start** após reinicialização do servidor
3. **Logs são salvos em** `/root/.pm2/logs/`
4. **Mídias são salvas em** `storage/media/{audio,images,videos,documents}/`
5. **Arquivo .env.local** contém configurações de build (use .env para produção)

## 🆘 Comandos de Emergência

### Reiniciar Tudo
```bash
pm2 stop all
pm2 delete all
pm2 start npm --name "swiftbot" -- start
pm2 save
```

### Verificar Saúde
```bash
pm2 status && \
pm2 logs swiftbot --lines 5 --nostream && \
curl -I http://localhost:3000
```

---

**📖 Documentação Completa:**
- Guia de Webhook: `WEBHOOK_UAZAPI_GUIDE.md`
- Guia de Testes: `MEDIA_STORAGE_TEST_GUIDE.md`
