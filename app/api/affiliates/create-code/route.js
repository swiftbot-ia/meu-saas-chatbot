// app/api/affiliates/create-code/route.js
// Endpoint para afiliado criar seu próprio código

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

        const body = await request.json()
        let { code } = body

        if (!code || code.length < 3) {
            return NextResponse.json({
                success: false,
                error: 'O código deve ter pelo menos 3 caracteres'
            }, { status: 400 })
        }

        // Sanitizar código (apenas letras e números, maiúsculo)
        code = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

        // Verificar se é afiliado
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id, affiliate_code')
            .eq('user_id', user.id)
            .single()

        if (!affiliate) {
            return NextResponse.json({
                success: false,
                error: 'Você não é um afiliado aprovado'
            }, { status: 403 })
        }

        // Allow updating code (removed check for existing code)

        // Verificar disponibilidade do código
        const { data: existing } = await supabase
            .from('affiliates')
            .select('id')
            .eq('affiliate_code', code)
            .single()

        if (existing) {
            return NextResponse.json({
                success: false,
                error: 'Este código já está em uso. Escolha outro.'
            }, { status: 409 })
        }

        // Salvar código
        const { error: updateError } = await supabase
            .from('affiliates')
            .update({
                affiliate_code: code,
                updated_at: new Date().toISOString()
            })
            .eq('id', affiliate.id)

        if (updateError) {
            return NextResponse.json({
                success: false,
                error: 'Erro ao salvar código'
            }, { status: 500 })
        }

        console.log('✅ Código de afiliado criado:', code, 'para user:', user.id)

        return NextResponse.json({
            success: true,
            code: code
        })

    } catch (error) {
        console.error('❌ Erro ao criar código:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
