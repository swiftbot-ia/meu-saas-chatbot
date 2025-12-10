// =============================================================================
// Data Deletion Service
// Gerencia a exclusão de dados do usuário em conformidade com LGPD e Meta Terms
// =============================================================================

import { supabaseAdmin } from '@/lib/supabase/server'
import { createChatSupabaseAdmin } from '@/lib/supabase-chat'

/**
 * Serviço centralizado para exclusão de dados do usuário
 */
export class DataDeletionService {

    /**
     * Processa uma solicitação de exclusão de dados
     * @param {string} requestId - ID da solicitação de exclusão
     * @param {string} userId - ID do usuário no Supabase
     */
    static async processDeletion(requestId, userId) {
        console.log(`🗑️ [DataDeletion] Starting deletion for user: ${userId}`)

        const deletedTables = []
        const retainedTables = []
        const errors = []

        try {
            // Update status to processing
            await supabaseAdmin
                .from('data_deletion_requests')
                .update({
                    status: 'processing',
                    processed_at: new Date().toISOString()
                })
                .eq('id', requestId)

            // =================================================================
            // CHAT DATABASE - Excluir primeiro (tem dependências)
            // =================================================================
            const chatResult = await this.deleteChatDatabaseData(requestId, userId)
            deletedTables.push(...chatResult.deleted)
            errors.push(...chatResult.errors)

            // =================================================================
            // MAIN DATABASE - Excluir em ordem (respeitando foreign keys)
            // =================================================================

            // 1. swiftbot_messages (via cascade de conversations)
            // Não precisa deletar manualmente - CASCADE cuida disso

            // 2. swiftbot_conversations
            const swiftbotConvResult = await this.deleteFromTable(
                requestId, 'swiftbot_conversations', { user_id: userId }
            )
            if (swiftbotConvResult.success) deletedTables.push(swiftbotConvResult)
            else errors.push(swiftbotConvResult)

            // 3. credit_transactions
            const creditTxResult = await this.deleteFromTable(
                requestId, 'credit_transactions', { user_id: userId }
            )
            if (creditTxResult.success) deletedTables.push(creditTxResult)
            else errors.push(creditTxResult)

            // 4. agent_configurations
            const agentConfigResult = await this.deleteFromTable(
                requestId, 'agent_configurations', { user_id: userId }
            )
            if (agentConfigResult.success) deletedTables.push(agentConfigResult)
            else errors.push(agentConfigResult)

            // 5. contact_agent_settings (via connection_id)
            // Será deletado via CASCADE quando whatsapp_connections for deletado

            // 6. whatsapp_connections
            const connectionsResult = await this.deleteFromTable(
                requestId, 'whatsapp_connections', { user_id: userId }
            )
            if (connectionsResult.success) deletedTables.push(connectionsResult)
            else errors.push(connectionsResult)

            // 7. CRM - crm_leads (via pipeline CASCADE)
            // 8. crm_pipelines
            const pipelinesResult = await this.deleteFromTable(
                requestId, 'crm_pipelines', { user_id: userId }
            )
            if (pipelinesResult.success) deletedTables.push(pipelinesResult)
            else errors.push(pipelinesResult)

            // 9. support_tickets
            const ticketsResult = await this.deleteFromTable(
                requestId, 'support_tickets', { user_id: userId }
            )
            if (ticketsResult.success) deletedTables.push(ticketsResult)
            else errors.push(ticketsResult)

            // 10. user_credits
            const creditsResult = await this.deleteFromTable(
                requestId, 'user_credits', { user_id: userId }
            )
            if (creditsResult.success) deletedTables.push(creditsResult)
            else errors.push(creditsResult)

            // =================================================================
            // DADOS RETIDOS (LGPD Art. 16, II - Obrigação Legal)
            // Manter por 5 anos conforme CTN Art. 173
            // =================================================================

            // 11. payment_logs - RETER (dados fiscais)
            const paymentLogsRetain = await this.retainForCompliance(
                requestId,
                'payment_logs',
                { user_id: userId },
                'Obrigação legal - CTN Art. 173 (5 anos)'
            )
            retainedTables.push(paymentLogsRetain)

            // 12. user_subscriptions - ANONIMIZAR (manter metadados fiscais)
            const subscriptionAnon = await this.anonymizeSubscription(requestId, userId)
            retainedTables.push(subscriptionAnon)

            // 13. user_profiles - EXCLUIR (dados pessoais)
            const profileResult = await this.deleteFromTable(
                requestId, 'user_profiles', { user_id: userId }
            )
            if (profileResult.success) deletedTables.push(profileResult)
            else errors.push(profileResult)

            // =================================================================
            // AUTH.USERS - Excluir usuário do Supabase Auth
            // =================================================================
            const authResult = await this.deleteAuthUser(requestId, userId)
            if (authResult.success) deletedTables.push(authResult)
            else errors.push(authResult)

            // =================================================================
            // Finalizar solicitação
            // =================================================================
            const finalStatus = errors.length === 0 ? 'completed' :
                deletedTables.length > 0 ? 'partial' : 'failed'

            await supabaseAdmin
                .from('data_deletion_requests')
                .update({
                    status: finalStatus,
                    completed_at: new Date().toISOString(),
                    deleted_tables: deletedTables,
                    retained_tables: retainedTables,
                    error_message: errors.length > 0 ? JSON.stringify(errors) : null
                })
                .eq('id', requestId)

            console.log(`✅ [DataDeletion] Completed with status: ${finalStatus}`)
            console.log(`   Deleted: ${deletedTables.length} tables`)
            console.log(`   Retained: ${retainedTables.length} tables`)
            console.log(`   Errors: ${errors.length}`)

            return { success: true, status: finalStatus, deletedTables, retainedTables, errors }

        } catch (error) {
            console.error('❌ [DataDeletion] Fatal error:', error)

            await supabaseAdmin
                .from('data_deletion_requests')
                .update({
                    status: 'failed',
                    error_message: error.message
                })
                .eq('id', requestId)

            return { success: false, error: error.message }
        }
    }

    /**
     * Deleta dados do banco de Chat (Supabase secundário)
     */
    static async deleteChatDatabaseData(requestId, userId) {
        const deleted = []
        const errors = []

        try {
            const chatSupabase = createChatSupabaseAdmin()

            // Buscar conversas do usuário
            const { data: conversations } = await chatSupabase
                .from('whatsapp_conversations')
                .select('id')
                .eq('user_id', userId)

            if (conversations && conversations.length > 0) {
                const conversationIds = conversations.map(c => c.id)

                // 1. Deletar mensagens
                const { count: msgCount, error: msgError } = await chatSupabase
                    .from('whatsapp_messages')
                    .delete()
                    .in('conversation_id', conversationIds)

                if (msgError) {
                    errors.push({ table: 'whatsapp_messages (chat)', error: msgError.message })
                } else {
                    deleted.push({ table: 'whatsapp_messages (chat)', count: msgCount || 0 })
                    await this.logDeletion(requestId, 'whatsapp_messages', msgCount || 0, 'delete')
                }

                // 2. Deletar conversas
                const { count: convCount, error: convError } = await chatSupabase
                    .from('whatsapp_conversations')
                    .delete()
                    .eq('user_id', userId)

                if (convError) {
                    errors.push({ table: 'whatsapp_conversations (chat)', error: convError.message })
                } else {
                    deleted.push({ table: 'whatsapp_conversations (chat)', count: convCount || 0 })
                    await this.logDeletion(requestId, 'whatsapp_conversations', convCount || 0, 'delete')
                }
            }

            // 3. Contatos órfãos serão mantidos (podem pertencer a outros usuários)
            // Não deletamos whatsapp_contacts aqui

        } catch (error) {
            console.error('❌ [DataDeletion] Chat DB error:', error)
            errors.push({ table: 'chat_database', error: error.message })
        }

        return { deleted, errors }
    }

    /**
     * Deleta registros de uma tabela específica
     */
    static async deleteFromTable(requestId, tableName, where) {
        try {
            let query = supabaseAdmin.from(tableName).delete()

            // Aplicar filtros
            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { count, error } = await query

            if (error) {
                console.error(`❌ [DataDeletion] Error deleting from ${tableName}:`, error)
                return { table: tableName, success: false, error: error.message }
            }

            console.log(`🗑️ [DataDeletion] Deleted ${count || 0} records from ${tableName}`)

            await this.logDeletion(requestId, tableName, count || 0, 'delete')

            return { table: tableName, success: true, count: count || 0 }

        } catch (error) {
            console.error(`❌ [DataDeletion] Exception deleting from ${tableName}:`, error)
            return { table: tableName, success: false, error: error.message }
        }
    }

    /**
     * Marca dados como retidos por obrigação legal
     */
    static async retainForCompliance(requestId, tableName, where, reason) {
        try {
            let query = supabaseAdmin.from(tableName).select('id')

            Object.entries(where).forEach(([key, value]) => {
                query = query.eq(key, value)
            })

            const { count } = await query

            console.log(`📦 [DataDeletion] Retained ${count || 0} records from ${tableName}: ${reason}`)

            await this.logDeletion(requestId, tableName, count || 0, 'retain', reason)

            return {
                table: tableName,
                action: 'retain',
                count: count || 0,
                reason
            }

        } catch (error) {
            console.error(`❌ [DataDeletion] Error checking ${tableName}:`, error)
            return { table: tableName, action: 'retain', error: error.message }
        }
    }

    /**
     * Anonimiza dados de assinatura (mantém para fins fiscais)
     */
    static async anonymizeSubscription(requestId, userId) {
        try {
            const { data, error } = await supabaseAdmin
                .from('user_subscriptions')
                .update({
                    // Anonimizar dados pessoais, manter dados fiscais
                    user_id: null, // Remove associação com usuário
                    // Mantém: stripe_subscription_id, plan_id, amount, dates
                })
                .eq('user_id', userId)

            if (error) {
                console.error('❌ [DataDeletion] Error anonymizing subscription:', error)
                return { table: 'user_subscriptions', action: 'anonymize', error: error.message }
            }

            console.log(`🔒 [DataDeletion] Anonymized subscriptions for user ${userId}`)

            await this.logDeletion(requestId, 'user_subscriptions', 1, 'anonymize', 'LGPD Art. 16, II')

            return {
                table: 'user_subscriptions',
                action: 'anonymize',
                reason: 'Dados fiscais mantidos por obrigação legal (CTN Art. 173)'
            }

        } catch (error) {
            return { table: 'user_subscriptions', action: 'anonymize', error: error.message }
        }
    }

    /**
     * Deleta usuário do Supabase Auth
     */
    static async deleteAuthUser(requestId, userId) {
        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

            if (error) {
                console.error('❌ [DataDeletion] Error deleting auth user:', error)
                return { table: 'auth.users', success: false, error: error.message }
            }

            console.log(`🗑️ [DataDeletion] Deleted auth user: ${userId}`)

            await this.logDeletion(requestId, 'auth.users', 1, 'delete')

            return { table: 'auth.users', success: true, count: 1 }

        } catch (error) {
            console.error('❌ [DataDeletion] Exception deleting auth user:', error)
            return { table: 'auth.users', success: false, error: error.message }
        }
    }

    /**
     * Registra log de exclusão para auditoria
     */
    static async logDeletion(requestId, tableName, recordsCount, actionType, reason = null) {
        try {
            await supabaseAdmin
                .from('data_deletion_logs')
                .insert({
                    deletion_request_id: requestId,
                    table_name: tableName,
                    records_deleted: recordsCount,
                    action_type: actionType,
                    retention_reason: reason
                })
        } catch (error) {
            console.error('⚠️ [DataDeletion] Failed to log deletion:', error)
        }
    }

    /**
     * Obtém status de uma solicitação de exclusão
     */
    static async getStatus(confirmationCode) {
        try {
            const { data, error } = await supabaseAdmin
                .from('data_deletion_requests')
                .select(`
          *,
          logs:data_deletion_logs(*)
        `)
                .eq('confirmation_code', confirmationCode)
                .single()

            if (error || !data) {
                return { found: false }
            }

            return {
                found: true,
                status: data.status,
                requestedAt: data.requested_at,
                completedAt: data.completed_at,
                deletedTables: data.deleted_tables,
                retainedTables: data.retained_tables,
                logs: data.logs
            }

        } catch (error) {
            console.error('❌ [DataDeletion] Error getting status:', error)
            return { found: false, error: error.message }
        }
    }
}
