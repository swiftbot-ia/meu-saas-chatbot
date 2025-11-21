'use client'
import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // const router = useRouter()
  
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    const consent = localStorage.getItem('swiftbot_cookie_consent')
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      try {
        const saved = JSON.parse(consent)
        setPreferences(saved.preferences)
      } catch (e) {
        console.error('Erro ao carregar preferências:', e)
      }
    }
  }, [])

  const saveConsent = (prefs) => {
    const consentData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      preferences: prefs
    }
    localStorage.setItem('swiftbot_cookie_consent', JSON.stringify(consentData))
    setShowBanner(false)
    setShowSettings(false)
    applyPreferences(prefs)
  }

  const applyPreferences = (prefs) => {
    if (!prefs.analytics) {
      console.log('Analytics desabilitado pelo usuário')
    }
    if (!prefs.marketing) {
      console.log('Cookies de marketing desabilitados pelo usuário')
    }
  }

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    })
  }

  const acceptNecessary = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    })
  }

  const saveCustomPreferences = () => {
    saveConsent(preferences)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
      
      {/* MODIFICADO: Banner Principal - Estilo "Pílula" como o Header */}
      {!showSettings ? (
<div className="fixed bottom-4 md:bottom-6 inset-x-0 z-[9999] px-4 animate-slide-up">
    <div 
      className="rounded-full shadow-2xl w-full max-w-5xl mx-auto p-4 flex items-center justify-between gap-4"
      style={{ backgroundColor: '#272727' }} 
    >
            {/* Lado Esquerdo: Texto */}
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed px-4 hidden sm:block">
              Nós usamos cookies para melhorar sua experiência e garantir a segurança. 
              <a href="/cookies" className="hover:text-[#00FF99] transition-colors underline ml-1">Saiba mais</a>.
            </p>
            {/* Texto curto para mobile */}
            <p className="text-gray-300 text-sm leading-relaxed px-2 sm:hidden">
              Nós usamos cookies.
            </p>
            
            {/* Lado Direito: Botões (estilo links + CTA) */}
            <div className="flex-shrink-0 flex items-center gap-3 md:gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="text-white font-medium transition-colors duration-300 hover:opacity-70 text-sm"
              >
                Personalizar
              </button>
              <button
                onClick={acceptNecessary} // Botão de "Rejeitar"
                className="text-white font-medium transition-colors duration-300 hover:opacity-70 text-sm hidden md:block"
              >
                Rejeitar
              </button>
              <button
                onClick={acceptAll}
                className="bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-2 px-5 rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.4)] transition-all duration-300 text-sm"
              >
                Aceitar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* MODIFICADO: Modal de Configurações - Estilo "Clean" sem bordas */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-[#111111] rounded-2xl shadow-2xl">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-[#111111] border-b border-[#333333] p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" /></svg>
                 Centro de Preferências
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#272727] rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              {/* Cookies Necessários */}
              <div className="bg-[#0A0A0A] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Cookies Essenciais
                      <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">
                        SEMPRE ATIVO
                      </span>
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Essenciais para o funcionamento do site. Incluem autenticação e segurança.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-[#00FF99] rounded-full relative cursor-not-allowed opacity-60">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookies Funcionais */}
              <div className="bg-[#0A0A0A] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774a1.125 1.125 0 01.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.108 1.204l.527.738c.313.436.337.996.12 1.45l-.773.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.204-.108-.397.165-.71.505-.78.93l-.15.893c-.09.543-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.855-.142-1.205.108l-.737.527a1.125 1.125 0 01-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.893-.15c-.543-.09-.94-.56-.94-1.11v-1.093c0-.55.397-1.02.94-1.11l.893-.149c.425-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.527-.738a1.125 1.125 0 01-.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.806.272 1.204.108.397-.165.71.505.78-.93l.15-.893zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>
                      Cookies Funcionais
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Permitem funcionalidades aprimoradas como lembrar suas preferências.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({...preferences, functional: !preferences.functional})}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                        preferences.functional ? 'bg-[#00FF99]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-300 ${
                        preferences.functional ? 'right-1 translate-x-0' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cookies de Analytics */}
              <div className="bg-[#0A0A0A] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V5.25A2.25 2.25 0 0018 3H6A2.25 2.25 0 003.75 5.25v12.75A2.25 2.25 0 006 20.25z" /></svg>
                       Cookies de Análise
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Nos ajudam a entender como você usa o site. Todos os dados são anônimos.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                        preferences.analytics ? 'bg-[#00FF99]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-300 ${
                        preferences.analytics ? 'right-1 translate-x-0' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cookies de Marketing */}
              <div className="bg-[#0A0A0A] rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      Cookies de Marketing
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Usados para criar perfil e mostrar anúncios relevantes.
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
                        preferences.marketing ? 'bg-[#00FF99]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-300 ${
                        preferences.marketing ? 'right-1 translate-x-0' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="sticky bottom-0 bg-[#111111] border-t border-[#333333] p-6 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={saveCustomPreferences}
                  className="flex-1 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,153,0.4)]"
                >
                  Salvar Preferências
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="sm:w-32 bg-[#272727] hover:bg-[#333333] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div> 
      )}
    </>
  )
}