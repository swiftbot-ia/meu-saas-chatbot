// app/api/affiliates/apply/route.js
// Endpoint para submeter formulário de aplicação para afiliado

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // Subscription requirement removed to allow 20% commission for all users

        // Verificar se já existe uma aplicação
        const { data: existingApplication } = await supabase
            .from('affiliate_applications')
            .select('id, status')
            .eq('user_id', user.id)
            .single()

        if (existingApplication) {
            return NextResponse.json({
                success: false,
                error: `Você já possui uma aplicação ${existingApplication.status === 'pending' ? 'em análise' : existingApplication.status === 'approved' ? 'aprovada' : 'recusada'}`,
                application: existingApplication
            }, { status: 409 })
        }

        // Validar dados do formulário
        const body = await request.json()
        const { full_name, email, phone, why_affiliate, favorite_feature, has_experience, experience_details } = body

        if (!full_name || !email || !phone || !why_affiliate || !favorite_feature) {
            return NextResponse.json({
                success: false,
                error: 'Preencha todos os campos obrigatórios'
            }, { status: 400 })
        }

        // Criar aplicação
        const { data: application, error: insertError } = await supabase
            .from('affiliate_applications')
            .insert([{
                user_id: user.id,
                full_name,
                email,
                phone,
                why_affiliate,
                favorite_feature,
                has_experience: has_experience || false,
                experience_details: has_experience ? experience_details : null,
                status: 'pending'
            }])
            .select()
            .single()

        if (insertError) {
            console.error('Erro ao criar aplicação:', insertError)
            return NextResponse.json({
                success: false,
                error: 'Erro ao enviar aplicação. Tente novamente.'
            }, { status: 500 })
        }

        console.log('✅ Nova aplicação de afiliado:', application.id)

        return NextResponse.json({
            success: true,
            message: 'Aplicação enviada com sucesso! Em breve entraremos em contato.',
            application: {
                id: application.id,
                status: application.status,
                created_at: application.created_at
            }
        })

    } catch (error) {
        console.error('❌ Erro ao processar aplicação:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
