// app/api/dashboard/stats/route.js
import { supabase } from '../../../../lib/supabase'

const EVOLUTION_API_URL = 'https://evolution.swiftbot.com.br'
const GLOBAL_API_KEY = 'b4b6f08781bfddc7ce1192691264f97a'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return Response.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // 1. Buscar dados da conexão WhatsApp do usuário
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      return Response.json({
        success: true,
        stats: {
          mensagensHoje: 0,
          conversasAtivas: 0,
          taxaResposta: 0,
          clientesAtendidos: 0
        },
        connected: false
      })
    }

    const instanceName = connection.waba_id
    const apiKey = connection.api_credentials

    if (!instanceName || !apiKey) {
      return Response.json({
        success: true,
        stats: {
          mensagensHoje: 0,
          conversasAtivas: 0,
          taxaResposta: 0,
          clientesAtendidos: 0
        },
        connected: false
      })
    }

    // 2. Verificar se a instância está conectada
    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey // Usar API Key da instância
      }
    })

    const statusData = await statusResponse.json()
    console.log('Status da instância:', statusData)
    
    if (!statusResponse.ok || statusData.instance?.state !== 'open') {
      console.log('Instância não conectada:', statusData)
      return Response.json({
        success: true,
        stats: {
          mensagensHoje: 0,
          conversasAtivas: 0,
          taxaResposta: 0,
          clientesAtendidos: 0
        },
        connected: false
      })
    }

    // 3. Buscar estatísticas da Evolution API
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    console.log('Buscando mensagens de:', todayStart, 'até:', todayEnd)

    // Buscar mensagens recentes - ABORDAGEM SIMPLIFICADA
    const messagesResponse = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        limit: 50 // Buscar apenas as 50 mensagens mais recentes
      })
    })

    console.log('Status response mensagens:', messagesResponse.status)

    let mensagensHoje = 0
    let conversasAtivas = 0
    let clientesAtendidos = 0
    let taxaResposta = 0

    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json()
      console.log('Resposta mensagens:', messagesData)
      
      // A API retorna: { messages: { records: [...], total: X } }
      const messages = messagesData?.messages?.records || []
      
      console.log(`Encontradas ${messages.length} mensagens de ${messagesData?.messages?.total || 0} total`)

      // Filtrar apenas mensagens do dia atual
      const messagesFromToday = messages.filter(message => {
        if (message.messageTimestamp) {
          const messageDate = new Date(message.messageTimestamp * 1000)
          return messageDate >= todayStart && messageDate < todayEnd
        }
        return false
      })

      console.log(`Total mensagens: ${messages.length}, Mensagens hoje: ${messagesFromToday.length}`)

      // Contar mensagens do dia
      mensagensHoje = messagesFromToday.length

      // Contar conversas ativas (chats únicos)
      const uniqueChats = new Set()
      const uniqueContacts = new Set()
      let botResponses = 0
      let userMessages = 0

      messagesFromToday.forEach(message => {
        console.log('Processando mensagem:', { 
          remoteJid: message.key?.remoteJid, 
          fromMe: message.key?.fromMe,
          timestamp: message.messageTimestamp 
        })
        
        if (message.key?.remoteJid) {
          // ✅ FILTRAR GRUPOS - Só contar conversas individuais
          const isGroup = message.key.remoteJid.includes('@g.us')
          
          if (!isGroup) { // Apenas conversas individuais (não grupos)
            uniqueChats.add(message.key.remoteJid)
            
            // Se não for mensagem do próprio bot
            if (!message.key.fromMe) {
              uniqueContacts.add(message.key.remoteJid)
              userMessages++
            } else {
              botResponses++
            }
          }
        }
      })

      conversasAtivas = uniqueChats.size
      clientesAtendidos = uniqueContacts.size

      console.log('Estatísticas calculadas:', {
        mensagensHoje: `${mensagensHoje} (somente conversas individuais)`,
        conversasAtivas,
        clientesAtendidos,
        userMessages,
        botResponses,
        gruposExcluidos: 'SIM'
      })

      // Calcular taxa de resposta (bot responses / user messages)
      if (userMessages > 0) {
        taxaResposta = Math.round((botResponses / userMessages) * 100)
      }
    } else {
      console.log('Erro ao buscar mensagens:', messagesResponse.status, await messagesResponse.text())
    }

    // Buscar chats ativos das últimas 24h se não conseguiu pelas mensagens
    if (conversasAtivas === 0) {
      try {
        const chatsResponse = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
          },
          body: JSON.stringify({
            limit: 20 // Buscar 20 chats mais recentes
          })
        })

        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          console.log('Chats encontrados:', chatsData?.length || 0)
          conversasAtivas = chatsData?.length || 0
          if (clientesAtendidos === 0) {
            clientesAtendidos = conversasAtivas
          }
        } else {
          console.log('Erro ao buscar chats:', chatsResponse.status)
        }
      } catch (error) {
        console.log('Erro ao buscar chats:', error)
      }
    }

    console.log('Estatísticas finais:', {
      mensagensHoje,
      conversasAtivas,
      taxaResposta,
      clientesAtendidos
    })

    return Response.json({
      success: true,
      stats: {
        mensagensHoje,
        conversasAtivas,
        taxaResposta,
        clientesAtendidos
      },
      connected: true
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return Response.json({
      success: true,
      stats: {
        mensagensHoje: 0,
        conversasAtivas: 0,
        taxaResposta: 0,
        clientesAtendidos: 0
      },
      connected: false,
      error: error.message
    }, { status: 200 }) // 200 para não quebrar o frontend
  }
}