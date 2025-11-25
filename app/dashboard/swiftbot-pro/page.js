'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

// ==================================================================================
// SWIFTBOT PRO - Interface de Chat com IA
// ==================================================================================

export default function SwiftbotProPage() {
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Estados
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatStarted, setChatStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Sugestões de prompts
  const suggestions = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      text: 'Gerar script de vendas',
      prompt: 'Gere um script de vendas persuasivo para meu produto, considerando as principais objeções dos clientes.'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      text: 'Principais objeções',
      prompt: 'Quais são as principais objeções que meus clientes podem ter e como devo respondê-las?'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      ),
      text: 'Sugestões de Copy',
      prompt: 'Sugira textos de copy para mensagens de WhatsApp que convertem bem.'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
      ),
      text: 'Oportunidades',
      prompt: 'Analise meu negócio e sugira oportunidades de crescimento e melhoria no atendimento.'
    }
  ]

  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Verificar usuário
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Simular resposta da IA
  const simulateAIResponse = async (userMessage) => {
    setIsTyping(true)

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Respostas mock baseadas no tipo de pergunta
    let aiResponse = ''

    if (userMessage.toLowerCase().includes('script') || userMessage.toLowerCase().includes('vendas')) {
      aiResponse = `**Script de Vendas Sugerido:**

1. **Abertura:** "Olá! Vi que você demonstrou interesse em [produto]. Posso te ajudar a encontrar a melhor solução?"

2. **Qualificação:** "Para te ajudar melhor, me conta: qual é o seu maior desafio atualmente com [área do problema]?"

3. **Apresentação:** "Baseado no que você me contou, nosso [produto] pode te ajudar porque [benefício principal]..."

4. **Fechamento:** "Que tal começarmos com [oferta especial]? Posso garantir [benefício] se você fechar hoje."

*Dica: Personalize este script com informações do seu produto configurado no agente.*`
    } else if (userMessage.toLowerCase().includes('objeç') || userMessage.toLowerCase().includes('objecao')) {
      aiResponse = `**Principais Objeções e Respostas:**

**1. "Está muito caro"**
> "Entendo sua preocupação com o investimento. Mas me deixa te mostrar: considerando [benefício], o retorno que você terá é de X vezes o valor investido..."

**2. "Preciso pensar"**
> "Claro! Enquanto você pensa, posso te enviar um material com casos de sucesso? Ah, e hoje temos uma condição especial que expira em [prazo]..."

**3. "Já uso outra solução"**
> "Que bom que você já investe nisso! Me conta: o que você mais gosta da solução atual? E o que poderia ser melhor?"

**4. "Não tenho tempo agora"**
> "Sem problemas! Posso te mandar um resumo por áudio de 2 minutos? Assim você ouve quando puder."`
    } else if (userMessage.toLowerCase().includes('copy') || userMessage.toLowerCase().includes('mensagem')) {
      aiResponse = `**Sugestões de Copy para WhatsApp:**

**Para Primeiro Contato:**
"Oi [Nome]! Tudo bem? Sou [seu nome] da [empresa]. Vi que você se interessou por [produto/serviço]. Posso te mostrar como [benefício principal] em apenas [tempo]?"

**Para Follow-up:**
"Oi [Nome]! Lembra que conversamos sobre [assunto]? Tenho uma novidade que pode te interessar..."

**Para Reengajar:**
"[Nome], sentimos sua falta! Preparamos algo especial para você: [oferta]. Válido só até [data]."

**Para Pós-venda:**
"Oi [Nome]! Como está sendo sua experiência com [produto]? Estou aqui se precisar de qualquer ajuda!"`
    } else {
      aiResponse = `Analisei sua solicitação sobre "${userMessage.substring(0, 50)}..."

**Algumas observações:**

1. Para uma análise mais precisa, recomendo que você configure seu agente IA com informações detalhadas sobre seu produto e mercado.

2. Baseado nas melhores práticas de atendimento via WhatsApp:
   - Respostas rápidas aumentam conversão em até 400%
   - Mensagens personalizadas têm 26% mais engajamento
   - Follow-ups estratégicos recuperam 30% dos leads perdidos

**Próximos passos sugeridos:**
- Configure seu agente com informações do produto
- Defina suas principais objeções e respostas
- Crie templates de mensagens personalizadas

Posso te ajudar com algo mais específico?`
    }

    setIsTyping(false)
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
  }

  // Enviar mensagem
  const handleSendMessage = async (message) => {
    if (!message.trim()) return

    const userMessage = message.trim()
    setInputValue('')

    if (!chatStarted) {
      setChatStarted(true)
    }

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    // Simular resposta da IA
    await simulateAIResponse(userMessage)
  }

  // Submissão do formulário
  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  // Clique em sugestão
  const handleSuggestionClick = (prompt) => {
    handleSendMessage(prompt)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  // Nome do usuário para greeting
  const userName = userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Gradientes de fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #00FF99 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #00FF99 0%, #8B5CF6 100%)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-semibold">SwiftBot Interação IA</h1>
                <p className="text-xs text-[#B0B0B0]">Assistente inteligente</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span className="text-xs text-[#8B5CF6] font-medium">Modo Criativo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 pt-20 ${chatStarted ? 'pb-32' : 'pb-8'}`}>
        {!chatStarted ? (
          /* ============================================
             ESTADO 1: HERO (Inicial)
             ============================================ */
          <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4">
            <div className="max-w-3xl w-full text-center">
              {/* Greeting */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-white">Olá, </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #00FF99 0%, #00BFFF 50%, #8B5CF6 100%)' }}
                >
                  {userName}
                </span>
              </h1>
              <p className="text-[#B0B0B0] text-lg md:text-xl mb-12">
                Como posso te ajudar a vender mais hoje?
              </p>

              {/* Input Principal */}
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="relative group">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="Pergunte sobre seu negócio, clientes, scripts, objeções..."
                    rows={3}
                    className="w-full bg-[#111111] text-white placeholder-gray-500 rounded-2xl px-6 py-5 pr-14 border border-white/10 outline-none resize-none transition-all duration-300 focus:border-[#00FF99]/50 focus:shadow-[0_0_30px_rgba(0,255,153,0.1)] focus:bg-[#151515]"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="absolute right-4 bottom-4 p-2 rounded-xl bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </form>

              {/* Sugestões (Pills) */}
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#111111] border border-white/10 text-[#B0B0B0] hover:border-[#00FF99]/30 hover:text-white hover:bg-[#151515] transition-all duration-300 group"
                  >
                    <span className="text-[#00FF99] group-hover:scale-110 transition-transform">
                      {suggestion.icon}
                    </span>
                    <span className="text-sm font-medium">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================
             ESTADO 2: CHAT ATIVO
             ============================================ */
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex gap-3 max-w-[85%]">
                      {/* Avatar IA */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1"
                        style={{ background: 'linear-gradient(135deg, #00FF99 0%, #8B5CF6 100%)' }}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      {/* Mensagem IA */}
                      <div className="bg-[#111111] border border-white/10 rounded-2xl rounded-tl-none p-5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00FF99] to-[#8B5CF6]" />
                        <div className="text-white text-sm leading-relaxed whitespace-pre-wrap pl-2">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}

                  {message.role === 'user' && (
                    <div className="max-w-[85%]">
                      <div className="bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black rounded-2xl rounded-tr-none p-5">
                        <div className="text-sm font-medium leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #00FF99 0%, #8B5CF6 100%)' }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div className="bg-[#111111] border border-white/10 rounded-2xl rounded-tl-none p-5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Fixo (apenas no estado de chat) */}
      {chatStarted && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-[#111111] text-white placeholder-gray-500 rounded-xl px-5 py-4 border border-white/10 outline-none transition-all duration-300 focus:border-[#00FF99]/50 focus:shadow-[0_0_20px_rgba(0,255,153,0.1)]"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-4 rounded-xl bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
