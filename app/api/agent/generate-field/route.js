import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Configuração de prompts por campo
const FIELD_PROMPTS = {
    companyContext: {
        instruction: 'Gere um texto institucional profissional para a seção "Sobre a Empresa".',
        example: 'Inclua: história resumida, valores, missão e políticas gerais.'
    },
    productDescription: {
        instruction: 'Gere uma descrição clara e objetiva das funções do agente de IA.',
        example: 'Liste as principais capacidades e como ele pode ajudar os clientes.'
    },
    welcomeMessage: {
        instruction: 'Crie uma mensagem de boas-vindas calorosa e profissional.',
        example: 'Deve ser concisa, acolhedora e indicar disponibilidade para ajudar.'
    },
    salesCTA: {
        instruction: 'Crie um call-to-action persuasivo para fechamento de vendas.',
        example: 'Deve criar urgência sem ser agressivo demais.'
    },
    forbiddenInstructions: {
        instruction: 'Liste comportamentos e tópicos que o agente deve evitar.',
        example: 'Ex: Não revelar que é IA, não dar descontos não autorizados, etc.'
    },
    productsServices: {
        instruction: 'Liste produtos ou serviços com preços e detalhes formatados.',
        example: 'Use formato de lista com nome, preço e breve descrição.'
    },
    silenceConditions: {
        instruction: 'Descreva situações em que o agente deve permanecer em silêncio.',
        example: 'Ex: Mensagens de confirmação curtas, respostas automáticas de outros sistemas.'
    }
}

export async function POST(request) {
    try {
        const { fieldName, currentValue } = await request.json()

        if (!fieldName) {
            return NextResponse.json(
                { error: 'fieldName é obrigatório' },
                { status: 400 }
            )
        }

        const fieldConfig = FIELD_PROMPTS[fieldName]
        if (!fieldConfig) {
            return NextResponse.json(
                { error: `Campo '${fieldName}' não tem suporte para geração automática.` },
                { status: 400 }
            )
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        })

        // Construir prompt
        let userPrompt = fieldConfig.instruction
        if (currentValue) {
            userPrompt += `\n\nO usuário já tem o seguinte texto (melhore ou complemente, NÃO substitua completamente):\n"${currentValue}"`
        }
        userPrompt += `\n\nExemplo do que incluir: ${fieldConfig.example}`
        userPrompt += `\n\nIMPORTANTE: Gere APENAS o texto sugerido, sem explicações ou formatação markdown.`

        console.log(`✨ [GenerateField] Gerando sugestão para campo: ${fieldName}`)

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Você é um especialista em configuração de agentes de IA para WhatsApp Business.
Gere conteúdo profissional, conciso e adequado para o contexto brasileiro.
Responda APENAS com o texto sugerido, sem explicações adicionais.`
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })

        const suggestion = response.choices[0]?.message?.content?.trim()

        if (!suggestion) {
            throw new Error('Resposta vazia da IA')
        }

        console.log(`✅ [GenerateField] Sugestão gerada com sucesso para: ${fieldName}`)

        return NextResponse.json({
            success: true,
            fieldName,
            suggestion
        })

    } catch (error) {
        console.error('Erro ao gerar campo:', error)
        return NextResponse.json(
            { error: error.message || 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
