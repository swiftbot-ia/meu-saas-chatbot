# 🔧 Scripts de Migração UAZAPI

Scripts para migrar completamente de Evolution API para UAZAPI.

## 📋 Scripts Disponíveis

### 1. `migrate-to-uazapi.sh`

**Migração completa de arquivos e referências**

**O que faz:**
- ✅ Renomeia `app/api/webhooks/evolution` → `app/api/webhooks/uazapi`
- ✅ Renomeia `app/api/test-evolution` → `app/api/test-uazapi`
- ✅ Atualiza comentários em arquivos (Evolution → UAZAPI)
- ✅ Cria arquivo `DEPRECATED.md` nas rotas antigas
- ✅ Verifica variáveis de ambiente

**Uso:**
```bash
bash scripts/migrate-to-uazapi.sh
```

**Após executar:**
```bash
# Revisar mudanças
git status
git diff

# Commit
git add .
git commit -m "refactor: Renomear webhooks e rotas de Evolution para UAZAPI"
```

---

### 2. `update-env.sh`

**Atualiza automaticamente o .env.local**

**O que faz:**
- ✅ Comenta variáveis antigas (EVOLUTION_API_URL, EVOLUTION_API_KEY, N8N_WEBHOOK_URL)
- ✅ Adiciona variáveis UAZAPI (UAZAPI_BASE_URL, UAZAPI_ADMIN_TOKEN, UAZAPI_WEBHOOK_URL)
- ✅ Cria backup (.env.local.backup)

**Uso:**
```bash
bash scripts/update-env.sh
```

**Restaurar backup (se necessário):**
```bash
cp .env.local.backup .env.local
```

---

## 🚀 Ordem de Execução Recomendada

### Passo 1: Migrar Arquivos
```bash
# Executar migração de arquivos
bash scripts/migrate-to-uazapi.sh

# Revisar mudanças
git status
git diff
```

### Passo 2: Atualizar Variáveis de Ambiente
```bash
# Atualizar .env.local
bash scripts/update-env.sh

# Verificar .env.local
cat .env.local | grep -A 3 "UAZAPI"
```

### Passo 3: Commit das Alterações
```bash
git add .
git commit -m "refactor: Renomear webhooks de Evolution para UAZAPI

- Renomeado app/api/webhooks/evolution → app/api/webhooks/uazapi
- Atualizado comentários e referências
- Criado arquivo DEPRECATED.md para rotas antigas
- Atualizado .env.local com variáveis UAZAPI"

git push
```

### Passo 4: Reiniciar Servidor
```bash
# Parar servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## 📁 Arquivos que Serão Modificados

### Renomeados:
- `app/api/webhooks/evolution/` → `app/api/webhooks/uazapi/`
- `app/api/test-evolution/` → `app/api/test-uazapi/` (se existir)

### Atualizados (comentários):
- `app/api/webhooks/uazapi/route.js`
- `database/schema-whatsapp.sql`

### Criados:
- `app/api/whatsapp/DEPRECATED.md`
- `.env.local.backup`

### Modificados (se existir):
- `.env.local`

---

## ⚠️ Importante

### Antes de Executar:
1. **Commit todas as mudanças pendentes:**
   ```bash
   git add .
   git commit -m "wip: antes da migração UAZAPI"
   ```

2. **Certifique-se de estar no branch correto:**
   ```bash
   git branch
   # Deve mostrar: claude/setup-local-chatbot-dev-01Hegb16DmJuYsUWCm16JMHM
   ```

### Após Executar:
1. **Revisar mudanças cuidadosamente:**
   ```bash
   git diff
   ```

2. **Testar aplicação:**
   ```bash
   npm run dev
   ```

3. **Verificar webhook:**
   ```bash
   curl http://localhost:3000/api/webhooks/uazapi
   # Deve retornar: {"status":"online","message":"UAZAPI Webhook is running",...}
   ```

---

## 🔄 Rollback (Reverter)

Se algo der errado:

### Reverter Arquivos Git:
```bash
git reset --hard HEAD
```

### Restaurar .env.local:
```bash
cp .env.local.backup .env.local
```

---

## 📚 Documentação Adicional

- **Guia Completo:** `docs/UAZAPI-MIGRATION-GUIDE.md`
- **Quick Start:** `docs/QUICKSTART-WHATSAPP.md`
- **Schema SQL:** `database/schema-whatsapp.sql`

---

## 🐛 Troubleshooting

### Erro: "Permission denied"
```bash
chmod +x scripts/migrate-to-uazapi.sh
chmod +x scripts/update-env.sh
```

### Erro: "git mv: bad source"
Arquivo já foi renomeado. Pule esse passo ou execute:
```bash
git status
```

### Variáveis não estão sendo carregadas
```bash
# Reiniciar servidor
npm run dev

# Verificar se .env.local existe
cat .env.local | grep UAZAPI
```

---

**✅ Scripts Criados e Prontos para Uso!**
