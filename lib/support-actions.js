// ====================================================================
// lib/support-actions.js
// Ações que o suporte pode realizar sobre clientes
// ====================================================================

import { supabaseAdmin } from './support-auth';
import bcrypt from 'bcryptjs';

// ====================================================================
// LOG DE AÇÕES
// ====================================================================

/**
 * Registrar ação no log
 */
async function logAction(supportUserId, targetUserId, actionType, description, previousValue, newValue, ipAddress, userAgent) {
  try {
    await supabaseAdmin
      .from('support_actions_log')
      .insert({
        support_user_id: supportUserId,
        target_user_id: targetUserId,
        action_type: actionType,
        action_description: description,
        previous_value: previousValue,
        new_value: newValue,
        ip_address: ipAddress,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
}

// ====================================================================
// BUSCA E INFORMAÇÕES DE CLIENTES
// ====================================================================

/**
 * Buscar clientes (search)
 */
export async function searchClients(query, limit = 50) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, company_name, phone, created_at, is_super_account')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, clients: data };
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return { success: false, error: 'Erro ao buscar clientes' };
  }
}

/**
 * Obter detalhes completos de um cliente
 */
export async function getClientDetails(clientId) {
  try {
    // Dados do perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', clientId)
      .single();

    if (profileError) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Dados de assinatura
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    // Conexões WhatsApp
    const { data: connections } = await supabaseAdmin
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', profile.user_id);

    // Notas do suporte
    const { data: notes } = await supabaseAdmin
      .from('support_notes')
      .select('*, support_users(full_name, role)')
      .eq('target_user_id', clientId)
      .order('created_at', { ascending: false });

    // Histórico de ações do suporte
    const { data: actionHistory } = await supabaseAdmin
      .from('support_actions_log')
      .select('*, support_users(full_name, role)')
      .eq('target_user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      success: true,
      client: {
        profile,
        subscription,
        connections: connections || [],
        notes: notes || [],
        actionHistory: actionHistory || []
      }
    };
  } catch (error) {
    console.error('Erro ao obter detalhes:', error);
    return { success: false, error: 'Erro ao obter detalhes do cliente' };
  }
}

// ====================================================================
// AÇÕES SOBRE CLIENTES
// ====================================================================

/**
 * Resetar email do cliente
 */
export async function resetClientEmail(supportUserId, clientId, newEmail, ipAddress, userAgent) {
  try {
    // Buscar dados atuais
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, user_id')
      .eq('id', clientId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    const oldEmail = profile.email;

    // Atualizar email no auth.users (Supabase Auth)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { email: newEmail }
    );

    if (authError) {
      return { success: false, error: 'Erro ao atualizar email no sistema de autenticação' };
    }

    // Atualizar email no user_profiles
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email: newEmail })
      .eq('id', clientId);

    if (profileError) {
      return { success: false, error: 'Erro ao atualizar perfil' };
    }

    // Registrar no log
    await logAction(
      supportUserId,
      clientId,
      'email_reset',
      `Email alterado de ${oldEmail} para ${newEmail}`,
      { email: oldEmail },
      { email: newEmail },
      ipAddress,
      userAgent
    );

    return { success: true, message: 'Email atualizado com sucesso' };
  } catch (error) {
    console.error('Erro ao resetar email:', error);
    return { success: false, error: 'Erro ao resetar email' };
  }
}

/**
 * Resetar senha do cliente
 */
export async function resetClientPassword(supportUserId, clientId, newPassword, ipAddress, userAgent) {
  try {
    // Buscar user_id
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, email')
      .eq('id', clientId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Atualizar senha no Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (authError) {
      return { success: false, error: 'Erro ao atualizar senha' };
    }

    // Registrar no log (sem salvar a senha!)
    await logAction(
      supportUserId,
      clientId,
      'password_reset',
      `Senha resetada para o cliente ${profile.email}`,
      null,
      null,
      ipAddress,
      userAgent
    );

    return { success: true, message: 'Senha atualizada com sucesso' };
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return { success: false, error: 'Erro ao resetar senha' };
  }
}

/**
 * Ativar plano manualmente (bypass)
 */
export async function activatePlan(supportUserId, clientId, planType, ipAddress, userAgent) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('id', clientId)
      .single();

    if (!profile) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Buscar ou criar subscription
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    const now = new Date();
    const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 dias

    if (existingSub) {
      // Atualizar existente
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'active',
          plan_type: planType,
          updated_at: now.toISOString()
        })
        .eq('user_id', profile.user_id);
    } else {
      // Criar nova
      await supabaseAdmin
        .from('user_subscriptions')
        .insert({
          user_id: profile.user_id,
          status: 'active',
          plan_type: planType,
          current_period_start: now.toISOString(),
          current_period_end: nextBilling.toISOString()
        });
    }

    // Registrar no log
    await logAction(
      supportUserId,
      clientId,
      'plan_activation',
      `Plano ${planType} ativado manualmente`,
      { status: existingSub?.status || 'none' },
      { status: 'active', plan_type: planType },
      ipAddress,
      userAgent
    );

    return { success: true, message: 'Plano ativado com sucesso' };
  } catch (error) {
    console.error('Erro ao ativar plano:', error);
    return { success: false, error: 'Erro ao ativar plano' };
  }
}

/**
 * Suspender conta
 */
export async function suspendAccount(supportUserId, clientId, reason, ipAddress, userAgent) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('id', clientId)
      .single();

    if (!profile) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Atualizar subscription
    await supabaseAdmin
      .from('user_subscriptions')
      .update({ status: 'suspended' })
      .eq('user_id', profile.user_id);

    // Registrar no log
    await logAction(
      supportUserId,
      clientId,
      'account_suspend',
      `Conta suspensa. Motivo: ${reason}`,
      { status: 'active' },
      { status: 'suspended', reason },
      ipAddress,
      userAgent
    );

    return { success: true, message: 'Conta suspensa com sucesso' };
  } catch (error) {
    console.error('Erro ao suspender conta:', error);
    return { success: false, error: 'Erro ao suspender conta' };
  }
}

/**
 * Reativar conta
 */
export async function reactivateAccount(supportUserId, clientId, ipAddress, userAgent) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('id', clientId)
      .single();

    if (!profile) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Atualizar subscription
    await supabaseAdmin
      .from('user_subscriptions')
      .update({ status: 'active' })
      .eq('user_id', profile.user_id);

    // Registrar no log
    await logAction(
      supportUserId,
      clientId,
      'account_reactivate',
      'Conta reativada',
      { status: 'suspended' },
      { status: 'active' },
      ipAddress,
      userAgent
    );

    return { success: true, message: 'Conta reativada com sucesso' };
  } catch (error) {
    console.error('Erro ao reativar conta:', error);
    return { success: false, error: 'Erro ao reativar conta' };
  }
}

// ====================================================================
// NOTAS DO SUPORTE
// ====================================================================

/**
 * Adicionar nota sobre cliente
 */
export async function addNote(supportUserId, clientId, note, isImportant = false) {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_notes')
      .insert({
        support_user_id: supportUserId,
        target_user_id: clientId,
        note,
        is_important: isImportant
      })
      .select('*, support_users(full_name, role)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, note: data };
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    return { success: false, error: 'Erro ao adicionar nota' };
  }
}

/**
 * Obter notas de um cliente
 */
export async function getClientNotes(clientId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_notes')
      .select('*, support_users(full_name, role)')
      .eq('target_user_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, notes: data };
  } catch (error) {
    console.error('Erro ao obter notas:', error);
    return { success: false, error: 'Erro ao obter notas' };
  }
}

// ====================================================================
// HISTÓRICO E LOGS
// ====================================================================

/**
 * Obter logs de ações
 */
export async function getActionLogs(filters = {}) {
  try {
    let query = supabaseAdmin
      .from('support_actions_log')
      .select('*, support_users(full_name, role), user_profiles(email, full_name)')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.supportUserId) {
      query = query.eq('support_user_id', filters.supportUserId);
    }
    if (filters.targetUserId) {
      query = query.eq('target_user_id', filters.targetUserId);
    }
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, logs: data };
  } catch (error) {
    console.error('Erro ao obter logs:', error);
    return { success: false, error: 'Erro ao obter logs' };
  }
}

/**
 * Buscar todos os tickets
 */
export async function getTickets(filters = {}) {
  try {
    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles(id, email, full_name, company_name),
        support_users(id, full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, tickets: data };
  } catch (error) {
    console.error('Erro ao buscar tickets:', error);
    return { success: false, error: 'Erro ao buscar tickets' };
  }
}

/**
 * Buscar detalhes de um ticket com respostas
 */
export async function getTicketDetails(ticketId) {
  try {
    // Buscar ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles(id, email, full_name, company_name, phone),
        support_users(id, full_name, email)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      return { success: false, error: 'Ticket não encontrado' };
    }

    // Buscar respostas
    const { data: responses } = await supabaseAdmin
      .from('support_ticket_responses')
      .select('*, support_users(full_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    return {
      success: true,
      ticket: {
        ...ticket,
        responses: responses || []
      }
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    return { success: false, error: 'Erro ao buscar detalhes do ticket' };
  }
}

/**
 * Criar ticket (para clientes)
 */
export async function createTicket(userId, subject, message, category = null) {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        message,
        category,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data };
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    return { success: false, error: 'Erro ao criar ticket' };
  }
}

/**
 * Atualizar status do ticket
 */
export async function updateTicketStatus(supportUserId, ticketId, status, assignTo = null) {
  try {
    const updates = { status };

    if (assignTo) {
      updates.assigned_to = assignTo;
    }

    if (status === 'resolved' || status === 'closed') {
      updates.resolved_by = supportUserId;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data };
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return { success: false, error: 'Erro ao atualizar status' };
  }
}

/**
 * Adicionar resposta ao ticket
 */
export async function addTicketResponse(supportUserId, ticketId, message, isInternalNote = false) {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_ticket_responses')
      .insert({
        ticket_id: ticketId,
        support_user_id: supportUserId,
        message,
        is_internal_note: isInternalNote
      })
      .select('*, support_users(full_name, email)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Se não for nota interna, atualizar status do ticket para "in_progress"
    if (!isInternalNote) {
      await supabaseAdmin
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId);
    }

    return { success: true, response: data };
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    return { success: false, error: 'Erro ao adicionar resposta' };
  }
}

/**
 * Obter estatísticas de tickets
 */
export async function getTicketStats() {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('count_tickets_by_status');

    if (error) {
      return { success: false, error: error.message };
    }

    const stats = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      total: 0
    };

    data.forEach(item => {
      stats[item.status] = parseInt(item.count);
      stats.total += parseInt(item.count);
    });

    return { success: true, stats };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { success: false, error: 'Erro ao buscar estatísticas' };
  }
}

export { logAction };

