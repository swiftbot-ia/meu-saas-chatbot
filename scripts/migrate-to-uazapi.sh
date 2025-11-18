#!/bin/bash

# ============================================================================
# Script de Migração: Evolution API → UAZAPI
# ============================================================================
# Este script renomeia arquivos e atualiza referências de Evolution para UAZAPI
#
# Uso: bash scripts/migrate-to-uazapi.sh
# ============================================================================

set -e  # Parar em caso de erro

echo "🔄 Iniciando migração Evolution API → UAZAPI..."
echo ""

# ============================================================================
# 1. RENOMEAR WEBHOOK HANDLER
# ============================================================================
echo "📁 1. Renomeando webhook handler..."

if [ -d "app/api/webhooks/evolution" ]; then
    echo "   Renomeando: app/api/webhooks/evolution → app/api/webhooks/uazapi"
    git mv app/api/webhooks/evolution app/api/webhooks/uazapi
    echo "   ✅ Webhook handler renomeado"
else
    echo "   ⚠️  Webhook handler já foi renomeado ou não existe"
fi

echo ""

# ============================================================================
# 2. RENOMEAR ARQUIVOS DE TESTE
# ============================================================================
echo "📁 2. Renomeando arquivos de teste..."

if [ -f "app/api/test-evolution/route.js" ]; then
    echo "   Renomeando: app/api/test-evolution → app/api/test-uazapi"
    git mv app/api/test-evolution app/api/test-uazapi 2>/dev/null || mkdir -p app/api/test-uazapi && mv app/api/test-evolution/route.js app/api/test-uazapi/route.js && rmdir app/api/test-evolution
    echo "   ✅ Arquivo de teste renomeado"
else
    echo "   ℹ️  Arquivo de teste não existe"
fi

echo ""

# ============================================================================
# 3. ATUALIZAR REFERÊNCIAS EM COMENTÁRIOS E DOCUMENTAÇÃO
# ============================================================================
echo "📝 3. Atualizando referências em comentários..."

# Atualizar webhook handler
if [ -f "app/api/webhooks/uazapi/route.js" ]; then
    echo "   Atualizando comentários em webhook handler..."
    sed -i.bak 's/Evolution API/UAZAPI/g' app/api/webhooks/uazapi/route.js
    sed -i.bak 's/evolution API/UAZAPI/g' app/api/webhooks/uazapi/route.js
    sed -i.bak 's/EVOLUTION API/UAZAPI/g' app/api/webhooks/uazapi/route.js
    rm -f app/api/webhooks/uazapi/route.js.bak
    echo "   ✅ Webhook handler atualizado"
fi

# Atualizar schema SQL
if [ -f "database/schema-whatsapp.sql" ]; then
    echo "   Atualizando comentários em schema SQL..."
    sed -i.bak 's/Evolution\/UAZAPI/UAZAPI/g' database/schema-whatsapp.sql
    sed -i.bak 's/Evolution API/UAZAPI/g' database/schema-whatsapp.sql
    sed -i.bak 's/via Evolution API/via UAZAPI/g' database/schema-whatsapp.sql
    rm -f database/schema-whatsapp.sql.bak
    echo "   ✅ Schema SQL atualizado"
fi

echo ""

# ============================================================================
# 4. CRIAR ARQUIVO DE DEPRECIAÇÃO PARA ROTAS ANTIGAS
# ============================================================================
echo "📄 4. Criando avisos de depreciação..."

cat > app/api/whatsapp/DEPRECATED.md << 'EOF'
# ⚠️ ROTAS DEPRECADAS

As rotas neste diretório (`/api/whatsapp/*`) estão **DEPRECADAS** e não devem ser usadas.

## 🔄 Migração

Todas as funcionalidades foram migradas para:

### **Nova API (RECOMENDADA):**
- `POST /api/whatsapp/instance/manage` - Criar e conectar instância
- `GET /api/whatsapp/instance/manage?userId=xxx` - Verificar status
- `DELETE /api/whatsapp/instance/manage?connectionId=xxx` - Desconectar

### **Webhook:**
- Antigo: `/api/webhooks/evolution` ❌
- Novo: `/api/webhooks/uazapi` ✅

## 📚 Documentação

Ver: `docs/UAZAPI-MIGRATION-GUIDE.md`

## ⚠️ Estas rotas antigas usam Evolution API e podem não funcionar:

- `/api/whatsapp/connect`
- `/api/whatsapp/disconnect`
- `/api/whatsapp/generate-qr`
- `/api/whatsapp/status`
- `/api/whatsapp/set-webhook`
- `/api/whatsapp/delete-instance`
- `/api/whatsapp/save-phone`

**Recomendação:** Migre para `/api/whatsapp/instance/manage`
EOF

echo "   ✅ Arquivo DEPRECATED.md criado em app/api/whatsapp/"

echo ""

# ============================================================================
# 5. VERIFICAR VARIÁVEIS DE AMBIENTE
# ============================================================================
echo "🔍 5. Verificando variáveis de ambiente..."

if [ -f ".env.local" ]; then
    if grep -q "EVOLUTION_API_URL" .env.local; then
        echo "   ⚠️  ATENÇÃO: .env.local ainda contém variáveis Evolution API antigas!"
        echo "   "
        echo "   Remova ou comente estas linhas:"
        echo "   - EVOLUTION_API_URL"
        echo "   - EVOLUTION_API_KEY"
        echo "   - N8N_WEBHOOK_URL"
        echo "   "
        echo "   E adicione:"
        echo "   - UAZAPI_BASE_URL=https://swiftbot.uazapi.com"
        echo "   - UAZAPI_ADMIN_TOKEN=YCXL1ENXtPvVQgB7NVsMskSX7oxYUMHRtXlOvh8mdBdyX1WFZ3"
        echo "   - UAZAPI_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/uazapi"
    else
        echo "   ✅ .env.local está atualizado"
    fi
else
    echo "   ℹ️  .env.local não existe (crie com: cp .env.example .env.local)"
fi

echo ""

# ============================================================================
# 6. RESUMO DE ARQUIVOS MODIFICADOS
# ============================================================================
echo "📊 6. Resumo de arquivos modificados:"
echo ""

if git status --short | grep -q .; then
    git status --short
else
    echo "   Nenhuma modificação detectada"
fi

echo ""

# ============================================================================
# 7. PRÓXIMOS PASSOS
# ============================================================================
echo "✅ Migração concluída!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Revisar mudanças:"
echo "   git status"
echo "   git diff"
echo ""
echo "2. Commit das alterações:"
echo "   git add ."
echo "   git commit -m \"refactor: Renomear webhooks e rotas de Evolution para UAZAPI\""
echo ""
echo "3. Atualizar .env.local (se necessário):"
echo "   - Remover: EVOLUTION_API_URL, EVOLUTION_API_KEY, N8N_WEBHOOK_URL"
echo "   - Adicionar: UAZAPI_BASE_URL, UAZAPI_ADMIN_TOKEN, UAZAPI_WEBHOOK_URL"
echo ""
echo "4. Testar aplicação:"
echo "   npm run dev"
echo ""
echo "5. Ver documentação completa:"
echo "   cat docs/UAZAPI-MIGRATION-GUIDE.md"
echo ""

echo "🎉 Script finalizado!"
