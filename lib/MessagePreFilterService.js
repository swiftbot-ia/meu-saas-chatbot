/**
 * ============================================================================
 * Message Pre-Filter Service
 * ============================================================================
 * Verifica se mensagens devem ser enviadas ao agente IA ANTES do n8n
 * 
 * Filtros implementados:
 * - Detecção de mensagens apenas com emoji(s)
 * - Verificação de palavras ignoradas
 * - Pré-classificação com IA das forbidden_instructions
 * ============================================================================
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Unicode emoji regex pattern
// Covers most emoji ranges including skin tones, ZWJ sequences, etc.
const EMOJI_REGEX = /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\u200D)+/gu;

// OpenAI client singleton
let openaiClient = null;

function getOpenAIClient() {
    if (!openaiClient && process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

class MessagePreFilterService {
    /**
     * Verifica se a mensagem deve ser enviada ao agente
     * 
     * @param {string} messageContent - Conteúdo da mensagem
     * @param {string} connectionId - ID da conexão WhatsApp
     * @param {string} aiInterpretation - Interpretação de IA (para imagens)
     * @returns {Promise<{shouldSend: boolean, reason?: string}>}
     */
    static async shouldSendToAgent(messageContent, connectionId, aiInterpretation = null) {
        try {
            // Usar conteúdo da mensagem ou interpretação de IA
            const textToAnalyze = messageContent || aiInterpretation || '';

            // Se não há conteúdo, não há o que filtrar
            if (!textToAnalyze.trim()) {
                return { shouldSend: true };
            }

            // 1. Buscar configuração do agente para esta conexão
            const { data: agentConfig } = await supabaseAdmin
                .from('ai_agents')
                .select('ignore_emoji_only, ignored_keywords, silence_conditions')
                .eq('connection_id', connectionId)
                .maybeSingle();

            // 2. Verificar emoji-only (se habilitado)
            // Default: true se coluna não existe ou não há config
            const ignoreEmojiOnly = agentConfig?.ignore_emoji_only !== false;

            if (ignoreEmojiOnly && this.isEmojiOnly(textToAnalyze)) {
                return {
                    shouldSend: false,
                    reason: 'emoji_only',
                    details: 'Mensagem contém apenas emoji(s)'
                };
            }

            // 3. Verificar palavras ignoradas
            const ignoredKeywords = agentConfig?.ignored_keywords || [];

            if (ignoredKeywords.length > 0) {
                const matchedKeyword = this.checkIgnoredKeywords(textToAnalyze, ignoredKeywords);

                if (matchedKeyword) {
                    return {
                        shouldSend: false,
                        reason: 'ignored_keyword',
                        details: `Mensagem contém palavra ignorada: "${matchedKeyword}"`,
                        matchedKeyword
                    };
                }
            }

            // 4. Verificar silence_conditions com IA (se configurado)
            const silenceConditions = agentConfig?.silence_conditions;

            if (silenceConditions && silenceConditions.trim()) {
                const silenceCheck = await this.checkSilenceConditionsWithAI(
                    textToAnalyze,
                    silenceConditions
                );

                if (silenceCheck.shouldSilence) {
                    return {
                        shouldSend: false,
                        reason: 'silence_condition',
                        details: silenceCheck.reason || 'Mensagem se enquadra em condição de silêncio',
                        matchedCondition: silenceCheck.condition
                    };
                }
            }

            // Passou em todos os filtros
            return { shouldSend: true };

        } catch (error) {
            console.error('❌ [PreFilter] Erro ao verificar filtros:', error);
            // Em caso de erro, permite o envio para não bloquear fluxo
            return { shouldSend: true, error: error.message };
        }
    }

    /**
     * Verifica se a mensagem se enquadra em alguma condição de silêncio usando IA
     * 
     * @param {string} messageContent - Conteúdo da mensagem
     * @param {string} silenceConditions - Condições para silêncio definidas pelo usuário
     * @returns {Promise<{shouldSilence: boolean, condition?: string, reason?: string}>}
     */
    static async checkSilenceConditionsWithAI(messageContent, silenceConditions) {
        try {
            const client = getOpenAIClient();

            if (!client) {
                console.warn('⚠️ [PreFilter] OpenAI não configurada, pulando verificação de condições de silêncio');
                return { shouldSilence: false };
            }

            console.log('🔍 [PreFilter] Verificando condições de silêncio com IA...');

            // Prompt otimizado para resposta rápida e precisa
            const systemPrompt = `Você é um classificador de mensagens. Sua função é verificar se uma mensagem do cliente se enquadra em alguma das CONDIÇÕES DE SILÊNCIO definidas pelo operador.

CONDIÇÕES DE SILÊNCIO (quando NÃO responder):
${silenceConditions}

INSTRUÇÕES:
- Analise a mensagem do cliente
- Verifique se ela se enquadra em alguma das condições acima
- Se a mensagem se enquadra, o agente NÃO deve responder (silêncio)
- Responda APENAS em JSON válido, sem explicação adicional

FORMATO DE RESPOSTA:
{"shouldSilence": false}
ou
{"shouldSilence": true, "condition": "descrição curta da condição aplicada"}`;

            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini', // Modelo rápido e barato
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Mensagem do cliente: "${messageContent}"` }
                ],
                max_tokens: 100,
                temperature: 0 // Resposta determinística
            });

            const responseText = response.choices[0]?.message?.content?.trim() || '';

            // Parse da resposta JSON
            try {
                // Extrair JSON da resposta (pode ter texto extra)
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);

                    if (result.shouldSilence) {
                        console.log(`🔇 [PreFilter] Condição de silêncio aplicada: ${result.condition}`);
                        return {
                            shouldSilence: true,
                            condition: result.condition,
                            reason: `Condição aplicada: ${result.condition}`
                        };
                    }
                }

                console.log('✅ [PreFilter] Mensagem aprovada pela IA');
                return { shouldSilence: false };

            } catch (parseError) {
                console.warn('⚠️ [PreFilter] Erro ao parsear resposta da IA:', responseText);
                // Em caso de erro de parse, não bloqueia
                return { shouldSilence: false };
            }

        } catch (error) {
            console.error('❌ [PreFilter] Erro ao verificar com IA:', error);
            // Em caso de erro, não bloqueia (fail-safe)
            return { shouldSilence: false };
        }
    }

    /**
     * Detecta se uma mensagem contém APENAS emoji(s)
     * 
     * @param {string} text - Texto a analisar
     * @returns {boolean} - true se é apenas emoji(s)
     */
    static isEmojiOnly(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }

        // Remove todos os emojis do texto
        const textWithoutEmojis = text.replace(EMOJI_REGEX, '');

        // Remove espaços em branco e caracteres de controle
        const remainingText = textWithoutEmojis.replace(/[\s\u200B-\u200D\uFEFF]/g, '');

        // Se sobrou algo, não é apenas emoji
        if (remainingText.length > 0) {
            return false;
        }

        // Verifica se havia pelo menos um emoji
        const hasEmoji = EMOJI_REGEX.test(text);

        return hasEmoji;
    }

    /**
     * Verifica se o texto contém alguma palavra ignorada
     * 
     * @param {string} text - Texto a analisar
     * @param {string[]} keywords - Lista de palavras ignoradas
     * @returns {string|null} - Palavra encontrada ou null
     */
    static checkIgnoredKeywords(text, keywords) {
        if (!text || !keywords || keywords.length === 0) {
            return null;
        }

        const textLower = text.toLowerCase();

        for (const keyword of keywords) {
            if (keyword && textLower.includes(keyword.toLowerCase())) {
                return keyword;
            }
        }

        return null;
    }

    /**
     * Utilitário: Extrai todos os emojis de um texto
     * 
     * @param {string} text - Texto a analisar
     * @returns {string[]} - Array de emojis encontrados
     */
    static extractEmojis(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const matches = text.match(EMOJI_REGEX);
        return matches || [];
    }
}

export default MessagePreFilterService;

