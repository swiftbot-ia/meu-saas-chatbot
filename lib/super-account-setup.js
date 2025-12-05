import { supabase } from './supabase'

/**
 * Garante que uma super account tem assinatura bypass ativa
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function ensureSuperAccountBypass(userId) {
    try {
        console.log('🔧 [SuperAccount] Verificando bypass para userId:', userId)

        // 1. Verificar se é realmente uma super account
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_super_account, email, full_name')
            .eq('user_id', userId)
            .single()

        if (profileError || !profile) {
            throw new Error('Perfil não encontrado')
        }

        if (!profile.is_super_account) {
            console.log('⚠️ [SuperAccount] Usuário não é super account')
            return {
                success: false,
                error: 'Usuário não é uma super account',
                needsBypass: false
            }
        }

        console.log('✅ [SuperAccount] Usuário é super account:', profile.email)

        // 2. Verificar se já tem assinatura bypass ativa
        const { data: existingSubscription } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('stripe_subscription_id', 'super_account_bypass')
            .single()

        if (existingSubscription && existingSubscription.status === 'active') {
            console.log('✅ [SuperAccount] Bypass já existe e está ativo')
            return {
                success: true,
                subscription: existingSubscription,
                created: false,
                message: 'Bypass já existe'
            }
        }

        // 3. Cancelar qualquer assinatura ativa anterior (exceto bypass)
        const { data: activeSubscriptions } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'trial', 'trialing'])
            .neq('stripe_subscription_id', 'super_account_bypass')

        if (activeSubscriptions && activeSubscriptions.length > 0) {
            console.log(`⚠️ [SuperAccount] Cancelando ${activeSubscriptions.length} assinatura(s) anterior(es)`)

            for (const sub of activeSubscriptions) {
                await supabase
                    .from('user_subscriptions')
                    .update({
                        status: 'canceled',
                        canceled_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', sub.id)
            }
        }

        // 4. Criar ou atualizar assinatura bypass
        const now = new Date()
        const bypassData = {
            user_id: userId,
            stripe_subscription_id: 'super_account_bypass',
            status: 'active',
            billing_period: 'monthly',
            connections_purchased: 7, // Limite máximo para super accounts
            trial_start_date: null,
            trial_end_date: null,
            next_billing_date: null, // Não tem próxima cobrança
            stripe_customer_id: null,
            stripe_payment_method_id: null,
            payment_gateway: 'super_account',
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        }

        let subscription
        let created = false

        if (existingSubscription) {
            // Atualizar bypass existente para ativo
            console.log('🔄 [SuperAccount] Atualizando bypass existente')
            const { data, error } = await supabase
                .from('user_subscriptions')
                .update({
                    ...bypassData,
                    created_at: existingSubscription.created_at // Manter data de criação original
                })
                .eq('id', existingSubscription.id)
                .select()
                .single()

            if (error) throw error
            subscription = data
        } else {
            // Criar novo bypass
            console.log('🆕 [SuperAccount] Criando novo bypass')
            const { data, error } = await supabase
                .from('user_subscriptions')
                .insert([bypassData])
                .select()
                .single()

            if (error) throw error
            subscription = data
            created = true
        }

        // 5. Registrar log da operação
        await supabase
            .from('payment_logs')
            .insert([{
                user_id: userId,
                subscription_id: subscription.id,
                event_type: created ? 'super_account_bypass_created' : 'super_account_bypass_updated',
                amount: 0,
                payment_method: 'super_account',
                status: 'success',
                metadata: {
                    is_super_account: true,
                    connections_limit: 7,
                    profile_email: profile.email
                },
                created_at: now.toISOString()
            }])

        console.log('✅ [SuperAccount] Bypass criado/atualizado com sucesso')

        return {
            success: true,
            subscription: subscription,
            created: created,
            message: created ? 'Bypass criado com sucesso' : 'Bypass atualizado com sucesso'
        }

    } catch (error) {
        console.error('❌ [SuperAccount] Erro ao garantir bypass:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

/**
 * Remove bypass de super account e cancela assinatura
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function removeSuperAccountBypass(userId) {
    try {
        console.log('🗑️ [SuperAccount] Removendo bypass para userId:', userId)

        // Cancelar assinatura bypass
        const { error } = await supabase
            .from('user_subscriptions')
            .update({
                status: 'canceled',
                canceled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('stripe_subscription_id', 'super_account_bypass')

        if (error) throw error

        // Registrar log
        await supabase
            .from('payment_logs')
            .insert([{
                user_id: userId,
                event_type: 'super_account_bypass_removed',
                amount: 0,
                payment_method: 'super_account',
                status: 'canceled',
                created_at: new Date().toISOString()
            }])

        console.log('✅ [SuperAccount] Bypass removido com sucesso')

        return {
            success: true,
            message: 'Bypass removido com sucesso'
        }

    } catch (error) {
        console.error('❌ [SuperAccount] Erro ao remover bypass:', error)
        return {
            success: false,
            error: error.message
        }
    }
}
