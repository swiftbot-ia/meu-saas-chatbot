#!/usr/bin/env node
/**
 * Script de Teste: Webhook UAZAPI
 * Simula payloads para testar o processamento de mensagens
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/uazapi'

// Payloads de teste
const payloads = {
  // 1. Mensagem de texto simples
  textMessage: {
    event: 'MESSAGES_UPSERT',
    instance: 'test_instance_123',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'msg_text_' + Date.now()
      },
      message: {
        conversation: 'Olá! Esta é uma mensagem de teste.'
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste User'
    }
  },

  // 2. Mensagem com imagem
  imageMessage: {
    event: 'MESSAGES_UPSERT',
    instance: 'test_instance_123',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'msg_image_' + Date.now()
      },
      message: {
        imageMessage: {
          url: 'https://example.com/image.jpg',
          caption: 'Olha essa imagem legal!',
          mimetype: 'image/jpeg'
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste User'
    }
  },

  // 3. Mensagem com áudio
  audioMessage: {
    event: 'MESSAGES_UPSERT',
    instance: 'test_instance_123',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'msg_audio_' + Date.now()
      },
      message: {
        audioMessage: {
          url: 'https://example.com/audio.ogg',
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true, // Push to talk (áudio de voz)
          seconds: 5
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste User'
    }
  },

  // 4. Mensagem com documento
  documentMessage: {
    event: 'MESSAGES_UPSERT',
    instance: 'test_instance_123',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'msg_doc_' + Date.now()
      },
      message: {
        documentMessage: {
          url: 'https://example.com/document.pdf',
          mimetype: 'application/pdf',
          fileName: 'documento_importante.pdf'
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste User'
    }
  },

  // 5. Mensagem com vídeo
  videoMessage: {
    event: 'MESSAGES_UPSERT',
    instance: 'test_instance_123',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'msg_video_' + Date.now()
      },
      message: {
        videoMessage: {
          url: 'https://example.com/video.mp4',
          caption: 'Veja este vídeo!',
          mimetype: 'video/mp4'
        }
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Teste User'
    }
  },

  // 6. Atualização de conexão
  connectionUpdate: {
    event: 'CONNECTION_UPDATE',
    instance: 'test_instance_123',
    data: {
      state: 'open',
      ownerJid: '5511988888888@s.whatsapp.net'
    }
  }
}

async function testWebhook(payloadName) {
  const payload = payloads[payloadName]

  if (!payload) {
    console.error(`❌ Payload "${payloadName}" não encontrado!`)
    console.log('Payloads disponíveis:', Object.keys(payloads).join(', '))
    return
  }

  console.log(`\n🧪 Testando: ${payloadName}`)
  console.log('📤 Enviando para:', WEBHOOK_URL)
  console.log('📦 Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Sucesso:', data)
    } else {
      console.error('❌ Erro:', response.status, data)
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }
}

async function testAll() {
  console.log('🚀 Iniciando testes de webhook...\n')

  for (const payloadName of Object.keys(payloads)) {
    await testWebhook(payloadName)
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1s entre testes
  }

  console.log('\n✅ Testes concluídos!')
}

// Executar
const command = process.argv[2]

if (command === 'all') {
  testAll()
} else if (command && payloads[command]) {
  testWebhook(command)
} else {
  console.log('Uso:')
  console.log('  node test-webhook-payload.js all              # Testa todos os payloads')
  console.log('  node test-webhook-payload.js textMessage      # Testa mensagem de texto')
  console.log('  node test-webhook-payload.js imageMessage     # Testa mensagem com imagem')
  console.log('  node test-webhook-payload.js audioMessage     # Testa mensagem com áudio')
  console.log('  node test-webhook-payload.js documentMessage  # Testa mensagem com documento')
  console.log('  node test-webhook-payload.js videoMessage     # Testa mensagem com vídeo')
  console.log('  node test-webhook-payload.js connectionUpdate # Testa atualização de conexão')
  console.log('\nPayloads disponíveis:', Object.keys(payloads).join(', '))
}
