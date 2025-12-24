// app/api/affiliates/validate-code/route.js
// Endpoint para validar código de afiliado (usado no signup)

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')

        if (!code) {
            return NextResponse.json({
                success: false,
                valid: false,
                error: 'Código não fornecido'
            }, { status: 400 })
        }

        // Buscar afiliado pelo código
        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .select(`
        id,
        affiliate_code,
        status,
        user_id,
        affiliate_applications (
          full_name
        )
      `)
            .eq('affiliate_code', code.toUpperCase())
            .single()

        if (error || !affiliate) {
            return NextResponse.json({
                success: true,
                valid: false,
                message: 'Código de afiliado não encontrado'
            })
        }

        // Verificar se está ativo
        if (affiliate.status !== 'active') {
            return NextResponse.json({
                success: true,
                valid: false,
                message: 'Este código de afiliado não está ativo'
            })
        }

        // Retornar nome do afiliado para exibir na tela
        const affiliateName = affiliate.affiliate_applications?.full_name || 'Afiliado SwiftBot'

        return NextResponse.json({
            success: true,
            valid: true,
            affiliate_name: affiliateName,
            code: affiliate.affiliate_code
        })

    } catch (error) {
        console.error('❌ Erro ao validar código:', error)
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
    }
}
