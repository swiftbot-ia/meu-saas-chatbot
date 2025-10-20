'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AgentConfig() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const searchParams = useSearchParams()
  const connectionId = searchParams.get('connectionId')

  // Estados do formulário
  const [formData, setFormData] = useState({
    companyName: '',
    businessSector: '',
    personality: 'amigavel',
    businessHours: '24h',
    welcomeMessage: '',
    defaultResponse: 'Desculpe, não entendi sua pergunta. Pode reformular?',
    productDescription: '',
    botObjective: 'vendas',
    productUrl: '',
    priceRange: '',
    startTime: '08:00',
    endTime: '18:00',
    offHoursMessage: '',
    agentName: '',
    objectionsQA: [{ question: '', answer: '' }],
    objectiveQuestions: [],
    salesCTA: '',
  })

  // Mouse tracking para efeitos visuais
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      loadExistingConfig(user.id)
    }
    setLoading(false)
  }

  const loadExistingConfig = async (userId) => {
    try {
      const query = supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', userId)

      if (connectionId) {
        query.eq('connection_id', connectionId)
      }

      const { data, error } = await query.single()

      if (data && !error) {
        setFormData({
          companyName: data.company_name || '',
          businessSector: data.business_sector || '',
          personality: data.personality || 'amigavel',
          businessHours: data.business_hours || '24h',
          welcomeMessage: data.welcome_message || '',
          defaultResponse: data.default_response || 'Desculpe, não entendi sua pergunta. Pode reformular?',
          productDescription: data.product_description || '',
          botObjective: data.bot_objective || 'vendas',
          productUrl: data.product_url || '',
          priceRange: data.price_range || '',
          startTime: data.start_time || '08:00',
          endTime: data.end_time || '18:00',
          offHoursMessage: data.off_hours_message || '',
          agentName: data.agent_name || '',
          objectionsQA: data.objections_qa && data.objections_qa.length > 0 ? data.objections_qa : [{ question: '', answer: '' }],
          objectiveQuestions: data.objective_questions || [],
          salesCTA: data.sales_cta || ''
        })
      }
    } catch (error) {
      console.log('Nenhuma configuração existente encontrada')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const generateWelcomeMessage = () => {
    if (formData.companyName) {
      const agentName = formData.agentName || 'assistente virtual'
      const message = `Olá! 👋 Sou ${agentName} da ${formData.companyName}. Como posso ajudá-lo hoje?`
      setFormData(prev => ({
        ...prev,
        welcomeMessage: message
      }))
    }
  }

  const generateAgentNameSuggestions = () => {
    const suggestions = [
      'Ana', 'Carlos', 'Maria', 'João', 'Carla', 'Pedro', 'Julia', 'Bruno',
      'Assistente Virtual', 'Bot da Empresa', 'Atendente Digital'
    ]
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    setFormData(prev => ({
      ...prev,
      agentName: randomSuggestion
    }))
  }

  const addObjectionQA = () => {
    if (formData.objectionsQA.length < 6) {
      setFormData(prev => ({
        ...prev,
        objectionsQA: [...prev.objectionsQA, { question: '', answer: '' }]
      }))
    }
  }

  const removeObjectionQA = (index) => {
    if (formData.objectionsQA.length > 1) {
      setFormData(prev => ({
        ...prev,
        objectionsQA: prev.objectionsQA.filter((_, i) => i !== index)
      }))
    }
  }

  const updateObjectionQA = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      objectionsQA: prev.objectionsQA.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addCommonObjections = () => {
    const commonObjections = [
      { question: "Muito caro", answer: "O investimento se paga em poucos dias com o aumento nas vendas. Quanto vale economizar tempo e vender mais?" },
      { question: "Não sei mexer", answer: "Foi desenvolvido para pessoas sem conhecimento técnico, com passo a passo simples. Gostaria de ver como funciona?" },
      { question: "Não funciona", answer: "Nossos clientes relatam aumento de 30-80% nas conversões. Qual seria o impacto disso no seu negócio?" }
    ]
    
    setFormData(prev => ({
      ...prev,
      objectionsQA: commonObjections
    }))
  }

  const addObjectiveQuestion = () => {
    if (formData.objectiveQuestions.length < 7) {
      const newQuestion = getEmptyQuestionByObjective()
      setFormData(prev => ({
        ...prev,
        objectiveQuestions: [...prev.objectiveQuestions, newQuestion]
      }))
    }
  }

  const removeObjectiveQuestion = (index) => {
    if (formData.objectiveQuestions.length > 0) {
      setFormData(prev => ({
        ...prev,
        objectiveQuestions: prev.objectiveQuestions.filter((_, i) => i !== index)
      }))
    }
  }

  const updateObjectiveQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      objectiveQuestions: prev.objectiveQuestions.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const getEmptyQuestionByObjective = () => {
    switch (formData.botObjective) {
      case 'qualificacao':
        return { question: '' }
      case 'informacoes':
        return { info: '', details: '' }
      case 'suporte':
        return { problem: '', solution: '' }
      case 'vendas':
        return { question: '' }
      case 'agendamento':
        return { question: '' }
      default:
        return { question: '' }
    }
  }

  const handleObjectiveChange = (e) => {
    const newObjective = e.target.value
    setFormData(prev => ({
      ...prev,
      botObjective: newObjective,
      objectiveQuestions: []
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const agentData = {
        user_id: user.id,
        connection_id: connectionId,
        company_name: formData.companyName,
        business_sector: formData.businessSector,
        personality: formData.personality,
        business_hours: formData.businessHours,
        welcome_message: formData.welcomeMessage,
        default_response: formData.defaultResponse,
        product_description: formData.productDescription,
        bot_objective: formData.botObjective,
        product_url: formData.productUrl,
        price_range: formData.priceRange,
        start_time: formData.startTime,
        end_time: formData.endTime,
        off_hours_message: formData.offHoursMessage,
        agent_name: formData.agentName,
        objections_qa: formData.objectionsQA.filter(item => item.question && item.question.trim() && item.answer && item.answer.trim()),
        objective_questions: formData.objectiveQuestions.filter(item => {
          switch (formData.botObjective) {
            case 'qualificacao':
            case 'vendas':
            case 'agendamento':
              return item.question && item.question.trim()
            case 'informacoes':
              return item.info && item.info.trim() && item.details && item.details.trim()
            case 'suporte':
              return item.problem && item.problem.trim() && item.solution && item.solution.trim()
            default:
              return false
          }
        }),
        sales_cta: formData.salesCTA || '',
        is_active: true
      }

      const { error } = await supabase
        .from('ai_agents')
        .upsert(agentData, {
          onConflict: connectionId ? 'user_id,connection_id' : 'user_id'
        })

      if (error) throw error

      await fetch('/api/n8n/update-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, connectionId, agentData })
      })

      alert('✅ Agente configurado com sucesso!')
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar configuração: ' + error.message)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-[#04F5A0] rounded-2xl flex items-center justify-center mx-auto animate-pulse mb-4">
              <div className="w-8 h-8 bg-black rounded-sm" 
                   style={{
                     clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                   }}
              />
            </div>
            <div className="absolute inset-0 bg-[#04F5A0]/30 rounded-2xl blur-xl animate-pulse mx-auto w-16 h-16" />
          </div>
          <p className="text-gray-300">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(4, 245, 160, 0.15) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }}
        />
      </div>

      {/* Dynamic Gradient */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(4, 245, 160, 0.08), transparent 40%)`
        }}
      />

      {/* Header */}
      <header className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-[#04F5A0] mr-4 transition-colors duration-300 flex items-center"
              >
                <span className="mr-2">←</span> Voltar
              </button>
              <div className="w-8 h-8 mr-3 flex items-center justify-center">
                <div className="w-6 h-6 bg-[#04F5A0] rounded-sm opacity-90 hover:opacity-100 transition-all duration-300 hover:shadow-[0_0_15px_rgba(4,245,160,0.6)]" 
                     style={{
                       clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                     }}
                />
              </div>
              <h1 className="text-xl font-bold text-white hover:text-[#04F5A0] transition-colors duration-300">
                Configurar Agente IA
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-[#04F5A0]/30 transition-all duration-500 relative overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 right-0 w-32 h-32 bg-pink-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-violet-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          
          {/* Glass Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-[#04F5A0] to-white bg-clip-text text-transparent mb-4">
                Personalize seu Assistente Virtual 🎯
              </h2>
              <p className="text-gray-400">
                Configure a personalidade e as respostas do seu chatbot WhatsApp
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informações da Empresa */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 left-0 w-28 h-28 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-blue-600/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-blue-400 mb-6 flex items-center">
                    📢 Informações da Empresa
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: TechSolutions Ltda"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Setor/Área de Atuação *
                      </label>
                      <select
                        name="businessSector"
                        required
                        value={formData.businessSector}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      >
                        <option value="">Selecione o setor</option>
                        <option value="tecnologia">Tecnologia</option>
                        <option value="saude">Saúde</option>
                        <option value="educacao">Educação</option>
                        <option value="comercio">Comércio</option>
                        <option value="servicos">Serviços</option>
                        <option value="industria">Indústria</option>
                        <option value="alimentacao">Alimentação</option>
                        <option value="imobiliario">Imobiliário</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalidade do Bot */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/30 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-600/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-green-400 mb-6 flex items-center">
                    🎭 Personalidade do Bot
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Estilo de Comunicação *
                      </label>
                      <select
                        name="personality"
                        value={formData.personality}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      >
                        <option value="amigavel">😊 Amigável e Descontraído</option>
                        <option value="formal">🎩 Formal e Profissional</option>
                        <option value="tecnico">🔧 Técnico e Objetivo</option>
                        <option value="vendas">💼 Focado em Vendas</option>
                        <option value="suporte">🛠️ Suporte ao Cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Horário de Funcionamento
                      </label>
                      <select
                        name="businessHours"
                        value={formData.businessHours}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      >
                        <option value="24h">🌍 24 horas (sempre ativo)</option>
                        <option value="comercial">🏢 Comercial (8h às 18h)</option>
                        <option value="estendido">🌙 Estendido (8h às 22h)</option>
                        <option value="personalizado">⚙️ Personalizado</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-300">
                        👤 Nome do seu Assistente Virtual *
                      </label>
                      <button
                        type="button"
                        onClick={generateAgentNameSuggestions}
                        className="text-xs bg-[#04F5A0]/20 hover:bg-[#04F5A0]/30 border border-[#04F5A0]/50 text-[#04F5A0] px-3 py-1 rounded-lg transition-all duration-300"
                      >
                        💡 Sugestão
                      </button>
                    </div>
                    <input
                      type="text"
                      name="agentName"
                      required
                      value={formData.agentName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      placeholder="Ex: Ana, Carlos, Assistente Virtual..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      💡 <strong>Dica:</strong> Escolha um nome que combine com a personalidade da sua empresa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 left-0 w-36 h-36 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-28 h-28 bg-violet-600/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.2s'}}></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-purple-400 flex items-center">
                      💬 Mensagens do Bot
                    </h3>
                    <button
                      type="button"
                      onClick={generateWelcomeMessage}
                      className="text-sm bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 px-4 py-2 rounded-lg transition-all duration-300"
                    >
                      Gerar Automático
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Mensagem de Boas-vindas
                      </label>
                      <textarea
                        name="welcomeMessage"
                        value={formData.welcomeMessage}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: Olá! Sou o assistente virtual da [Empresa]. Como posso ajudá-lo hoje?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resposta Padrão (quando não entender)
                      </label>
                      <textarea
                        name="defaultResponse"
                        value={formData.defaultResponse}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: Desculpe, não entendi. Pode reformular sua pergunta?"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruções Específicas do Negócio */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-600/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-orange-400 mb-6">
                    📝 Instruções Específicas do Negócio
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descreva seu produto/serviço principal
                      </label>
                      <textarea
                        name="productDescription"
                        value={formData.productDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: Vendemos cursos de automação para WhatsApp usando n8n e IA..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Objetivo principal do bot
                      </label>
                      <select
                        name="botObjective"
                        value={formData.botObjective}
                        onChange={handleObjectiveChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                      >
                        <option value="vendas">🎯 Gerar e converter vendas</option>
                        <option value="suporte">🛠️ Suporte ao cliente</option>
                        <option value="informacoes">📢 Fornecer informações</option>
                        <option value="qualificacao">✅ Qualificar leads</option>
                        <option value="agendamento">📅 Agendar consultas</option>
                      </select>
                    </div>

                    {formData.botObjective && (
                      <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative overflow-hidden">
                        {/* Mini Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/30 rounded-full blur-xl animate-pulse"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            {formData.botObjective === 'qualificacao' && '📋 Perguntas Obrigatórias de Qualificação'}
                            {formData.botObjective === 'informacoes' && '📚 Informações Importantes para Fornecer'}
                            {formData.botObjective === 'suporte' && '🛠️ Principais Problemas e Soluções'}
                            {formData.botObjective === 'vendas' && '💰 Perguntas de Qualificação para Vendas'}
                            {formData.botObjective === 'agendamento' && '📅 Perguntas para Agendamento'}
                          </h4>
                          
                          <p className="text-sm text-gray-400 mb-4">
                            {formData.botObjective === 'qualificacao' && '💡 Configure até 7 perguntas que o bot deve fazer para qualificar leads.'}
                            {formData.botObjective === 'informacoes' && '💡 Configure até 7 informações importantes que o bot deve saber para informar clientes.'}
                            {formData.botObjective === 'suporte' && '💡 Configure até 7 problemas comuns e suas respectivas soluções.'}
                            {formData.botObjective === 'vendas' && '💡 Configure até 7 perguntas de qualificação antes do CTA de vendas.'}
                            {formData.botObjective === 'agendamento' && '💡 Configure até 7 perguntas necessárias para agendar consultas.'}
                          </p>

                          <div className="space-y-4">
                            {formData.objectiveQuestions.map((item, index) => (
                              <div key={index} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-300">
                                    {formData.botObjective === 'qualificacao' && `Pergunta #${index + 1}`}
                                    {formData.botObjective === 'informacoes' && `Informação #${index + 1}`}
                                    {formData.botObjective === 'suporte' && `Problema #${index + 1}`}
                                    {formData.botObjective === 'vendas' && `Pergunta #${index + 1}`}
                                    {formData.botObjective === 'agendamento' && `Pergunta #${index + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeObjectiveQuestion(index)}
                                    className="text-red-400 hover:text-red-300 text-sm transition-colors duration-300"
                                  >
                                    🗑️ Remover
                                  </button>
                                </div>
                                
                                <div className="space-y-3">
                                  {(['qualificacao', 'vendas', 'agendamento'].includes(formData.botObjective)) && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400 mb-1">
                                        ❓ Pergunta:
                                      </label>
                                      <input
                                        type="text"
                                        value={item.question || ''}
                                        onChange={(e) => updateObjectiveQuestion(index, 'question', e.target.value)}
                                        className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                        placeholder="Ex: Qual seu orçamento mensal?, Quando precisa da solução?"
                                      />
                                    </div>
                                  )}

                                  {formData.botObjective === 'informacoes' && (
                                    <>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                          📋 Tópico da Informação:
                                        </label>
                                        <input
                                          type="text"
                                          value={item.info || ''}
                                          onChange={(e) => updateObjectiveQuestion(index, 'info', e.target.value)}
                                          className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                          placeholder="Ex: Horário de funcionamento, Formas de pagamento..."
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                          📝 Detalhes da Informação:
                                        </label>
                                        <textarea
                                          value={item.details || ''}
                                          onChange={(e) => updateObjectiveQuestion(index, 'details', e.target.value)}
                                          rows={2}
                                          className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                          placeholder="Ex: Segunda a sexta das 8h às 18h, sábado das 8h às 12h"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {formData.botObjective === 'suporte' && (
                                    <>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                          ⚠️ Problema Comum:
                                        </label>
                                        <input
                                          type="text"
                                          value={item.problem || ''}
                                          onChange={(e) => updateObjectiveQuestion(index, 'problem', e.target.value)}
                                          className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                          placeholder="Ex: Login não funciona, Esqueci minha senha..."
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">
                                          ✅ Solução:
                                        </label>
                                        <textarea
                                          value={item.solution || ''}
                                          onChange={(e) => updateObjectiveQuestion(index, 'solution', e.target.value)}
                                          rows={2}
                                          className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                          placeholder="Ex: Verifique se o email está correto e tente resetar a senha..."
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            <div className="flex justify-center pt-2">
                              <button
                                type="button"
                                onClick={addObjectiveQuestion}
                                disabled={formData.objectiveQuestions.length >= 7}
                                className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-xl disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 transition-all duration-300 flex items-center"
                              >
                                ➕ Adicionar ({formData.objectiveQuestions.length}/7)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.botObjective === 'vendas' && (
                      <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 relative overflow-hidden">
                        {/* Mini Animated Background */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-500/30 rounded-full blur-lg animate-pulse"></div>
                        </div>
                        
                        <div className="relative z-10">
                          <h4 className="text-lg font-semibold text-green-400 mb-2">
                            🎯 Call-to-Action (CTA) de Vendas
                          </h4>
                          <p className="text-sm text-gray-400 mb-3">
                            💡 Mensagem final que o bot enviará para conduzir à compra após as perguntas de qualificação.
                          </p>
                          <textarea
                            value={formData.salesCTA}
                            onChange={(e) => setFormData(prev => ({ ...prev, salesCTA: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                            placeholder="Ex: Perfeito! Baseado no que me contou, nossa solução é ideal para você. Acesse o link abaixo..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estratégia de Vendas */}
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/30 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-600/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.3s'}}></div>
                </div>
                
                {/* Glass Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-red-400 mb-6">
                    💰 Estratégia de Vendas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Link/URL principal do produto
                      </label>
                      <input
                        type="url"
                        name="productUrl"
                        value={formData.productUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="https://seusite.com/produto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Preço ou faixa de preço
                      </label>
                      <input
                        type="text"
                        name="priceRange"
                        value={formData.priceRange}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: R$ 197 ou Entre R$ 100-500"
                      />
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    {/* Mini Animated Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-white">
                          🛡️ Principais Objeções e Respostas
                        </h4>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-4">
                        💡 Configure respostas prontas para as principais objeções dos seus clientes.
                      </p>

                      <div className="space-y-4">
                        {formData.objectionsQA.map((item, index) => (
                          <div key={index} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-300">
                                Objeção #{index + 1}
                              </span>
                              {formData.objectionsQA.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeObjectionQA(index)}
                                  className="text-red-400 hover:text-red-300 text-sm transition-colors duration-300"
                                >
                                  🗑️ Remover
                                </button>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                  ❓ Pergunta/Objeção do Cliente:
                                </label>
                                <input
                                  type="text"
                                  value={item.question}
                                  onChange={(e) => updateObjectionQA(index, 'question', e.target.value)}
                                  className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                  placeholder="Ex: Muito caro, Não sei mexer, Não funciona..."
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                  💬 Resposta do Bot:
                                </label>
                                <textarea
                                  value={item.answer}
                                  onChange={(e) => updateObjectionQA(index, 'answer', e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300 text-sm"
                                  placeholder="Ex: O investimento se paga em poucos dias com o aumento nas vendas..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-center gap-4 pt-4">
                        <button
                          type="button"
                          onClick={addObjectionQA}
                          disabled={formData.objectionsQA.length >= 6}
                          className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600 transition-all duration-300 flex items-center"
                        >
                          ➕ Adicionar ({formData.objectionsQA.length}/6)
                        </button>
                        <button
                          type="button"
                          onClick={addCommonObjections}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 text-red-400 px-4 py-2 rounded-xl transition-all duration-300"
                        >
                          💡 Objeções Comuns
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        ⚡ <strong>Dica:</strong> Termine sempre as respostas com uma pergunta que conduza à venda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Horário de Funcionamento Detalhado */}
              {formData.businessHours === 'personalizado' && (
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                  {/* Animated Background Effects */}
                  <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gray-500/30 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-slate-600/25 rounded-full blur-xl animate-pulse" style={{animationDelay: '1.1s'}}></div>
                  </div>
                  
                  {/* Glass Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-sm pointer-events-none"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-gray-400 mb-6">
                      ⏰ Horário Personalizado
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Horário de Início
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Horário de Fim
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Mensagem fora do horário
                      </label>
                      <textarea
                        name="offHoursMessage"
                        value={formData.offHoursMessage}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#04F5A0] focus:border-[#04F5A0] outline-none transition-all duration-300"
                        placeholder="Ex: Obrigado pelo contato! Nosso horário é das 8h às 18h. Retornaremos em breve!"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-between pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-300"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#04F5A0] hover:bg-[#03E691] disabled:bg-gray-600 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(4,245,160,0.5)] flex items-center"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Salvando...
                    </div>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Salvar e Ativar Agente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}