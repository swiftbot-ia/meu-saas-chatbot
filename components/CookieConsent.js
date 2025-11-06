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
      
      {/* Banner Principal - 40% MENOR + FUNDO PRETO */}
      {!showSettings ? (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-slide-up">
          <div className="max-w-4xl mx-auto bg-black/90 backdrop-blur-xl border-2 border-[#04F5A0]/30 rounded-2xl shadow-2xl p-6">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#04F5A0]/10 via-transparent to-[#04F5A0]/10 rounded-2xl blur-xl opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-start mb-4">
                <div className="text-3xl mr-3">🍪</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    Sua Privacidade é Importante
                    <span className="ml-2 text-xs bg-[#04F5A0]/20 text-[#04F5A0] px-2 py-1 rounded-full border border-[#04F5A0]/30">
                      LGPD
                    </span>
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, personalizar conteúdo e processar pagamentos de forma segura. 
                    Ao clicar em "Aceitar Todos", você concorda com o uso de TODOS os cookies.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={acceptAll}
                  className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 text-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aceitar Todos
                </button>
                
                <button
                  onClick={acceptNecessary}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-gray-700 text-sm"
                >
                  Apenas Necessários
                </button>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 bg-transparent hover:bg-white/5 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-white/20 hover:border-[#04F5A0]/50 text-sm"
                >
                  ⚙️ Personalizar
                </button>
              </div>

              <div className="text-center text-xs text-gray-400 mt-3">
                <button
                  onClick={() => window.location.href = '/cookies'}
                  className="hover:text-[#04F5A0] transition-colors underline"
                >
                  Política de Cookies
                </button>
                <span className="mx-2">•</span>
                <button
                  onClick={() => window.location.href = '/privacidade'}
                  className="hover:text-[#04F5A0] transition-colors underline"
                >
                  Política de Privacidade
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modal de Configurações - FUNDO PRETO */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-2 border-[#04F5A0]/30 rounded-2xl shadow-2xl">
            <div className="sticky top-0 bg-black/95 border-b border-white/10 p-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-2">🔒</span>
                  Centro de Preferências
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Cookies Necessários */}
              <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                      <span className="mr-2">🔐</span>
                      Cookies Essenciais
                      <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                        SEMPRE ATIVO
                      </span>
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Essenciais para o funcionamento do site. Incluem autenticação e segurança.
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-[#04F5A0] rounded-full relative cursor-not-allowed opacity-60">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookies Funcionais */}
              <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                      <span className="mr-2">⚙️</span>
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
                        preferences.functional ? 'bg-[#04F5A0]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        preferences.functional ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cookies de Analytics */}
              <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                      <span className="mr-2">📊</span>
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
                        preferences.analytics ? 'bg-[#04F5A0]' : 'bg-gray-600'
                      }`}
                    >
                      {/* O 's' solto estava aqui e foi removido */}
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        preferences.analytics ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cookies de Marketing */}
              <div className="bg-gray-900/50 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                      <span className="mr-2">📢</span>
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
                        preferences.marketing ? 'bg-[#04F5A0]' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        preferences.marketing ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="sticky bottom-0 bg-black/95 border-t border-white/10 p-4 rounded-b-2xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={saveCustomPreferences}
                  className="flex-1 bg-[#04F5A0] hover:bg-[#03E691] text-black font-bold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  💾 Salvar Preferências
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="sm:w-32 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
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