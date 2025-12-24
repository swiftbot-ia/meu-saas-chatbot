// app/api/affiliates/users/route.js
// Endpoint para listar usuários indicados pelo afiliado

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const supabase = await createClient()

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // Verificar se é afiliado
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (!affiliate) {
            return NextResponse.json({
                success: false,
                error: 'Você não é um afiliado aprovado'
            }, { status: 403 })
        }

        // Parâmetros de paginação
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 20
        const status = searchParams.get('status') || null
        const offset = (page - 1) * limit

        // Query base
        let query = supabase
            .from('affiliate_referrals')
            .select(`
        id,
        referred_user_id,
        referral_code_used,
        signup_date,
        first_payment_date,
        expires_at,
        total_payments,
        total_commissions,
        status
      `, { count: 'exact' })
            .eq('affiliate_id', affiliate.id)
            .order('signup_date', { ascending: false })
            .range(offset, offset + limit - 1)

        // Filtro por status
        if (status) {
            query = query.eq('status', status)
        }

        const { data: referrals, error: refError, count } = await query

        if (refError) {
            console.error('Erro ao buscar referrals:', refError)
            return NextResponse.json({ success: false, error: 'Erro ao buscar usuários' }, { status: 500 })
        }

        // Buscar informações de perfil dos usuários (se disponível)
        const usersWithProfiles = await Promise.all(
            (referrals || []).map(async (ref) => {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('name, email')
                    .eq('user_id', ref.referred_user_id)
                    .single()

                return {
                    ...ref,
                    user_name: profile?.name || 'Usuário',
                    user_email: profile?.email || null,
                    days_remaining: ref.expires_at
                        ? Math.max(0, Math.ceil((new Date(ref.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
                        : null
                }
            })
        )

        return NextResponse.json({
            success: true,
            users: usersWithProfiles,
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
