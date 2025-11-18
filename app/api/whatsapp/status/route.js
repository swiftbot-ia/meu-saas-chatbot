import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

const EVOLUTION_API_URL = process.env.UAZAPI_BASE_URL || process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.UAZAPI_ADMIN_TOKEN || process.env.EVOLUTION_API_KEY

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    const instanceName = `swiftbot_${userId.replace(/-/g, '_')}`

    // Verificar status da instância
    const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    if (!statusResponse.ok) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        message: 'Instância não encontrada'
      })
    }

    const statusData = await statusResponse.json()
    const isConnected = statusData.instance?.state === 'open'

    // Se conectado, buscar informações do WhatsApp
    if (isConnected) {
      try {
        // Buscar informações da instância para pegar o número
        const infoResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        })

        if (infoResponse.ok) {
          const instances = await infoResponse.json()
          console.log('Todas as instâncias:', JSON.stringify(instances, null, 2))
          console.log('Procurando por:', instanceName)
          
          const instance = instances.find(i => i.name === instanceName) // CAMPO CORRETO: 'name'
          console.log('Instância encontrada:', instance)
          
          if (instance && instance.ownerJid) { // CAMPO CORRETO: 'ownerJid'
            // Limpar o número (remover @s.whatsapp.net se existir)
            const cleanNumber = instance.ownerJid.replace('@s.whatsapp.net', '')
            console.log('Número limpo:', cleanNumber)
            
            // Salvar/atualizar o número no Supabase
            console.log('Tentando salvar para user_id:', userId)
            
            const { data, error: updateError } = await supabase
              .from('whatsapp_connections')
              .insert({
                user_id: userId,
                phone_number_id: cleanNumber,
                status: 'connected',
                is_connected: true,
                updated_at: new Date().toISOString()
              })

            if (updateError) {
              console.error('Erro ao salvar número:', updateError)
              
              // Tentar sem a constraint
              console.log('Tentando inserir direto via SQL...')
              const { data: sqlData, error: sqlError } = await supabase
                .rpc('insert_whatsapp_connection', {
                  p_user_id: userId,
                  p_phone_number_id: cleanNumber,
                  p_status: 'connected'
                })
              
              if (sqlError) {
                console.error('Erro no SQL também:', sqlError)
              } else {
                console.log('Sucesso via SQL!')
              }
            } else {
              console.log('Número salvo com sucesso:', cleanNumber)
            }
          } else {
            console.log('OwnerJid não encontrado na instância')
            console.log('Dados da instância:', instance)
          }
        } else {
          console.log('Erro ao buscar instâncias:', infoResponse.status)
        }
      } catch (error) {
        console.log('Erro ao buscar info da instância:', error)
      }
    }

    return NextResponse.json({
      connected: isConnected,
      status: statusData.instance?.state || 'disconnected',
      instanceName,
      message: 'Status verificado com sucesso'
    })

  } catch (error) {
    console.error('Erro na API status:', error)
    return NextResponse.json({
      connected: false,
      status: 'error',
      message: 'Erro ao verificar status'
    })
  }
}