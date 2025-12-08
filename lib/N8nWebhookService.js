/**
 * ============================================================================
 * N8n Webhook Service
 * ============================================================================
 * Envia dados completos de mensagens para o agente de IA no n8n
 * 
 * Características:
 * - Fila de retry com backoff exponencial
 * - Apenas mensagens inbound (recebidas de contatos)
 * - Envia o payload original + dados adicionais processados
 * ============================================================================
 */

// Fila simples em memória para retry
// Em produção, considerar Redis ou banco de dados
const retryQueue = [];
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 segundo
const MAX_RETRY_DELAY = 60000; // 60 segundos

/**
 * Worker que processa a fila de retry em background
 */
let isProcessingQueue = false;

async function processRetryQueue() {
    if (isProcessingQueue || retryQueue.length === 0) return;

    isProcessingQueue = true;

    while (retryQueue.length > 0) {
        const item = retryQueue[0];

        // Verificar se é hora de tentar novamente
        if (Date.now() < item.nextRetryAt) {
            // Aguardar até o próximo retry
            const waitTime = item.nextRetryAt - Date.now();
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
            continue;
        }

        try {
            await sendWithTimeout(item.payload, 10000);
            // Sucesso - remover da fila
            retryQueue.shift();
            console.log(`✅ [N8nWebhook] Retry bem-sucedido (tentativa ${item.retryCount + 1})`);
        } catch (error) {
            item.retryCount++;

            if (item.retryCount >= MAX_RETRIES) {
                // Esgotou tentativas - remover e logar
                retryQueue.shift();
                console.error(`❌ [N8nWebhook] Falha permanente após ${MAX_RETRIES} tentativas:`, {
                    messageId: item.payload?.message?.id,
                    error: error.message
                });
            } else {
                // Calcular próximo retry com backoff exponencial
                const delay = Math.min(
                    INITIAL_RETRY_DELAY * Math.pow(2, item.retryCount),
                    MAX_RETRY_DELAY
                );
                item.nextRetryAt = Date.now() + delay;
                console.warn(`⏳ [N8nWebhook] Retry ${item.retryCount}/${MAX_RETRIES} em ${delay}ms`);
            }
        }
    }

    isProcessingQueue = false;
}

/**
 * Envia payload com timeout
 */
async function sendWithTimeout(payload, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            throw new Error('N8N_WEBHOOK_URL não configurada');
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SwiftBot-Webhook/1.0'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json().catch(() => ({ success: true }));
    } finally {
        clearTimeout(timeout);
    }
}

class N8nWebhookService {
    /**
     * Envia dados da mensagem para o webhook n8n
     * 
     * @param {object} savedMessage - Mensagem salva no banco
     * @param {object} connection - Dados da conexão WhatsApp
     * @param {object} contact - Dados do contato
     * @param {object} conversation - Dados da conversa
     * @param {object} originalWebhookPayload - Payload original do webhook UAZAPI
     */
    static async sendToN8n(savedMessage, connection, contact, conversation, originalWebhookPayload) {
        try {
            // Verificar se está configurado
            if (!process.env.N8N_WEBHOOK_URL) {
                console.warn('⚠️ [N8nWebhook] N8N_WEBHOOK_URL não configurada, pulando envio');
                return { success: false, reason: 'not_configured' };
            }

            // Filtrar: apenas mensagens inbound (recebidas de contatos)
            if (savedMessage.direction !== 'inbound') {
                console.log('ℹ️ [N8nWebhook] Ignorando mensagem outbound');
                return { success: false, reason: 'outbound_message' };
            }

            // Construir payload
            const payload = this.buildPayload(
                savedMessage,
                connection,
                contact,
                conversation,
                originalWebhookPayload
            );

            console.log('🚀 [N8nWebhook] Enviando para n8n:', {
                messageId: savedMessage.message_id,
                type: savedMessage.message_type,
                hasTranscription: !!savedMessage.metadata?.transcription
            });

            // Tentar envio imediato
            try {
                const result = await sendWithTimeout(payload, 10000);
                console.log('✅ [N8nWebhook] Enviado com sucesso');
                return { success: true, result };
            } catch (error) {
                // Adicionar à fila de retry
                console.warn(`⚠️ [N8nWebhook] Falha no envio, adicionando à fila: ${error.message}`);

                retryQueue.push({
                    payload,
                    retryCount: 0,
                    nextRetryAt: Date.now() + INITIAL_RETRY_DELAY,
                    addedAt: new Date().toISOString()
                });

                // Iniciar processamento da fila em background
                setImmediate(processRetryQueue);

                return { success: false, reason: 'queued_for_retry', error: error.message };
            }

        } catch (error) {
            console.error('❌ [N8nWebhook] Erro ao preparar envio:', error);
            return { success: false, reason: 'preparation_error', error: error.message };
        }
    }

    /**
     * Constrói o payload para envio ao n8n
     * Inclui o payload original intacto + dados adicionais processados
     */
    static buildPayload(message, connection, contact, conversation, originalPayload) {
        // Extrair transcrição/interpretação do metadata
        const metadata = message.metadata || {};

        // Determinar o conteúdo textual final
        // Prioridade: transcrição > content original
        let textContent = message.message_content || '';
        if (metadata.transcription) {
            textContent = metadata.transcription;
        }

        return {
            // === EVENTO E TIMESTAMP ===
            event: 'new_message',
            timestamp: new Date().toISOString(),

            // === PAYLOAD ORIGINAL INTACTO ===
            original_webhook: originalPayload,

            // === DADOS PROCESSADOS (ADICIONAIS) ===
            processed_data: {
                // Mensagem processada
                message: {
                    id: message.id,
                    message_id: message.message_id,
                    type: message.message_type,
                    content: textContent,
                    original_content: message.message_content,
                    direction: message.direction,
                    status: message.status,
                    received_at: message.received_at,
                    media_url: message.media_url || null
                },

                // Dados de IA (transcrição e interpretação)
                ai_processing: {
                    transcription: metadata.transcription || null,
                    ai_interpretation: metadata.ai_interpretation || null,
                    transcription_status: metadata.transcription_status || 'not_applicable',
                    transcribed_at: metadata.transcribed_at || null
                },

                // Dados do contato
                contact: {
                    id: contact.id,
                    whatsapp_number: contact.whatsapp_number,
                    name: contact.name || contact.whatsapp_number,
                    profile_pic_url: contact.profile_pic_url || null
                },

                // Dados da conversa
                conversation: {
                    id: conversation.id,
                    instance_name: conversation.instance_name || message.instance_name,
                    unread_count: conversation.unread_count || 0
                },

                // Dados da conexão (para contexto)
                connection: {
                    id: connection.id,
                    phone_number: connection.phone_number,
                    user_id: connection.user_id,
                    instance_name: connection.instance_name
                }
            }
        };
    }

    /**
     * Retorna status da fila de retry
     */
    static getQueueStatus() {
        return {
            queueLength: retryQueue.length,
            isProcessing: isProcessingQueue,
            items: retryQueue.map(item => ({
                messageId: item.payload?.processed_data?.message?.id,
                retryCount: item.retryCount,
                nextRetryAt: new Date(item.nextRetryAt).toISOString(),
                addedAt: item.addedAt
            }))
        };
    }

    /**
     * Limpa a fila de retry (para manutenção)
     */
    static clearQueue() {
        const count = retryQueue.length;
        retryQueue.length = 0;
        return { cleared: count };
    }
}

export default N8nWebhookService;
