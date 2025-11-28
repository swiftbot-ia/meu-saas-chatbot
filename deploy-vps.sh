#!/bin/bash

# ============================================================================
# Script de Deploy - SwiftBot VPS
# ============================================================================
# Atualiza código, cria estrutura de storage e reinicia aplicação
# ============================================================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do SwiftBot..."
echo ""

# 1. Pull das últimas mudanças
echo "📥 1. Fazendo pull do repositório..."
git fetch origin
git pull origin claude/add-uazapi-webhook-01JRD3P9pgwjqTHM25LGKyPZ
echo "✅ Pull completo!"
echo ""

# 2. Verificar/instalar dependências
echo "📦 2. Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "   Instalando dependências..."
  npm install
else
  echo "   Dependências já instaladas"
fi
echo "✅ Dependências ok!"
echo ""

# 3. Criar estrutura de diretórios de storage
echo "📁 3. Criando estrutura de storage..."
mkdir -p storage/media/audio
mkdir -p storage/media/images
mkdir -p storage/media/videos
mkdir -p storage/media/documents

# Verificar se foi criado
if [ -d "storage/media" ]; then
  echo "✅ Diretórios criados:"
  ls -la storage/media/
else
  echo "❌ Erro ao criar diretórios"
  exit 1
fi
echo ""

# 4. Ajustar permissões
echo "🔐 4. Ajustando permissões..."
chmod -R 755 storage
echo "✅ Permissões ajustadas!"
echo ""

# 5. Build da aplicação
echo "🔨 5. Fazendo build..."
npm run build
echo "✅ Build completo!"
echo ""

# 6. Verificar se PM2 está instalado
echo "🔍 6. Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
  echo "⚠️  PM2 não encontrado, instalando..."
  npm install -g pm2
fi
echo "✅ PM2 ok!"
echo ""

# 7. Reiniciar aplicação
echo "♻️  7. Reiniciando aplicação..."
if pm2 list | grep -q "swiftbot"; then
  echo "   Reiniciando processo existente..."
  pm2 restart swiftbot
else
  echo "   Iniciando novo processo..."
  pm2 start npm --name "swiftbot" -- start
fi
echo "✅ Aplicação reiniciada!"
echo ""

# 8. Verificar status
echo "📊 8. Status da aplicação:"
pm2 list
echo ""

# 9. Mostrar logs recentes
echo "📝 9. Logs recentes:"
pm2 logs swiftbot --lines 20 --nostream
echo ""

echo "✅ Deploy concluído com sucesso! 🎉"
echo ""
echo "📋 Próximos passos:"
echo "   1. Monitorar logs: pm2 logs swiftbot --lines 50"
echo "   2. Enviar mensagem de teste no WhatsApp"
echo "   3. Verificar storage: ls -lh storage/media/*/"
echo ""
