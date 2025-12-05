import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase/server.js'
import { ensureSuperAccountBypass } from '../../../../lib/super-account-setup'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

/**
 * API para garantir que uma super account tem assinatura bypass ativa
 * POST /api/super-account/ensure-bypass
 */
export async function POST(request) {
    try {
        const { userId } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'userId é obrigatório' },
                { status: 400 }
            )
        }

        console.log('🔧 [API] Garantindo bypass para userId:', userId)

        // Verificar autenticação (o próprio usuário ou admin)
        const supabase = createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        // Permitir se for o próprio usuário ou se for admin (verificar via support_users)
        if (user.id !== userId) {
            // Verificar se é usuário de suporte
            const { data: supportUser } = await supabase
                .from('support_users')
                .select('id, role')
                .eq('email', user.email)
                .single()

            if (!supportUser || !['admin', 'gerente'].includes(supportUser.role)) {
                return NextResponse.json(
                    { success: false, error: 'Sem permissão' },
                    { status: 403 }
                )
            }
        }

        // Executar criação/atualização do bypass
        const result = await ensureSuperAccountBypass(userId)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            subscription: result.subscription,
            created: result.created
        })

    } catch (error) {
        console.error('❌ [API] Erro ao garantir bypass:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
