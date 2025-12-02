#!/bin/bash

# ===========================================================================
# SCRIPT DE TESTE WEBHOOK UAZAPI V2
# ===========================================================================
# Testa todos os tipos de eventos e mensagens
# Uso: ./test-webhook.sh [URL_WEBHOOK] [AUTH_USER] [AUTH_PASS]
# ===========================================================================

# Configuração
WEBHOOK_URL="${1:-http://localhost:3000/api/webhooks/uazapi}"
AUTH_USER="${2:-webhook_user}"
AUTH_PASS="${3:-senha_forte_aqui}"
INSTANCE_NAME="test_instance_$(date +%s)"
PHONE_NUMBER="5511999999999"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer request
test_webhook() {
  local test_name="$1"
  local payload="$2"
  
  echo -e "${YELLOW}🧪 Testando: $test_name${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Basic $(echo -n "$AUTH_USER:$AUTH_PASS" | base64)" \
    -d "$payload")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK (200)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}❌ FALHOU ($http_code)${NC}"
    echo "$body"
  fi
  
  echo ""
  sleep 1
}

# ===========================================================================
# TESTE 1: Health Check
# ===========================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TESTE 1: Health Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

curl -s "$WEBHOOK_URL" | jq '.'

echo ""
sleep 1

# ===========================================================================
# TESTE 2: Mensagem de Texto (fromMe=false)
# ===========================================================================

test_webhook "Mensagem de Texto (Recebida)" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "TEXT_INBOUND_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Cliente Teste",
    "message": {
      "conversation": "Olá! Gostaria de saber mais sobre os produtos."
    }
  }
}'

# ===========================================================================
# TESTE 3: Mensagem de Texto (fromMe=true)
# ===========================================================================

test_webhook "Mensagem de Texto (Enviada)" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": true,
      "id": "TEXT_OUTBOUND_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "message": {
      "conversation": "Olá! Como posso ajudar?"
    }
  }
}'

# ===========================================================================
# TESTE 4: Mensagem com Texto Estendido
# ===========================================================================

test_webhook "Mensagem Extended Text" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "EXTENDED_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Cliente VIP",
    "message": {
      "extendedTextMessage": {
        "text": "Mensagem com formatação **negrito** e _itálico_"
      }
    }
  }
}'

# ===========================================================================
# TESTE 5: Imagem com Caption
# ===========================================================================

test_webhook "Mensagem de Imagem" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "IMAGE_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Fotógrafo",
    "message": {
      "imageMessage": {
        "url": "https://picsum.photos/800/600",
        "mimetype": "image/jpeg",
        "caption": "Veja esta foto incrível!"
      }
    }
  }
}'

# ===========================================================================
# TESTE 6: Áudio (com URL pública para teste)
# ===========================================================================

test_webhook "Mensagem de Áudio" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "AUDIO_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Cliente Falante",
    "message": {
      "audioMessage": {
        "url": "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
        "mimetype": "audio/ogg; codecs=opus",
        "seconds": 5
      }
    }
  }
}'

# ===========================================================================
# TESTE 7: Vídeo
# ===========================================================================

test_webhook "Mensagem de Vídeo" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "VIDEO_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Influencer",
    "message": {
      "videoMessage": {
        "url": "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4",
        "mimetype": "video/mp4",
        "caption": "Confira este vídeo!",
        "seconds": 30
      }
    }
  }
}'

# ===========================================================================
# TESTE 8: Documento PDF
# ===========================================================================

test_webhook "Mensagem de Documento" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "DOC_'$(date +%s)$(shuf -i 1000-9999 -n 1)'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Contador",
    "message": {
      "documentMessage": {
        "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "mimetype": "application/pdf",
        "fileName": "Contrato_Teste.pdf"
      }
    }
  }
}'

# ===========================================================================
# TESTE 9: CONNECTION_UPDATE (Conectado)
# ===========================================================================

test_webhook "Connection Update (Connected)" '{
  "event": "CONNECTION_UPDATE",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "state": "open",
    "ownerJid": "'$PHONE_NUMBER'@s.whatsapp.net"
  }
}'

# ===========================================================================
# TESTE 10: CONNECTION_UPDATE (Desconectado)
# ===========================================================================

test_webhook "Connection Update (Disconnected)" '{
  "event": "CONNECTION_UPDATE",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "state": "close"
  }
}'

# ===========================================================================
# TESTE 11: MESSAGES_UPDATE (Status)
# ===========================================================================

test_webhook "Messages Update (Status)" '{
  "event": "MESSAGES_UPDATE",
  "instance": "'$INSTANCE_NAME'",
  "data": [
    {
      "key": {
        "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
        "fromMe": true,
        "id": "STATUS_UPDATE_'$(date +%s)'"
      },
      "update": {
        "status": "read"
      }
    }
  ]
}'

# ===========================================================================
# TESTE 12: QRCODE_UPDATED
# ===========================================================================

test_webhook "QR Code Updated" '{
  "event": "QRCODE_UPDATED",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}'

# ===========================================================================
# TESTE 13: Mensagem Duplicada (Idempotência)
# ===========================================================================

DUPLICATE_ID="DUPLICATE_TEST_$(date +%s)"

test_webhook "Mensagem Original" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "'$DUPLICATE_ID'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Teste Duplicata",
    "message": {
      "conversation": "Primeira mensagem"
    }
  }
}'

test_webhook "Mensagem Duplicada (deve ignorar)" '{
  "event": "MESSAGES_UPSERT",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "key": {
      "remoteJid": "'$PHONE_NUMBER'@s.whatsapp.net",
      "fromMe": false,
      "id": "'$DUPLICATE_ID'"
    },
    "messageTimestamp": '$(date +%s)',
    "pushName": "Teste Duplicata",
    "message": {
      "conversation": "Mensagem duplicada (não deve salvar)"
    }
  }
}'

# ===========================================================================
# TESTE 14: Novo Formato UAZapi (messages)
# ===========================================================================

test_webhook "Novo Formato UAZapi" '{
  "event": "messages",
  "instanceName": "'$INSTANCE_NAME'",
  "message": {
    "id": "msg_'$(date +%s)'",
    "messageid": "NEW_FORMAT_'$(date +%s)$(shuf -i 1000-9999 -n 1)'",
    "chatid": "'$PHONE_NUMBER'@s.whatsapp.net",
    "fromMe": false,
    "senderName": "Novo Formato",
    "messageType": "TextMessage",
    "text": "Mensagem no novo formato UAZapi",
    "messageTimestamp": '$(date +%s)000',
    "content": {}
  }
}'

# ===========================================================================
# RESUMO
# ===========================================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ TESTES CONCLUÍDOS!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Verifique os logs do servidor:"
echo "   pm2 logs swiftbot --lines 200"
echo ""
echo "📊 Verifique o banco de dados:"
echo "   SELECT COUNT(*) FROM whatsapp_messages WHERE instance_name = '$INSTANCE_NAME';"
echo ""
echo "📁 Verifique arquivos de mídia salvos:"
echo "   ls -lh public/media/{audio,image,video,document}/"
echo ""
