// app/api/portal-interno/affiliates/route.js
// Admin endpoints para gerenciar aplicações de afiliados

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server' // Use Service Role for Admin Actions
import { createClient } from '@/lib/supabase/server' // Use Client for Auth Check

export const dynamic = 'force-dynamic'

// Listar aplicações de afiliados
export async function GET(request) {
    try {
        const clientSupabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // Parâmetros de filtro
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') || null
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 20
        const offset = (page - 1) * limit

        // Query base - USING ADMIN CLIENT
        let query = supabaseAdmin
            .from('affiliate_applications')
            .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        why_affiliate,
        favorite_feature,
        has_experience,
        experience_details,
        status,
        rejection_reason,
        reviewed_at,
        created_at
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (status) {
            query = query.eq('status', status)
        }

        const { data: applications, error, count } = await query

        if (error) {
            console.error('Erro ao buscar aplicações:', error)
            return NextResponse.json({ success: false, error: 'Erro ao buscar aplicações' }, { status: 500 })
        }

        // Contar por status
        const { data: statusCounts } = await supabaseAdmin
            .from('affiliate_applications')
            .select('status')

        const counts = {
            total: statusCounts?.length || 0,
            pending: statusCounts?.filter(a => a.status === 'pending').length || 0,
            approved: statusCounts?.filter(a => a.status === 'approved').length || 0,
            rejected: statusCounts?.filter(a => a.status === 'rejected').length || 0
        }

        return NextResponse.json({
            success: true,
            applications: applications || [],
            counts,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('❌ Erro ao listar aplicações:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}

// Atualizar status de aplicação (aprovar/rejeitar)
export async function PATCH(request) {
    try {
        const clientSupabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await clientSupabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { application_id, action, rejection_reason } = body

        if (!application_id || !action || !['approve', 'reject', 'update_rate'].includes(action)) {
            return NextResponse.json({
                success: false,
                error: 'Dados inválidos'
            }, { status: 400 })
        }

        // Buscar aplicação - USING ADMIN CLIENT
        const { data: application, error: appError } = await supabaseAdmin
            .from('affiliate_applications')
            .select('*')
            .eq('id', application_id)
            .single()

        if (appError || !application) {
            return NextResponse.json({
                success: false,
                error: 'Aplicação não encontrada'
            }, { status: 404 })
        }

        const now = new Date().toISOString()

        if (action === 'update_rate') {
            const { new_rate } = body

            if (new_rate === undefined || new_rate === null) {
                return NextResponse.json({ success: false, error: 'Nova taxa não informada' }, { status: 400 })
            }

            // Buscar afiliado associado à aplicação (se existir)
            const { data: affiliate } = await supabaseAdmin
                .from('affiliates')
                .select('id')
                .eq('application_id', application_id)
                .single()

            if (!affiliate) {
                return NextResponse.json({ success: false, error: 'Afiliado não encontrado para esta aplicação' }, { status: 404 })
            }

            const { error: updateError } = await supabaseAdmin
                .from('affiliates')
                .update({ commission_rate: parseFloat(new_rate) })
                .eq('id', affiliate.id)

            if (updateError) {
                return NextResponse.json({ success: false, error: 'Erro ao atualizar taxa' }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: 'Taxa atualizada com sucesso' })
        }

        if (action === 'reject') {
            if (application.status !== 'pending') {
                return NextResponse.json({ success: false, error: 'Esta aplicação já foi processada' }, { status: 400 })
            }

            // Rejeitar aplicação
            await supabaseAdmin
                .from('affiliate_applications')
                .update({
                    status: 'rejected',
                    rejection_reason: rejection_reason || 'Não aprovado',
                    reviewed_by: user.id,
                    reviewed_at: now,
                    updated_at: now
                })
                .eq('id', application_id)

            console.log('❌ Aplicação rejeitada:', application_id)

            return NextResponse.json({
                success: true,
                message: 'Aplicação rejeitada com sucesso'
            })
        }

        // APROVAR aplicação
        if (action === 'approve') {
            if (application.status !== 'pending') {
                return NextResponse.json({ success: false, error: 'Esta aplicação já foi processada' }, { status: 400 })
            }

            // 1. Atualizar status da aplicação
            await supabaseAdmin
                .from('affiliate_applications')
                .update({
                    status: 'approved',
                    reviewed_by: user.id,
                    reviewed_at: now,
                    updated_at: now
                })
                .eq('id', application_id)

            // 2. Definir taxa de comissão baseada em assinatura ativa
            let initialRate = 0.20 // Default Não Cliente

            // Verificar assinatura ativa - USING ADMIN (safe since we have user_id)
            const { data: subscription } = await supabaseAdmin
                .from('user_subscriptions')
                .select('status, stripe_subscription_id')
                .eq('user_id', application.user_id)
                .in('status', ['active', 'trial', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const hasActiveSubscription = subscription || false

            if (hasActiveSubscription) {
                initialRate = 0.30
                console.log('🌟 [Affiliate] Usuário é cliente. Taxa definida para 30%')
            } else {
                console.log('👤 [Affiliate] Usuário NÃO é cliente. Taxa definida para 20%')
            }

            // 3. Criar registro de afiliado (SEM CÓDIGO - Será criado pelo usuário)
            const { data: affiliate, error: affError } = await supabaseAdmin
                .from('affiliates')
                .insert([{
                    user_id: application.user_id,
                    application_id: application.id,
                    affiliate_code: null, // Será criado pelo usuário
                    commission_rate: initialRate,
                    commission_months: 1, // Apenas o 1º mês (Primeira cobrança)
                    status: 'pending_onboarding'
                }])
                .select()
                .single()

            if (affError) {
                console.error('Erro ao criar afiliado:', affError)
                return NextResponse.json({
                    success: false,
                    error: 'Erro ao criar registro de afiliado: ' + affError.message
                }, { status: 500 })
            }

            console.log('✅ Afiliado aprovado:', affiliate.id)

            return NextResponse.json({
                success: true,
                message: 'Aplicação aprovada com sucesso!',
                affiliate: {
                    id: affiliate.id,
                    status: affiliate.status,
                    rate: initialRate
                }
            })
        }

    } catch (error) {
        console.error('❌ Erro ao processar aplicação:', error)
        return NextResponse.json({ success: false, error: 'Erro interno: ' + error.message }, { status: 500 })
    }
}
