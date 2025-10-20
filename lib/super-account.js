import { createClient } from '@/utils/supabase/server';

/**
 * Verifica se o usuário atual é uma super conta
 * @returns {Promise<boolean>}
 */
export async function isSuperAccount() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_account')
      .eq('user_id', user.id)
      .single();

    return profile?.is_super_account === true;
  } catch (error) {
    console.error('Error checking super account:', error);
    return false;
  }
}

/**
 * Middleware para verificar super account
 * Retorna o user_id se for super account, null caso contrário
 */
export async function getSuperAccountUserId() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_super_account')
      .eq('user_id', user.id)
      .single();

    return profile?.is_super_account ? user.id : null;
  } catch (error) {
    return null;
  }
}

/**
 * Bypass de validações para super accounts
 */
export async function bypassValidations() {
  const isSuper = await isSuperAccount();
  
  return {
    isSuper,
    skipPayment: isSuper,
    skipConnectionLimit: isSuper,
    skipTrialCheck: isSuper,
    unlimitedConnections: isSuper
  };
}