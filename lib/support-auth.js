// ====================================================================
// lib/support-auth.js
// Funções de autenticação para o sistema de suporte interno
// ====================================================================

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente Supabase com service_role key (acesso total)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ====================================================================
// CONSTANTES
// ====================================================================
const COOKIE_NAME = 'support_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// ====================================================================
// AUTENTICAÇÃO
// ====================================================================

/**
 * Login do usuário de suporte
 */
export async function loginSupport(email, password, ipAddress, userAgent) {
  try {
    // Buscar usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('support_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Credenciais inválidas' };
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Credenciais inválidas' };
    }

    // Gerar token de sessão
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    // Criar sessão no banco
    const { error: sessionError } = await supabaseAdmin
      .from('support_sessions')
      .insert({
        support_user_id: user.id,
        token,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      return { success: false, error: 'Erro ao criar sessão' };
    }

    // Atualizar último login
    await supabaseAdmin
      .from('support_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Retornar dados do usuário (sem senha)
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
      expiresAt
    };

  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

/**
 * Logout - remover sessão
 */
export async function logoutSupport(token) {
  try {
    await supabaseAdmin
      .from('support_sessions')
      .delete()
      .eq('token', token);

    return { success: true };
  } catch (error) {
    console.error('Erro no logout:', error);
    return { success: false, error: 'Erro ao fazer logout' };
  }
}

/**
 * Validar sessão e retornar usuário
 */
export async function validateSession(token) {
  try {
    if (!token) {
      return { valid: false, error: 'Token não fornecido' };
    }

    // Buscar sessão
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('support_sessions')
      .select('*, support_users(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return { valid: false, error: 'Sessão inválida ou expirada' };
    }

    // Verificar se usuário está ativo
    if (!session.support_users.is_active) {
      return { valid: false, error: 'Usuário desativado' };
    }

    // Retornar usuário sem senha
    const { password_hash, ...userWithoutPassword } = session.support_users;

    return {
      valid: true,
      user: userWithoutPassword
    };

  } catch (error) {
    console.error('Erro na validação:', error);
    return { valid: false, error: 'Erro ao validar sessão' };
  }
}

/**
 * Obter sessão atual do cookie
 */
export async function getCurrentSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!token) {
      return null;
    }

    const result = await validateSession(token);
    if (!result.valid) {
      return null;
    }

    return { token, user: result.user };
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Verificar permissão por role
 */
export function hasPermission(user, requiredRoles) {
  if (!user || !user.role) return false;
  
  const roleHierarchy = {
    admin: 3,
    gerente: 2,
    suporte: 1
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = Math.max(...requiredRoles.map(r => roleHierarchy[r] || 0));

  return userLevel >= requiredLevel;
}

// ====================================================================
// GERENCIAMENTO DE USUÁRIOS
// ====================================================================

/**
 * Criar novo usuário de suporte
 */
export async function createSupportUser(creatorId, userData) {
  try {
    // Hash da senha
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const { data, error } = await supabaseAdmin
      .from('support_users')
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        full_name: userData.full_name,
        role: userData.role,
        created_by: creatorId
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Remover senha do retorno
    const { password_hash, ...userWithoutPassword } = data;

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error: 'Erro ao criar usuário' };
  }
}

/**
 * Atualizar usuário de suporte
 */
export async function updateSupportUser(userId, updates) {
  try {
    // Se tem senha, fazer hash
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const { data, error } = await supabaseAdmin
      .from('support_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const { password_hash, ...userWithoutPassword } = data;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return { success: false, error: 'Erro ao atualizar usuário' };
  }
}

/**
 * Deletar usuário de suporte
 */
export async function deleteSupportUser(userId) {
  try {
    // Remover todas as sessões do usuário
    await supabaseAdmin
      .from('support_sessions')
      .delete()
      .eq('support_user_id', userId);

    // Deletar usuário
    const { error } = await supabaseAdmin
      .from('support_users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return { success: false, error: 'Erro ao deletar usuário' };
  }
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================

/**
 * Gerar token aleatório
 */
function generateToken() {
  return Array.from({ length: 64 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
}

/**
 * Limpar sessões expiradas
 */
export async function cleanupExpiredSessions() {
  try {
    await supabaseAdmin
      .from('support_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
  }
}

// Export do supabaseAdmin para uso em outros módulos
export { supabaseAdmin };