// =============================================================================
// Custom Hook: useAccount
// =============================================================================
// Hook to get current user's account information and role
// =============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'

/**
 * Hook to get current user's account information
 * @returns {{
 *   account: object | null,
 *   role: 'owner' | 'member' | null,
 *   isOwner: boolean,
 *   loading: boolean,
 *   error: string | null,
 *   mustResetPassword: boolean,
 *   refresh: () => Promise<void>
 * }}
 */
export function useAccount() {
    const [account, setAccount] = useState(null)
    const [role, setRole] = useState(null)
    const [mustResetPassword, setMustResetPassword] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAccountInfo = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Get account membership
            const { data: membership, error: memberError } = await supabase
                .from('account_members')
                .select(`
          role,
          must_reset_password,
          accounts (
            id,
            owner_user_id,
            name,
            max_members
          )
        `)
                .eq('user_id', user.id)
                .single()

            if (memberError) {
                // Table might not exist yet
                console.log('⚠️ [useAccount] Could not fetch account info:', memberError.message)
                setLoading(false)
                return
            }

            setAccount(membership.accounts)
            setRole(membership.role)
            setMustResetPassword(membership.must_reset_password || false)

        } catch (err) {
            console.error('❌ [useAccount] Error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccountInfo()
    }, [])

    return {
        account,
        role,
        isOwner: role === 'owner',
        isMember: role === 'member',
        mustResetPassword,
        loading,
        error,
        refresh: fetchAccountInfo
    }
}

export default useAccount
