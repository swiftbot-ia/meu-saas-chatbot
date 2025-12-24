'use client'
// app/auth/callback/page.js
// Página cliente para capturar tokens do fluxo Implicit OAuth
// O hash (#access_token=...) não é enviado ao servidor, então precisa de JS no cliente

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'
import { getUtmFromStorage, clearUtmFromStorage } from '@/lib/utmUtils'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Processando login...')

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // O Supabase detecta automaticamente os tokens no hash da URL
                // quando detectSessionInUrl: true está configurado
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Erro ao obter sessão:', error)
                    setStatus('Erro no login. Redirecionando...')
                    setTimeout(() => router.push('/login?error=auth-error'), 2000)
                    return
                }

                if (session) {
                    console.log('✅ Sessão obtida com sucesso!')

                    // Verificar perfil do usuário
                    const { data: profile, error: profileError } = await supabase
                        .from('user_profiles')
                        .select('company_name, full_name, phone')
                        .eq('user_id', session.user.id)
                        .single()

                    // Criar perfil se não existir
                    if (profileError && profileError.code === 'PGRST116') {
                        // Captura UTMs do localStorage (salvos quando visitou /login)
                        const utmData = getUtmFromStorage() || {}

                        await supabase
                            .from('user_profiles')
                            .insert([{
                                user_id: session.user.id,
                                full_name: session.user.user_metadata?.full_name || '',
                                company_name: '',
                                phone: '',
                                email: session.user.email,
                                avatar_url: session.user.user_metadata?.avatar_url || '',
                                // Salva UTMs para rastrear origem do usuário
                                utm_source: utmData.utm_source || null,
                                utm_medium: utmData.utm_medium || null,
                                utm_campaign: utmData.utm_campaign || null,
                                utm_term: utmData.utm_term || null,
                                utm_content: utmData.utm_content || null,
                                registered_from: 'social_login',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }])

                        // Limpa UTMs do storage após salvar
                        clearUtmFromStorage()

                        setStatus('Primeiro acesso! Redirecionando para completar perfil...')
                        setTimeout(() => router.push('/complete-profile'), 1000)
                        return
                    }

                    // Verificar se precisa completar cadastro
                    const needsCompletion = !profile ||
                        !profile.company_name ||
                        !profile.full_name ||
                        !profile.phone

                    if (needsCompletion) {
                        setStatus('Complete seu perfil para continuar...')
                        setTimeout(() => router.push('/complete-profile'), 1000)
                        return
                    }

                    // Tudo OK - ir para dashboard
                    setStatus('Login realizado! Redirecionando...')
                    setTimeout(() => router.push('/dashboard'), 1000)
                } else {
                    // Sem sessão - pode ser que ainda está processando
                    // Aguardar um pouco e tentar novamente
                    setTimeout(async () => {
                        const { data: { session: retrySession } } = await supabase.auth.getSession()
                        if (retrySession) {
                            router.push('/dashboard')
                        } else {
                            setStatus('Sessão não encontrada. Redirecionando para login...')
                            setTimeout(() => router.push('/login'), 2000)
                        }
                    }, 1000)
                }
            } catch (err) {
                console.error('Erro no callback:', err)
                setStatus('Erro inesperado. Redirecionando...')
                setTimeout(() => router.push('/login?error=unexpected'), 2000)
            }
        }

        handleCallback()
    }, [router])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #333',
                borderTopColor: '#22c55e',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px'
            }} />
            <p style={{ fontSize: '16px', fontWeight: '500', letterSpacing: '-0.01em' }}>{status}</p>
            <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
