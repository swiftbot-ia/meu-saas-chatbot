#!/bin/bash
# Script para verificar arquivos de áudio no servidor VPS

echo "=== Verificando arquivos de áudio ==="
echo ""

echo "1. Listando arquivos de áudio:"
ls -lh /var/www/swiftbot/public/media/audio/ | tail -10

echo ""
echo "2. Verificando permissões da pasta media:"
ls -ld /var/www/swiftbot/public/media/

echo ""
echo "3. Verificando permissões da pasta audio:"
ls -ld /var/www/swiftbot/public/media/audio/

echo ""
echo "4. Contando arquivos de áudio:"
find /var/www/swiftbot/public/media/audio/ -name "*.ogg" | wc -l

echo ""
echo "5. Último arquivo criado:"
ls -lht /var/www/swiftbot/public/media/audio/ | head -5

echo ""
echo "6. Testando acesso web (via curl):"
LAST_FILE=$(ls -t /var/www/swiftbot/public/media/audio/*.ogg 2>/dev/null | head -1)
if [ -n "$LAST_FILE" ]; then
  FILENAME=$(basename "$LAST_FILE")
  echo "Testando: https://swiftbot.com.br/media/audio/$FILENAME"
  curl -I "https://swiftbot.com.br/media/audio/$FILENAME" 2>&1 | head -5
fi
