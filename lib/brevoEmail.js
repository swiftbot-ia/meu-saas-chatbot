/**
 * Serviço de envio de emails transacionais via Brevo (Sendinblue)
 * 
 * Configurar variável de ambiente:
 * BREVO_API_KEY=xkeysib-...
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

/**
 * Envia um email transacional via Brevo
 * @param {Object} options - Opções do email
 * @param {string} options.to - Email do destinatário
 * @param {string} options.toName - Nome do destinatário
 * @param {string} options.subject - Assunto do email
 * @param {string} options.htmlContent - Conteúdo HTML do email
 * @param {string} options.textContent - Conteúdo texto (fallback)
 * @param {string} options.from - Email do remetente (opcional)
 * @param {string} options.fromName - Nome do remetente (opcional)
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendEmail({
    to,
    toName = '',
    subject,
    htmlContent,
    textContent = '',
    from = 'naoresponda@swiftbot.com.br',
    fromName = 'SwiftBot',
    replyTo = null
}) {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
        console.error('[Brevo] BREVO_API_KEY não configurada')
        return { success: false, error: 'API key não configurada' }
    }

    if (!to || !subject || !htmlContent) {
        console.error('[Brevo] Parâmetros obrigatórios faltando')
        return { success: false, error: 'Parâmetros obrigatórios: to, subject, htmlContent' }
    }

    try {
        const payload = {
            sender: {
                email: from,
                name: fromName
            },
            to: [
                {
                    email: to,
                    name: toName || to
                }
            ],
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent || subject,
            ...(replyTo && { replyTo })
        }

        console.log('[Brevo] Enviando email para:', to)

        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const result = await response.json()

        if (response.ok) {
            console.log('[Brevo] Email enviado com sucesso:', result.messageId)
            return { success: true, messageId: result.messageId }
        } else {
            console.error('[Brevo] Erro ao enviar:', result)
            return { success: false, error: result.message || 'Erro desconhecido' }
        }

    } catch (error) {
        console.error('[Brevo] Erro:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Template de email de confirmação para Live Dubai
 * @param {Object} lead - Dados do lead { name, whatsapp, email }
 * @returns {string} HTML do email
 */
export function getLiveDubaiConfirmationTemplate(lead) {
    const { name } = lead

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0D0D0D;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D0D0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00E08F 0%, #00C27A 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 700;">✅ Inscrição Confirmada!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #fff; font-size: 18px; margin: 0 0 20px;">
                                Olá <strong>${name || 'você'}</strong>! 👋
                            </p>
                            
                            <p style="color: #A1A1AA; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                                Sua vaga na <strong style="color: #00E08F;">Live: Configure seu Agente de Vendas IA em 15 minutos</strong> está garantida!
                            </p>
                            
                            <div style="background-color: #1A1A1A; border-radius: 12px; padding: 25px; margin: 25px 0;">
                                <p style="color: #00E08F; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px;">📅 Anote na agenda</p>
                                <p style="color: #fff; font-size: 24px; font-weight: 700; margin: 0;">Sábado, 28 de Dezembro</p>
                                <p style="color: #00E08F; font-size: 20px; font-weight: 600; margin: 5px 0 0;">10h da manhã (Brasília)</p>
                            </div>
                            
                            <p style="color: #A1A1AA; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                                ⚠️ <strong style="color: #FF6B6B;">Importante:</strong> Essa live <strong>não terá replay</strong>. Esteja online no horário para não perder!
                            </p>
                            
                            <p style="color: #A1A1AA; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                                O link da transmissão será enviado para este email 30 minutos antes de começar.
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://swiftbot.com.br" style="display: inline-block; background-color: #00E08F; color: #000; text-decoration: none; padding: 15px 35px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                                    Conhecer o SwiftBot
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 30px; border-top: 1px solid #27272A;">
                            <p style="color: #71717A; font-size: 13px; margin: 0; text-align: center;">
                                <strong style="color: #fff;">SwiftBot</strong> — Seu Clone Digital de Vendas<br>
                                <span style="font-size: 12px;">Este é um email automático, não responda.</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim()
}

/**
 * Envia email de confirmação da Live Dubai
 * @param {Object} lead - Dados do lead { name, email }
 * @returns {Promise<Object>} Resultado do envio
 */
export async function sendLiveDubaiConfirmation(lead) {
    const { name, email } = lead

    return sendEmail({
        to: email,
        toName: name,
        subject: '✅ Vaga Confirmada | Live: Agente de Vendas IA - 28/12 às 10h',
        htmlContent: getLiveDubaiConfirmationTemplate(lead),
        textContent: `Olá ${name}! Sua vaga na Live está confirmada. Sábado, 28 de Dezembro às 10h (Brasília). Não terá replay!`
    })
}
