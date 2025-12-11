// =============================================================================
// Account Service - Multi-User Team Management
// =============================================================================
// This service handles all operations related to accounts and team members
// =============================================================================

import { supabaseAdmin } from './supabase/server.js'

// =============================================================================
// ACCOUNT FUNCTIONS
// =============================================================================

/**
 * Get account for a user
 * Returns the account that the user belongs to
 * @param {string} userId - User ID
 * @returns {Promise<{id: string, owner_user_id: string, name: string, max_members: number, userRole: string} | null>}
 */
export async function getAccountForUser(userId) {
    if (!userId) {
        console.log('⚠️ [AccountService] getAccountForUser called with no userId')
        return null
    }

    console.log('🔍 [AccountService] Looking up account for user:', userId)

    // Step 1: Find user's membership
    const { data: membership, error: memberError } = await supabaseAdmin
        .from('account_members')
        .select('account_id, role')
        .eq('user_id', userId)
        .single()

    if (memberError) {
        console.log('⚠️ [AccountService] No membership found for user:', userId, memberError.message)
        return null
    }

    if (!membership) {
        console.log('⚠️ [AccountService] Membership is null for user:', userId)
        return null
    }

    console.log('✅ [AccountService] Found membership:', { accountId: membership.account_id, role: membership.role })

    // Step 2: Get account details
    const { data: account, error: accountError } = await supabaseAdmin
        .from('accounts')
        .select('id, owner_user_id, name, max_members')
        .eq('id', membership.account_id)
        .single()

    if (accountError || !account) {
        console.log('⚠️ [AccountService] Account not found:', membership.account_id, accountError?.message)
        return null
    }

    console.log('✅ [AccountService] Found account:', { id: account.id, name: account.name })

    return {
        ...account,
        userRole: membership.role
    }
}

/**
 * Get account by owner user ID
 * @param {string} ownerUserId - Owner user ID
 * @returns {Promise<object | null>}
 */
export async function getAccountByOwner(ownerUserId) {
    if (!ownerUserId) return null

    const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .single()

    if (error) {
        console.error('❌ [AccountService] Error getting account by owner:', error)
        return null
    }

    return data
}

/**
 * Check if user is the account owner
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>}
 */
export async function isAccountOwner(userId) {
    if (!userId) return false

    const { data, error } = await supabaseAdmin
        .from('account_members')
        .select('role')
        .eq('user_id', userId)
        .single()

    if (error || !data) return false

    return data.role === 'owner'
}

/**
 * Get the owner user ID for a given account
 * @param {string} accountId - Account ID
 * @returns {Promise<string | null>}
 */
export async function getAccountOwnerUserId(accountId) {
    if (!accountId) return null

    const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('owner_user_id')
        .eq('id', accountId)
        .single()

    if (error || !data) return null

    return data.owner_user_id
}

// =============================================================================
// MEMBER FUNCTIONS
// =============================================================================

/**
 * Get all members of an account
 * @param {string} accountId - Account ID
 * @returns {Promise<Array>}
 */
export async function getAccountMembers(accountId) {
    if (!accountId) {
        console.log('⚠️ [AccountService] getAccountMembers called with no accountId')
        return []
    }

    console.log('📋 [AccountService] Getting members for account:', accountId)

    // First, get the account_members
    const { data: members, error: membersError } = await supabaseAdmin
        .from('account_members')
        .select('id, user_id, role, invited_by, invited_at, must_reset_password')
        .eq('account_id', accountId)
        .order('role', { ascending: false }) // owner first
        .order('invited_at', { ascending: true })

    if (membersError) {
        console.error('❌ [AccountService] Error getting members:', membersError)
        return []
    }

    if (!members || members.length === 0) {
        console.log('⚠️ [AccountService] No members found for account:', accountId)
        return []
    }

    console.log('📋 [AccountService] Found', members.length, 'members')

    // Get user profiles for each member
    const memberIds = members.map(m => m.user_id)

    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', memberIds)

    if (profilesError) {
        console.error('❌ [AccountService] Error getting profiles:', profilesError)
    }

    // Create a map for quick lookup
    const profileMap = {}
    if (profiles) {
        profiles.forEach(p => {
            profileMap[p.user_id] = p
        })
    }

    // Get emails from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    const emailMap = {}
    if (authUsers?.users) {
        authUsers.users.forEach(u => {
            emailMap[u.id] = u.email
        })
    }

    // Combine the data
    return members.map(member => ({
        id: member.id,
        userId: member.user_id,
        role: member.role,
        invitedBy: member.invited_by,
        invitedAt: member.invited_at,
        mustResetPassword: member.must_reset_password,
        fullName: profileMap[member.user_id]?.full_name || 'Sem nome',
        email: emailMap[member.user_id] || '',
        avatarUrl: profileMap[member.user_id]?.avatar_url || null
    }))
}

/**
 * Get member count for an account
 * @param {string} accountId - Account ID
 * @returns {Promise<number>}
 */
export async function getMemberCount(accountId) {
    if (!accountId) return 0

    const { count, error } = await supabaseAdmin
        .from('account_members')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)

    if (error) {
        console.error('❌ [AccountService] Error counting members:', error)
        return 0
    }

    return count || 0
}

/**
 * Create a new team member
 * Creates user in Supabase Auth and adds to account_members
 * @param {string} accountId - Account ID
 * @param {string} email - Member email
 * @param {string} password - Temporary password
 * @param {string} fullName - Member full name
 * @param {string} invitedBy - User ID of who invited
 * @returns {Promise<{success: boolean, member?: object, error?: string}>}
 */
export async function createMember(accountId, email, password, fullName, invitedBy) {
    if (!accountId || !email || !password || !fullName) {
        return { success: false, error: 'Dados obrigatórios faltando' }
    }

    // Check member limit
    const account = await getAccountByAccountId(accountId)
    if (!account) {
        return { success: false, error: 'Conta não encontrada' }
    }

    const currentCount = await getMemberCount(accountId)
    if (currentCount >= account.max_members) {
        return { success: false, error: `Limite de ${account.max_members} membros atingido` }
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUser?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
    if (emailExists) {
        return { success: false, error: 'Este email já está em uso' }
    }

    try {
        // 1. Create user in Supabase Auth
        // Note: This will trigger auto_create_account_for_user which creates a separate account
        // We'll need to clean that up after
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                must_reset_password: true
            }
        })

        if (authError) {
            console.error('❌ [AccountService] Error creating auth user:', authError)
            return { success: false, error: authError.message }
        }

        const newUserId = authData.user.id

        // 2. Clean up the auto-created account and membership
        // The trigger auto_create_account_for_user creates an account for every new user
        // We need to remove that and add the user to the team's account instead
        const { data: autoCreatedAccount } = await supabaseAdmin
            .from('accounts')
            .select('id')
            .eq('owner_user_id', newUserId)
            .single()

        if (autoCreatedAccount) {
            // Delete the auto-created membership first
            await supabaseAdmin
                .from('account_members')
                .delete()
                .eq('account_id', autoCreatedAccount.id)
                .eq('user_id', newUserId)

            // Delete the auto-created account
            await supabaseAdmin
                .from('accounts')
                .delete()
                .eq('id', autoCreatedAccount.id)

            console.log('🧹 [AccountService] Cleaned up auto-created account for member')
        }

        // 3. Create or update user_profile
        // Using upsert because Supabase might auto-create profiles via trigger
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                user_id: newUserId,
                full_name: fullName
            }, {
                onConflict: 'user_id'
            })

        if (profileError) {
            console.error('❌ [AccountService] Error creating profile:', profileError)
            // Cleanup: delete auth user if profile creation failed
            await supabaseAdmin.auth.admin.deleteUser(newUserId)
            return { success: false, error: 'Erro ao criar perfil do usuário' }
        }

        // 4. Add to team's account_members as 'member'
        const { data: memberData, error: memberError } = await supabaseAdmin
            .from('account_members')
            .insert({
                account_id: accountId,
                user_id: newUserId,
                role: 'member',
                invited_by: invitedBy,
                must_reset_password: true
            })
            .select()
            .single()

        if (memberError) {
            console.error('❌ [AccountService] Error adding member:', memberError)
            // Cleanup
            await supabaseAdmin.auth.admin.deleteUser(newUserId)
            return { success: false, error: 'Erro ao adicionar membro à equipe' }
        }

        console.log('✅ [AccountService] Member created successfully:', newUserId)

        return {
            success: true,
            member: {
                id: memberData.id,
                userId: newUserId,
                email: email.toLowerCase().trim(),
                fullName,
                role: 'member',
                mustResetPassword: true
            }
        }
    } catch (error) {
        console.error('❌ [AccountService] Unexpected error creating member:', error)
        return { success: false, error: 'Erro inesperado ao criar membro' }
    }
}

/**
 * Remove a member from an account
 * @param {string} accountId - Account ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeMember(accountId, userId) {
    if (!accountId || !userId) {
        return { success: false, error: 'Dados obrigatórios faltando' }
    }

    // Check if user is owner (can't remove owner)
    const { data: member } = await supabaseAdmin
        .from('account_members')
        .select('role')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .single()

    if (!member) {
        return { success: false, error: 'Membro não encontrado' }
    }

    if (member.role === 'owner') {
        return { success: false, error: 'Não é possível remover o proprietário da conta' }
    }

    // Remove from account_members
    const { error: removeError } = await supabaseAdmin
        .from('account_members')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', userId)

    if (removeError) {
        console.error('❌ [AccountService] Error removing member:', removeError)
        return { success: false, error: 'Erro ao remover membro' }
    }

    // Optionally: Delete the user from auth and profile
    // For now, we just remove from the team but keep the user
    // This allows them to potentially join another team later

    console.log('✅ [AccountService] Member removed:', userId)

    return { success: true }
}

/**
 * Get member role in an account
 * @param {string} accountId - Account ID
 * @param {string} userId - User ID
 * @returns {Promise<string | null>}
 */
export async function getMemberRole(accountId, userId) {
    if (!accountId || !userId) return null

    const { data, error } = await supabaseAdmin
        .from('account_members')
        .select('role')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .single()

    if (error || !data) return null

    return data.role
}

/**
 * Check if user must reset password
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function mustResetPassword(userId) {
    if (!userId) return false

    const { data, error } = await supabaseAdmin
        .from('account_members')
        .select('must_reset_password')
        .eq('user_id', userId)
        .single()

    if (error || !data) return false

    return data.must_reset_password === true
}

/**
 * Clear the must_reset_password flag (after user resets password)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function clearMustResetPassword(userId) {
    if (!userId) return false

    const { error } = await supabaseAdmin
        .from('account_members')
        .update({ must_reset_password: false })
        .eq('user_id', userId)

    if (error) {
        console.error('❌ [AccountService] Error clearing reset flag:', error)
        return false
    }

    return true
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get account by account ID
 * @param {string} accountId - Account ID
 * @returns {Promise<object | null>}
 */
async function getAccountByAccountId(accountId) {
    if (!accountId) return null

    const { data, error } = await supabaseAdmin
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single()

    if (error) return null

    return data
}

/**
 * Create account for new user (called during signup)
 * @param {string} userId - User ID
 * @param {string} name - Account name (usually company name)
 * @returns {Promise<{success: boolean, account?: object, error?: string}>}
 */
export async function createAccountForUser(userId, name = 'Minha Conta') {
    if (!userId) {
        return { success: false, error: 'User ID é obrigatório' }
    }

    // Check if account already exists
    const existingAccount = await getAccountByOwner(userId)
    if (existingAccount) {
        return { success: true, account: existingAccount }
    }

    try {
        // 1. Create account
        const { data: account, error: accountError } = await supabaseAdmin
            .from('accounts')
            .insert({
                owner_user_id: userId,
                name
            })
            .select()
            .single()

        if (accountError) {
            console.error('❌ [AccountService] Error creating account:', accountError)
            return { success: false, error: 'Erro ao criar conta' }
        }

        // 2. Add owner as member
        const { error: memberError } = await supabaseAdmin
            .from('account_members')
            .insert({
                account_id: account.id,
                user_id: userId,
                role: 'owner',
                must_reset_password: false
            })

        if (memberError) {
            console.error('❌ [AccountService] Error adding owner as member:', memberError)
            // Cleanup
            await supabaseAdmin.from('accounts').delete().eq('id', account.id)
            return { success: false, error: 'Erro ao configurar conta' }
        }

        console.log('✅ [AccountService] Account created for user:', userId)

        return { success: true, account }
    } catch (error) {
        console.error('❌ [AccountService] Unexpected error creating account:', error)
        return { success: false, error: 'Erro inesperado' }
    }
}

/**
 * Get owner user ID from any account member's user ID
 * Useful for filtering data - always filter by owner's user_id
 * @param {string} userId - Any user's ID (could be owner or member)
 * @returns {Promise<string | null>} Owner's user ID (or original userId as fallback)
 */
export async function getOwnerUserIdFromMember(userId) {
    if (!userId) return null

    const account = await getAccountForUser(userId)

    // If no account found, return the original userId as fallback
    // This ensures that users without account entries still work with their own data
    if (!account) {
        console.log('⚠️ [AccountService] No account found for user, using userId as fallback:', userId)
        return userId
    }

    return account.owner_user_id
}

