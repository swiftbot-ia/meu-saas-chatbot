'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Plus, MessageCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

// ==================================================================================
// SWIFTBOT IA
// ==================================================================================

export default function SwiftbotProPage() {
  const router = useRouter()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const [expandedMessages, setExpandedMessages] = useState({})

  // Estados principais
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatStarted, setChatStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Estados da sidebar de chats
  const [chatSidebarOpen, setChatSidebarOpen] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Mock de histórico de chats
  const mockChatHistory = [
    { id: 1, title: 'Script de vendas para SaaS', date: 'Hoje', preview: 'Gere um script de vendas...' },
    { id: 2, title: 'Objeções sobre preço', date: 'Hoje', preview: 'Quais são as principais...' },
    { id: 3, title: 'Copy para WhatsApp', date: 'Ontem', preview: 'Sugira textos de copy...' },
    { id: 4, title: 'Análise de mercado', date: 'Ontem', preview: 'Analise meu mercado...' },
    { id: 5, title: 'Estratégia de follow-up', date: '23 Nov', preview: 'Como fazer follow-up...' },
  ]

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

  // ferramenta BOLD
const formatMessage = (content) => {
  return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar histórico de chats mock
  useEffect(() => {
    setChatHistory(mockChatHistory)
  }, [])

  // Verificar usuário
  useEffect(() => {
    checkUser()
  }, [])

const toggleMessageExpand = (index) => {
  setExpandedMessages(prev => ({ ...prev, [index]: !prev[index] }))
}

const MESSAGE_PREVIEW_LENGTH = 280
 // Detectar mobile
useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768)
  checkMobile()
  window.addEventListener('resize', checkMobile)
  return () => window.removeEventListener('resize', checkMobile)
}, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // router.push('/login')
        return
      }
      setUser(user)

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
      // router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Criar novo chat
  const handleNewChat = () => {
    setChatStarted(false)
    setMessages([])
    setActiveChatId(null)
    setInputValue('')
  }

  // Selecionar chat existente
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId)
    setChatStarted(true)
    setMessages([
      { role: 'user', content: 'Pergunta do chat anterior...' },
      { role: 'assistant', content: 'Resposta mockada do assistente para demonstração.' }
    ])
  }

  // Simular resposta da IA
  const simulateAIResponse = async (userMessage) => {
    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 2000))

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
> "Que bom que você já investe nisso! Me conta: o que você mais gosta da solução atual? E o que poderia ser melhor?"`
    } else if (userMessage.toLowerCase().includes('copy') || userMessage.toLowerCase().includes('mensagem')) {
      aiResponse = `**Sugestões de Copy para WhatsApp:**

**Para Primeiro Contato:**
"Oi [Nome]! Tudo bem? Sou [seu nome] da [empresa]. Vi que você se interessou por [produto/serviço]. Posso te mostrar como [benefício principal] em apenas [tempo]?"

**Para Follow-up:**
"Oi [Nome]! Lembra que conversamos sobre [assunto]? Tenho uma novidade que pode te interessar..."

**Para Reengajar:**
"[Nome], sentimos sua falta! Preparamos algo especial para você: [oferta]. Válido só até [data]."`
    } else {
      aiResponse = `Analisei sua solicitação sobre "${userMessage.substring(0, 50)}..."

**Algumas observações:**

1. Para uma análise mais precisa, recomendo que você configure seu agente IA com informações detalhadas sobre seu produto e mercado.

2. Baseado nas melhores práticas de atendimento via WhatsApp:
   - Respostas rápidas aumentam conversão em até 400%
   - Mensagens personalizadas têm 26% mais engajamento
   - Follow-ups estratégicos recuperam 30% dos leads perdidos

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
      const newChat = {
        id: Date.now(),
        title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
        date: 'Agora',
        preview: userMessage
      }
      setChatHistory(prev => [newChat, ...prev])
      setActiveChatId(newChat.id)
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    await simulateAIResponse(userMessage)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  const handleSuggestionClick = (prompt) => {
    handleSendMessage(prompt)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0A0A0A] flex overflow-hidden font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  const userName = userProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário'

  return (
    // ALTERAÇÃO AQUI: Adicionado 'fixed inset-0 z-50 w-screen' para cobrir o layout pai
    <div className=" fixed inset-0 z-50 w-screen h-screen bg-[#0A0A0A] flex overflow-hidden font-sans">
      {/* ============================================
          SIDEBAR DE CHATS (dentro do fluxo, não fixa)
          ============================================ */}
{/* Overlay mobile */}
{isMobile && chatSidebarOpen && (
  <div
    className="fixed inset-0 bg-black/50 z-40 md:hidden"
    onClick={() => setChatSidebarOpen(false)}
  />
)}

<aside
  className={`
    fixed left-0 top-0 h-full bg-[#1F1F1F] z-50
    transition-all duration-300 ease-in-out
    ${chatSidebarOpen ? 'w-[280px]' : 'w-[80px]'}
    ${isMobile && !chatSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
    flex flex-col
  `}
>
  {/* Header */}
  <div className="flex items-center justify-between p-6 border-b border-gray-700">
    {chatSidebarOpen ? (
      <>
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
            <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#00FF99"/>
            <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#00FF99" stroke="#00FF99" strokeWidth="1"/>
          </svg>
          <span className="text-white font-bold text-lg">SwiftBot IA</span>
        </div>
        <button onClick={() => setChatSidebarOpen(false)} className="text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </>
    ) : (
      <button onClick={() => setChatSidebarOpen(true)} className="text-gray-400 hover:text-white transition-colors mx-auto">
        <Menu size={24} />
      </button>
    )}
  </div>

  {/* Navegação */}
  <nav className="flex-1 overflow-y-auto py-6">
    <div className="px-3 mb-4">
      {chatSidebarOpen && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Conversas</h3>
      )}
      
      <button
        onClick={handleNewChat}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 bg-[#00FF99]/10 text-[#00FF99] hover:bg-[#00FF99]/20 transition-all duration-200 ${!chatSidebarOpen && 'justify-center'}`}
      >
        <Plus size={20} className="flex-shrink-0" />
        {chatSidebarOpen && <span className="text-sm font-medium">Novo chat</span>}
      </button>

      {chatSidebarOpen && (
        <ul className="space-y-1 mt-4">
          {chatHistory.map((chat) => (
            <li key={chat.id}>
              <button
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${activeChatId === chat.id ? 'bg-[#00FF99]/10 border-l-4 border-[#00FF99] text-[#00FF99]' : 'text-gray-400 hover:bg-[#272727] hover:text-white'}`}
              >
                <MessageCircle size={18} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-gray-500">{chat.date}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </nav>

  {/* Footer */}
  <div className="border-t border-gray-700 p-4">
    <Link
      href="/dashboard"
      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:bg-[#272727] hover:text-white transition-all duration-200 ${!chatSidebarOpen && 'justify-center'}`}
    >
      <ArrowLeft size={20} className="flex-shrink-0" />
      {chatSidebarOpen && <span className="text-sm font-medium">Voltar ao Dashboard</span>}
    </Link>
  </div>
</aside>

{/* Botão flutuante mobile */}
{isMobile && !chatSidebarOpen && (
  <button
    onClick={() => setChatSidebarOpen(true)}
    className="fixed bottom-24 left-6 z-40 bg-[#00FF99] text-black p-4 rounded-full shadow-lg md:hidden hover:bg-[#00E88C] transition-colors"
  >
    <Menu size={24} />
  </button>
)}

      {/* ============================================
          CONTEÚDO PRINCIPAL
          ============================================ */}
      <div className={`flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 ${chatSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[80px]'}`}>

        {/* Gradientes de fundo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          />
        </div>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto relative z-10 ${chatStarted ? 'pb-24' : ''}`}>
          {!chatStarted ? (
            /* ============================================
               ESTADO 1: HERO (Inicial)
               ============================================ */
            <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
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
                      className="w-full bg-[#1E1E1E] text-white placeholder-gray-500 rounded-3xl px-6 py-5 pr-14 outline-none resize-none ring-1 ring-inset ring-[#1E1E1E] focus:bg-[#282828] focus:ring-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-[background-color,box-shadow,ring-color] duration-200 ease-out"
                    />
<button
  type="submit"
  disabled={!inputValue.trim()}
  className="absolute right-4 bottom-4 p-2 rounded-xl bg-[#1a3d2e] text-[#00FF99] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#224d3a] hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
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
    {/* Mensagem do Assistente - sem balão */}
    {message.role === 'assistant' && (
      <div className="flex gap-3 max-w-[85%]">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #00FF99 0%, #8B5CF6 100%)' }}
        >
          <svg width="18" height="18" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
            <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#ffffff"/>
            <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1"/>
          </svg>
        </div>
<div className="text-white text-sm leading-relaxed whitespace-pre-wrap pt-1">
  {formatMessage(message.content)}
</div>
      </div>
    )}

    {/* Mensagem do Usuário - com balão expansível */}
    {message.role === 'user' && (
      <div className="max-w-[85%]">
        <div className="bg-[#1D4C38] border border-white/10 text-white rounded-2xl rounded-tr-none p-4">
          <div className="text-sm leading-relaxed">
            {message.content.length > MESSAGE_PREVIEW_LENGTH && !expandedMessages[index] ? (
              <>
                {message.content.substring(0, MESSAGE_PREVIEW_LENGTH)}...
                <button
                  onClick={() => toggleMessageExpand(index)}
                  className="flex items-center gap-1 mt-2 text-[#00FF99] text-xs hover:underline"
                >
                  <span>Mostrar mais</span>
                  <ChevronDown size={14} />
                </button>
              </>
            ) : (
              <>
                {message.content}
                {message.content.length > MESSAGE_PREVIEW_LENGTH && (
                  <button
                    onClick={() => toggleMessageExpand(index)}
                    className="flex items-center gap-1 mt-2 text-[#00FF99] text-xs hover:underline"
                  >
                    <span>Mostrar menos</span>
                    <ChevronUp size={14} />
                  </button>
                )}
              </>
            )}
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
        className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #00FF99 0%, #8B5CF6 100%)' }}
      >
        <svg width="18" height="18" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
          <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#ffffff"/>
          <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1"/>
        </svg>
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#00FF99] animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <div className="flex-shrink-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="relative flex items-center gap-3">
                {/* 
                  FIX: White Flash on Blur
                  - Removido: border border-transparent (causa interpolação de cor rgba(0,0,0,0) → branco)
                  - Adicionado: ring-1 ring-inset ring-[#1E1E1E] (invisível = mesma cor do bg)
                  - Focus: ring-white/10 (aparece suavemente)
                  - Transição ESPECÍFICA: transition-[background-color,box-shadow,ring-color]
                  - Duração reduzida: duration-200 ease-out (mais suave)
                */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-[#1E1E1E] text-white placeholder-gray-500 rounded-3xl px-6 py-4 outline-none ring-1 ring-inset ring-[#1E1E1E] focus:bg-[#282828] focus:ring-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-[background-color,box-shadow,ring-color] duration-200 ease-out"
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
    </div>
  )
}