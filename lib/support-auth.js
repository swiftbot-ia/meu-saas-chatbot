// ====================================================================
// lib/support-auth.js - VERSÃO SIMPLIFICADA (SEM support_sessions)
// Funções de autenticação para o sistema de suporte interno
// ====================================================================

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Lazy initialization to avoid build-time errors
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseAdmin;
}

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
    console.log('🔐 Tentando login:', email);

    // Buscar usuário
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('support_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', userError);
      return { success: false, error: 'Credenciais inválidas' };
    }

    console.log('✅ Usuário encontrado:', user.full_name);

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.error('❌ Senha incorreta');
      return { success: false, error: 'Credenciais inválidas' };
    }

    console.log('✅ Senha correta');

    // Gerar token de sessão (usando o ID do usuário diretamente)
    const token = user.id; // ← SIMPLIFICADO: usa o ID do usuário como token

    console.log('✅ Token gerado:', token);

    // Atualizar último login
    await getSupabaseAdmin()
      .from('support_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    console.log('✅ Login bem-sucedido!');

    // Retornar dados do usuário (sem senha)
    const { password_hash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token
    };

  } catch (error) {
    console.error('❌ Erro no login:', error);
    return { success: false, error: 'Erro interno no servidor' };
  }
}

/**
 * Logout - remover cookie
 */
export async function logoutSupport() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
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

    // Token é o ID do usuário
    const { data: user, error } = await getSupabaseAdmin()
      .from('support_users')
      .select('*')
      .eq('id', token)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return { valid: false, error: 'Sessão inválida' };
    }

    // Retornar usuário sem senha
    const { password_hash, ...userWithoutPassword } = user;

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

    const { data, error } = await getSupabaseAdmin()
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

    const { data, error } = await getSupabaseAdmin()
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
    const { error } = await getSupabaseAdmin()
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

// Export getSupabaseAdmin for use in other modules
export { getSupabaseAdmin };