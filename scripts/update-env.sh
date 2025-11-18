#!/bin/bash

# ============================================================================
# Script: Atualizar .env.local para UAZAPI
# ============================================================================
# Atualiza variáveis de ambiente de Evolution API para UAZAPI
#
# Uso: bash scripts/update-env.sh
# ============================================================================

set -e

echo "🔧 Atualizando .env.local para UAZAPI..."
echo ""

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local não encontrado"
    echo "   Criando a partir de .env.example..."
    cp .env.example .env.local
    echo "   ✅ .env.local criado"
    echo ""
fi

# Backup do arquivo original
cp .env.local .env.local.backup
echo "💾 Backup criado: .env.local.backup"
echo ""

# ============================================================================
# ATUALIZAR VARIÁVEIS
# ============================================================================

echo "📝 Atualizando variáveis de ambiente..."

# Comentar variáveis antigas
sed -i.tmp 's/^EVOLUTION_API_URL=/#EVOLUTION_API_URL=/g' .env.local
sed -i.tmp 's/^EVOLUTION_API_KEY=/#EVOLUTION_API_KEY=/g' .env.local
sed -i.tmp 's/^N8N_WEBHOOK_URL=/#N8N_WEBHOOK_URL=/g' .env.local

# Adicionar novas variáveis se não existirem
if ! grep -q "UAZAPI_BASE_URL" .env.local; then
    echo "" >> .env.local
    echo "# ============================================================================" >> .env.local
    echo "# UAZAPI (WhatsApp Integration)" >> .env.local
    echo "# ============================================================================" >> .env.local
    echo "UAZAPI_BASE_URL=https://swiftbot.uazapi.com" >> .env.local
    echo "UAZAPI_ADMIN_TOKEN=YCXL1ENXtPvVQgB7NVsMskSX7oxYUMHRtXlOvh8mdBdyX1WFZ3" >> .env.local
    echo "UAZAPI_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/uazapi" >> .env.local
    echo ""
    echo "✅ Variáveis UAZAPI adicionadas"
else
    echo "ℹ️  Variáveis UAZAPI já existem"
fi

# Remover arquivo temporário
rm -f .env.local.tmp

echo ""
echo "✅ Atualização concluída!"
echo ""

# ============================================================================
# MOSTRAR DIFF
# ============================================================================

echo "📊 Mudanças realizadas:"
echo ""
echo "--- .env.local.backup (ANTES)"
echo "+++ .env.local (DEPOIS)"
echo ""
diff .env.local.backup .env.local || true

echo ""
echo "💡 Dica: Se algo deu errado, restaure o backup:"
echo "   cp .env.local.backup .env.local"
echo ""
