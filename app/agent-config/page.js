'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// ==================================================================================
// 🎨 COMPONENTE CUSTOM SELECT (Estilo Header SwiftBot)
// ==================================================================================
// Este componente simula o comportamento do seu Header Mobile:
// Um container único que expande (acordeão) em vez de abrir um popup separado.
const CustomSelect = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Encontra o label da opção selecionada para exibir no topo
  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">
        {label}
      </label>
      
      {/* Container Principal - A "Cápsula" */}
      <div 
        className={`
          bg-[#1E1E1E] w-full transition-all duration-300 ease-out overflow-hidden
          border border-transparent
          ${isOpen ? 'rounded-[28px] shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-[#282828]' : 'rounded-3xl'}
        `}
      >
        {/* Cabeçalho do Select (O Trigger) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left outline-none"
        >
          <span className={`${!value ? 'text-gray-500' : 'text-white'} transition-colors`}>
            {displayValue}
          </span>
          
          {/* Ícone que gira */}
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Lista de Opções (O Drop Continuo) */}
        <div 
          className={`
            transition-all duration-300 ease-out 
            ${isOpen ? 'max-h-[300px] opacity-100 pb-2' : 'max-h-0 opacity-0'}
            overflow-y-auto custom-scrollbar
          `}
        >
          <div className="flex flex-col px-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`
                  px-4 py-3 text-sm text-left rounded-xl transition-all duration-200
                  ${value === opt.value 
                    ? 'bg-[#00FF99]/10 text-[#00FF99] font-medium' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================================================================================
// 💾 DADOS DAS OPÇÕES (Constants)
// ==================================================================================
const SECTORS = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'comercio', label: 'Comércio / Varejo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'outro', label: 'Outro' }
]

const PERSONALITIES = [
  { value: 'amigavel', label: '😊 Amigável e Descontraído' },
  { value: 'formal', label: '🎩 Formal e Profissional' },
  { value: 'tecnico', label: '🔧 Técnico e Objetivo' },
  { value: 'vendas', label: '💼 Focado em Vendas (Agressivo)' },
  { value: 'suporte', label: '🛠️ Empático (Suporte)' }
]

const OBJECTIVES = [
  { value: 'vendas', label: '🎯 Gerar e converter vendas' },
  { value: 'suporte', label: '🛠️ Suporte ao cliente' },
  { value: 'informacoes', label: '📢 Fornecer informações' },
  { value: 'qualificacao', label: '✅ Qualificar leads' },
  { value: 'agendamento', label: '📅 Agendar consultas/reuniões' }
]

export default function AgentConfigPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const connectionId = searchParams.get('connectionId')

  // Estilos base para inputs de texto (mantendo a consistência)
  const inputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-500 !rounded-3xl px-6 py-4 border border-transparent outline-none focus:outline-none focus:!rounded-3xl focus:bg-[#282828] focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 ease-in-out"
  
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

  // Handler genérico para inputs de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handler específico para o CustomSelect
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Se mudou o objetivo, reseta as perguntas específicas
    if (name === 'botObjective') {
       setFormData(prev => ({ ...prev, objectiveQuestions: [] }))
    }
  }

  const generateWelcomeMessage = () => {
    if (formData.companyName) {
      const agentName = formData.agentName || 'assistente virtual'
      const message = `Olá! 👋 Sou ${agentName} da ${formData.companyName}. Como posso ajudá-lo hoje?`
      setFormData(prev => ({ ...prev, welcomeMessage: message }))
    }
  }

  const generateAgentNameSuggestions = () => {
    const suggestions = [
      'Ana', 'Carlos', 'Maria', 'João', 'Carla', 'Pedro', 'Julia', 'Bruno',
      'Assistente Virtual', 'Bot da Empresa', 'Atendente Digital'
    ]
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    setFormData(prev => ({ ...prev, agentName: randomSuggestion }))
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
    setFormData(prev => ({ ...prev, objectionsQA: commonObjections }))
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
      case 'qualificacao': return { question: '' }
      case 'informacoes': return { info: '', details: '' }
      case 'suporte': return { problem: '', solution: '' }
      case 'vendas': return { question: '' }
      case 'agendamento': return { question: '' }
      default: return { question: '' }
    }
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
            case 'agendamento': return item.question && item.question.trim()
            case 'informacoes': return item.info && item.info.trim() && item.details && item.details.trim()
            case 'suporte': return item.problem && item.problem.trim() && item.solution && item.solution.trim()
            default: return false
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

      try {
        await fetch('/api/n8n/update-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, connectionId, agentData })
        })
      } catch (webhookError) {
        console.warn('Webhook call skipped or failed', webhookError)
      }

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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="relative z-10 max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white flex items-center gap-3">
              Configurar Agente IA
            </h1>
            <p className="text-[#B0B0B0] text-lg mt-3">
              Treine a inteligência artificial do seu negócio
            </p>
          </div>
        </div>

        {/* Container Principal com Borda Gradiente (RGB) */}
        <div 
          className="rounded-3xl p-[2px]"
          style={{
            backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)',
          }}
        >
          <div className="bg-[#111111] rounded-[22px] p-8 sm:p-12">
            
            <form onSubmit={handleSubmit} className="space-y-12">
              
              {/* Seção 1: Identidade do Agente */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Identidade e Negócio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Nome da Empresa</label>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Ex: TechSolutions Ltda"
                      className={inputClass}
                    />
                  </div>

                  {/* Novo Select Personalizado - Setor */}
                  <div>
                    <CustomSelect
                      label="Setor de Atuação"
                      value={formData.businessSector}
                      onChange={(val) => handleSelectChange('businessSector', val)}
                      options={SECTORS}
                      placeholder="Selecione o setor"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2 ml-4">
                    <label className="block text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Nome do Agente</label>
                    <button type="button" onClick={generateAgentNameSuggestions} className="text-xs text-[#00FF99] hover:underline">
                      🎲 Gerar Sugestão
                    </button>
                  </div>
                  <input
                    type="text"
                    name="agentName"
                    value={formData.agentName}
                    onChange={handleInputChange}
                    placeholder="Ex: Ana, Assistente Virtual..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Seção 2: Personalidade */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Personalidade e Tom
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Novo Select Personalizado - Personalidade */}
                  <div>
                    <CustomSelect
                      label="Estilo de Comunicação"
                      value={formData.personality}
                      onChange={(val) => handleSelectChange('personality', val)}
                      options={PERSONALITIES}
                      placeholder="Selecione a personalidade"
                    />
                  </div>

                  {/* Novo Select Personalizado - Objetivo */}
                  <div>
                    <CustomSelect
                      label="Objetivo do Bot"
                      value={formData.botObjective}
                      onChange={(val) => handleSelectChange('botObjective', val)}
                      options={OBJECTIVES}
                      placeholder="Selecione o objetivo"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Conhecimento do Produto */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Conhecimento do Produto
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Descrição do Produto/Serviço</label>
                  <textarea
                    name="productDescription"
                    value={formData.productDescription}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Descreva detalhadamente o que você vende..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Link do Produto</label>
                    <input
                      type="url"
                      name="productUrl"
                      value={formData.productUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Preço / Faixa</label>
                    <input
                      type="text"
                      name="priceRange"
                      value={formData.priceRange}
                      onChange={handleInputChange}
                      placeholder="Ex: R$ 99,90"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Perguntas e Objeções (Estilo Cards) */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Treinamento de Objeções
                  </h3>
                  <button
                    type="button"
                    onClick={addCommonObjections}
                    className="text-sm text-red-400 hover:text-red-300 underline decoration-dotted"
                  >
                    Carregar Objeções Comuns
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.objectionsQA.map((item, index) => (
                    <div key={index} className="bg-[#1E1E1E] rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Objeção #{index + 1}</span>
                        {formData.objectionsQA.length > 1 && (
                          <button type="button" onClick={() => removeObjectionQA(index)} className="text-red-500 hover:text-red-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {/* Inputs internos dos cards */}
                        <input
                          type="text"
                          value={item.question}
                          onChange={(e) => updateObjectionQA(index, 'question', e.target.value)}
                          placeholder="O que o cliente pergunta? (Ex: Está caro)"
                          className={inputClass}
                        />
                        <textarea
                          value={item.answer}
                          onChange={(e) => updateObjectionQA(index, 'answer', e.target.value)}
                          rows={2}
                          placeholder="O que o bot deve responder?"
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addObjectionQA}
                    disabled={formData.objectionsQA.length >= 6}
                    className="w-full py-3 border border-dashed border-gray-700 rounded-3xl text-gray-400 hover:border-white hover:text-white transition-all"
                  >
                    + Adicionar Nova Objeção
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-4 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white rounded-3xl font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-4 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-3xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all flex items-center gap-2"
                >
                  {saving ? 'Salvando...' : 'Salvar e Ativar Agente'}
                  {!saving && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}