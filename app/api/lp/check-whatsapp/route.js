import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client para buscar token da instância
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ID da conexão para validação de WhatsApp
const VALIDATION_CONNECTION_ID = 'b20764e7-88f1-4fe2-8394-d7deec94ad8c'

/**
 * POST /api/lp/check-whatsapp
 * Valida se um número de WhatsApp é real via UAZAPI
 */
export async function POST(request) {
    try {
        const { phone } = await request.json()

        if (!phone) {
            return NextResponse.json(
                { valid: false, error: 'Número de telefone é obrigatório' },
                { status: 400 }
            )
        }

        // Limpa o número (remove +, espaços, etc)
        const cleanNumber = phone.replace(/\D/g, '')

        if (cleanNumber.length < 10) {
            return NextResponse.json(
                { valid: false, error: 'Número inválido' },
                { status: 400 }
            )
        }

        // Buscar token da instância no banco
        const { data: connection, error: connError } = await supabase
            .from('whatsapp_connections')
            .select('instance_token')
            .eq('id', VALIDATION_CONNECTION_ID)
            .single()

        if (connError || !connection?.instance_token) {
            console.error('[LP Check WhatsApp] Erro ao buscar token:', connError)
            // Em caso de erro, aceita o número (fail-safe)
            return NextResponse.json({ valid: true, fallback: true })
        }

        // Chamar API UAZAPI para verificar número
        const uazapiUrl = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'

        const checkResponse = await fetch(`${uazapiUrl}/chat/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'token': connection.instance_token
            },
            body: JSON.stringify({
                numbers: [cleanNumber]
            })
        })

        if (!checkResponse.ok) {
            console.error('[LP Check WhatsApp] Erro na API UAZAPI:', checkResponse.status)
            // Fail-safe: aceita o número se a API falhar
            return NextResponse.json({ valid: true, fallback: true })
        }

        const result = await checkResponse.json()
        console.log('[LP Check WhatsApp] Resultado:', result)

        // UAZAPI retorna array com resultado de cada número
        // Formato: [{ exists: true, jid: "5511999999999@s.whatsapp.net" }]
        const numberResult = result?.[0] || result

        const isValid = numberResult?.exists === true || numberResult?.status === 'valid'
        const jid = numberResult?.jid || null

        return NextResponse.json({
            valid: isValid,
            jid: jid,
            phone: cleanNumber
        })

    } catch (error) {
        console.error('[LP Check WhatsApp] Erro:', error)
        // Fail-safe
        return NextResponse.json({ valid: true, fallback: true })
    }
}
