/**
 * Meta Pixel e Conversions API
 * 
 * Variáveis de ambiente:
 * META_PIXEL_ID=seu_pixel_id
 * META_ACCESS_TOKEN=seu_access_token
 * META_TEST_EVENT_CODE=TEST12345 (opcional, para testes)
 */

import crypto from 'crypto'

const META_API_VERSION = 'v18.0'

/**
 * Faz hash SHA256 dos dados conforme exigido pelo Meta
 * @param {string} value - Valor a ser hasheado
 * @returns {string} - Hash SHA256 em lowercase hex
 */
function hashData(value) {
    if (!value) return null
    const normalized = String(value).toLowerCase().trim()
    return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Normaliza número de telefone para formato E.164
 * @param {string} phone - Número do telefone
 * @returns {string} - Telefone normalizado
 */
function normalizePhone(phone) {
    if (!phone) return null
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, '')
    // Adiciona código do país se necessário
    if (cleaned.length === 11 && cleaned.startsWith('9')) {
        return '55' + cleaned
    }
    if (cleaned.length === 10 || cleaned.length === 11) {
        return '55' + cleaned
    }
    return cleaned
}

/**
 * Envia evento para Conversions API do Meta
 * @param {Object} options - Configurações do evento
 * @param {string} options.eventName - Nome do evento (Lead, CompleteRegistration, etc)
 * @param {string} options.eventId - ID único do evento (para deduplicação)
 * @param {Object} options.userData - Dados do usuário (email, phone, etc)
 * @param {Object} options.customData - Dados customizados (value, currency, etc)
 * @param {string} options.eventSourceUrl - URL de origem do evento
 * @param {string} options.actionSource - Fonte da ação (website, app, etc)
 * @returns {Promise<Object>} - Resultado do envio
 */
export async function sendConversionEvent({
    eventName,
    eventId,
    userData = {},
    customData = {},
    eventSourceUrl = '',
    actionSource = 'website'
}) {
    const pixelId = process.env.META_PIXEL_ID
    const accessToken = process.env.META_ACCESS_TOKEN
    const testEventCode = process.env.META_TEST_EVENT_CODE

    if (!pixelId || !accessToken) {
        console.warn('[Meta] META_PIXEL_ID ou META_ACCESS_TOKEN não configurados')
        return { success: false, error: 'Configuração incompleta' }
    }

    try {
        // Prepara dados do usuário com hash
        const hashedUserData = {}

        if (userData.email) {
            hashedUserData.em = [hashData(userData.email)]
        }
        if (userData.phone) {
            hashedUserData.ph = [hashData(normalizePhone(userData.phone))]
        }
        if (userData.firstName) {
            hashedUserData.fn = [hashData(userData.firstName)]
        }
        if (userData.lastName) {
            hashedUserData.ln = [hashData(userData.lastName)]
        }
        if (userData.country) {
            hashedUserData.country = [hashData(userData.country)]
        }
        if (userData.clientIpAddress) {
            hashedUserData.client_ip_address = userData.clientIpAddress
        }
        if (userData.clientUserAgent) {
            hashedUserData.client_user_agent = userData.clientUserAgent
        }
        if (userData.fbc) {
            hashedUserData.fbc = userData.fbc
        }
        if (userData.fbp) {
            hashedUserData.fbp = userData.fbp
        }

        // Monta payload do evento
        const eventPayload = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: actionSource,
            user_data: hashedUserData
        }

        if (eventId) {
            eventPayload.event_id = eventId
        }

        if (eventSourceUrl) {
            eventPayload.event_source_url = eventSourceUrl
        }

        if (Object.keys(customData).length > 0) {
            eventPayload.custom_data = customData
        }

        // Prepara request body
        const requestBody = {
            data: [eventPayload]
        }

        // Adiciona test_event_code se configurado
        if (testEventCode) {
            requestBody.test_event_code = testEventCode
            console.log('[Meta] Usando test_event_code:', testEventCode)
        }

        const url = `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events?access_token=${accessToken}`

        console.log('[Meta] Enviando evento:', eventName, eventId ? `(ID: ${eventId})` : '')

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })

        const result = await response.json()

        if (response.ok) {
            console.log('[Meta] Evento enviado com sucesso:', result)
            return { success: true, ...result }
        } else {
            console.error('[Meta] Erro ao enviar evento:', result)
            return { success: false, error: result.error?.message || 'Erro desconhecido' }
        }

    } catch (error) {
        console.error('[Meta] Erro:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Envia evento de Lead para Conversions API
 * @param {Object} lead - Dados do lead { email, phone, name, source }
 * @param {Object} options - Opções extras { eventSourceUrl, clientIp, userAgent, fbc, fbp }
 * @returns {Promise<Object>}
 */
export async function sendLeadEvent(lead, options = {}) {
    const { email, phone, name, source } = lead
    const { eventSourceUrl, clientIp, userAgent, fbc, fbp } = options

    // Separa primeiro nome
    const firstName = name ? name.split(' ')[0] : null

    return sendConversionEvent({
        eventName: 'Lead',
        eventId: `lead_${Date.now()}_${phone?.slice(-4) || 'unknown'}`,
        userData: {
            email,
            phone,
            firstName,
            country: 'br',
            clientIpAddress: clientIp,
            clientUserAgent: userAgent,
            fbc,
            fbp
        },
        customData: {
            lead_source: source || 'website',
            content_name: 'LP Live Dubai'
        },
        eventSourceUrl
    })
}

/**
 * Envia evento CompleteRegistration para Conversions API
 * @param {Object} lead - Dados do lead
 * @param {Object} options - Opções extras
 * @returns {Promise<Object>}
 */
export async function sendCompleteRegistrationEvent(lead, options = {}) {
    const { email, phone, name, source } = lead
    const { eventSourceUrl, clientIp, userAgent, fbc, fbp } = options

    const firstName = name ? name.split(' ')[0] : null

    return sendConversionEvent({
        eventName: 'CompleteRegistration',
        eventId: `reg_${Date.now()}_${phone?.slice(-4) || 'unknown'}`,
        userData: {
            email,
            phone,
            firstName,
            country: 'br',
            clientIpAddress: clientIp,
            clientUserAgent: userAgent,
            fbc,
            fbp
        },
        customData: {
            content_name: 'LP Live Dubai',
            status: 'completed',
            lead_source: source || 'website'
        },
        eventSourceUrl
    })
}

/**
 * Script do Pixel para injetar no client-side
 * Use em um componente Next.js com <Script>
 */
export function getPixelScript() {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

    if (!pixelId) return ''

    return `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
    `
}
