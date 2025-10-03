// app/auth/callback/route.js
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase'
import { cookies } from 'next/headers'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('=== CALLBACK DEBUG ===')
  console.log('Code present:', !!code)

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerSupabaseClient(cookieStore)

      console.log('Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Exchange error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
      }

      console.log('Auth success! User ID:', data.user?.id)

      // ✅ CRIAR OU VERIFICAR PERFIL COMPLETO (incluindo telefone)
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_name, full_name, phone')
        .eq('user_id', data.user.id)
        .single()

      console.log('Profile check:', { profile, profileError })

      // ✅ SE NÃO EXISTE PERFIL, CRIAR COM DADOS DO AUTH
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Creating profile from auth metadata...')
        
        const newProfile = {
          user_id: data.user.id,
          full_name: data.user.user_metadata?.full_name || '',
          company_name: data.user.user_metadata?.company_name || '',
          phone: data.user.user_metadata?.phone || '', // ✅ TELEFONE DOS METADADOS
          email: data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          console.log('Profile created successfully')
          profile = createdProfile
        }
      }

      // ✅ VERIFICAR SE PRECISA COMPLETAR PERFIL (incluindo telefone)
      const needsCompletion = !profile || 
                             !profile.company_name || 
                             profile.company_name.trim() === '' ||
                             !profile.full_name ||
                             profile.full_name.trim() === '' ||
                             !profile.phone || // ✅ VERIFICAR TELEFONE TAMBÉM
                             profile.phone.trim() === ''

      console.log('Needs completion:', needsCompletion, {
        hasCompanyName: !!profile?.company_name,
        hasFullName: !!profile?.full_name,
        hasPhone: !!profile?.phone
      })

      if (needsCompletion) {
        console.log('Redirecting to complete-profile')
        return NextResponse.redirect(`${origin}/complete-profile`)
      }

      console.log('Profile complete - redirecting to dashboard')
      return NextResponse.redirect(`${origin}/dashboard`)

    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(`${origin}/login?error=processing_failed`)
    }
  }

  console.log('No code parameter found')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}